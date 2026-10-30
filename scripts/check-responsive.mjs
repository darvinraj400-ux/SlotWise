import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const CHROME = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.SLOTWISE_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.SLOTWISE_E2E_EMAIL;
const PASSWORD = process.env.SLOTWISE_E2E_PASSWORD;
const PORT = Number(process.env.SLOTWISE_CDP_PORT ?? 9335);

const VIEWPORTS = [
  { name: "mobile-320", width: 320, height: 640, mobile: true },
  { name: "mobile-360", width: 360, height: 740, mobile: true },
  { name: "mobile-390", width: 390, height: 844, mobile: true },
  { name: "mobile-430", width: 430, height: 932, mobile: true },
  { name: "tablet-768", width: 768, height: 1024, mobile: true },
  { name: "desktop-1280", width: 1280, height: 900, mobile: false },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const item = this.pending.get(message.id);
        if (!item) return;
        this.pending.delete(message.id);
        if (message.error) item.reject(new Error(JSON.stringify(message.error)));
        else item.resolve(message.result);
        return;
      }
      for (const handler of this.listeners.get(message.method) ?? []) handler(message.params);
    });
  }
  async open() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  once(method, timeout = 15000) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), timeout);
      const handler = (params) => {
        clearTimeout(timer);
        this.listeners.set(
          method,
          (this.listeners.get(method) ?? []).filter((entry) => entry !== handler),
        );
        resolve(params);
      };
      this.listeners.set(method, [...(this.listeners.get(method) ?? []), handler]);
    });
  }
  on(method, handler) {
    this.listeners.set(method, [...(this.listeners.get(method) ?? []), handler]);
  }
  close() {
    this.ws.close();
  }
}

async function waitForEndpoint() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (response.ok) return;
    } catch {}
    await sleep(300);
  }
  throw new Error("Chrome debugging endpoint did not start.");
}

async function main() {
  if (!EMAIL || !PASSWORD) {
    console.error("Set SLOTWISE_E2E_EMAIL and SLOTWISE_E2E_PASSWORD for a local test account.");
    process.exitCode = 2;
    return;
  }
  if (!existsSync(CHROME)) {
    console.error(`Chrome not found at ${CHROME}. Set CHROME_PATH to the executable.`);
    process.exitCode = 2;
    return;
  }

  const hostname = new URL(BASE).hostname;
  if (!["localhost", "127.0.0.1", "::1"].includes(hostname)) {
    console.error("Refusing to send test credentials to a non-local host.");
    process.exitCode = 2;
    return;
  }

  const profile = path.join(tmpdir(), `slotwise-responsive-${Date.now()}`);
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  let cdp;
  try {
    await waitForEndpoint();
    const targetResponse = await fetch(
      `http://127.0.0.1:${PORT}/json/new?${encodeURIComponent("about:blank")}`,
      { method: "PUT" },
    );
    const target = await targetResponse.json();
    cdp = new Cdp(target.webSocketDebuggerUrl);
    await cdp.open();

    const errors = [];
    cdp.on("Runtime.exceptionThrown", (params) => {
      errors.push(params.exceptionDetails?.exception?.description ?? "exception");
    });
    cdp.on("Runtime.consoleAPICalled", (params) => {
      if (params.type === "error") {
        errors.push(params.args.map((arg) => arg.value ?? arg.description ?? "").join(" "));
      }
    });

    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    async function evaluate(expression, awaitPromise = false) {
      const result = await cdp.send("Runtime.evaluate", {
        expression,
        awaitPromise,
        returnByValue: true,
      });
      if (result.exceptionDetails) {
        throw new Error(JSON.stringify(result.exceptionDetails).slice(0, 800));
      }
      return result.result?.value;
    }

    async function waitFor(expression, timeout = 20000) {
      const started = Date.now();
      while (Date.now() - started < timeout) {
        try {
          if (await evaluate(expression)) return true;
        } catch {}
        await sleep(300);
      }
      return false;
    }

    async function navigate(url) {
      const loaded = cdp.once("Page.loadEventFired", 30000);
      await cdp.send("Page.navigate", { url });
      await loaded;
      await waitFor(
        `document.readyState === "complete" && Boolean(document.querySelector("h1"))`,
        30000,
      );
      await evaluate(`document.fonts.ready.then(() => true)`, true);
      await sleep(600);
    }

    async function setViewport(viewport) {
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: viewport.mobile ? 2 : 1,
        mobile: viewport.mobile,
      });
      await cdp.send("Emulation.setTouchEmulationEnabled", {
        enabled: viewport.mobile,
        maxTouchPoints: viewport.mobile ? 5 : 1,
      });
      await evaluate("window.scrollTo(0, 0)");
      await sleep(400);
    }

    await setViewport(VIEWPORTS[2]);
    await navigate(`${BASE}/login`);
    if ((await evaluate("location.pathname")) !== "/dashboard") {
      await waitFor(
        `Object.keys(document.querySelector("form") || {}).some((key) => key.startsWith("__reactFiber$"))`,
        15000,
      );
      await evaluate(`
        (() => {
          const setValue = (element, value) => {
            const setter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              "value",
            ).set;
            setter.call(element, value);
            element.dispatchEvent(new Event("input", { bubbles: true }));
          };
          setValue(document.querySelector('input[name="email"]'), ${JSON.stringify(EMAIL)});
          setValue(document.querySelector('input[name="password"]'), ${JSON.stringify(PASSWORD)});
          document.querySelector('button[type="submit"]').click();
          return true;
        })()
      `);
      if (!(await waitFor(`location.pathname === "/dashboard"`, 30000))) {
        throw new Error("Login failed");
      }
    }

    let failed = false;
    for (const viewport of VIEWPORTS) {
      await setViewport(viewport);
      await navigate(`${BASE}/dashboard`);
      const info = await evaluate(`(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          viewportWidth: window.innerWidth,
          appointmentRows: document.querySelectorAll('a[href*="/appointments/"]').length,
          overflowing: Array.from(document.querySelectorAll("body *"))
            .map((el) => ({ el, right: el.getBoundingClientRect().right }))
            .filter((entry) => entry.right > doc.clientWidth + 1)
            .slice(0, 5)
            .map((entry) => ({
              tag: entry.el.tagName.toLowerCase(),
              className: typeof entry.el.className === "string" ? entry.el.className.slice(0, 120) : "",
              right: Math.round(entry.right),
            })),
        };
      })()`);
      const passed = info.scrollWidth <= info.clientWidth + 1;
      failed ||= !passed;
      console.log(
        `${viewport.name.padEnd(12)} viewport=${String(info.viewportWidth).padStart(4)} ` +
          `scroll=${String(info.scrollWidth).padStart(4)} client=${String(info.clientWidth).padStart(4)} ` +
          `appointmentRows=${String(info.appointmentRows).padStart(2)} ${passed ? "PASS" : "FAIL"}`,
      );
      if (!passed) console.log("  overflowing:", info.overflowing);
    }

    if (errors.length) {
      console.error("Console errors:", errors);
      failed = true;
    }
    if (failed) throw new Error("Dashboard responsive regression check failed");
    console.log("Dashboard has no horizontal page overflow at all measured widths.");
  } finally {
    cdp?.close();
    if (chrome.pid) {
      spawn("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" });
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
