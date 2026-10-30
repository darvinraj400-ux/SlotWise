import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SUPABASE_CLI = path.join(ROOT, "node_modules", "supabase", "dist", "supabase.js");
const VITEST_CLI = path.join(ROOT, "node_modules", "vitest", "vitest.mjs");

function readLocalStatus() {
  try {
    const output = execFileSync(process.execPath, [SUPABASE_CLI, "status", "-o", "env"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const values = {};
    for (const line of output.split(/\r?\n/)) {
      const separator = line.indexOf("=");
      if (separator > 0) {
        const key = line.slice(0, separator).trim();
        let value = line.slice(separator + 1).trim();
        if (
          value.length >= 2 &&
          ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'")))
        ) {
          value = value.slice(1, -1);
        }
        values[key] = value;
      }
    }
    return values;
  } catch {
    console.error(
      "Local Supabase is not available. Start Docker and run `npm run db:start` first.",
    );
    process.exit(1);
  }
}

const status = readLocalStatus();
const apiUrl = status.API_URL;
const anonKey = status.ANON_KEY ?? status.PUBLISHABLE_KEY;
const serviceKey = status.SERVICE_ROLE_KEY ?? status.SECRET_KEY;

if (!apiUrl || !anonKey || !serviceKey) {
  console.error("Supabase status did not include the URL and API keys. Is the local stack running?");
  process.exit(1);
}

let hostname;
try {
  hostname = new URL(apiUrl).hostname;
} catch {
  console.error("Supabase reported an unreadable API URL.");
  process.exit(1);
}

// The suite writes and deletes auth users, so refuse to touch anything but localhost.
if (!["127.0.0.1", "localhost"].includes(hostname)) {
  console.error("Refusing to run integration tests against a non-local Supabase URL.");
  process.exit(1);
}

console.log(`Running integration tests against local Supabase at ${apiUrl}`);

const result = spawnSync(
  process.execPath,
  [VITEST_CLI, "run", "--config", "vitest.integration.config.mts"],
  {
    cwd: ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      SUPABASE_TEST_URL: apiUrl,
      SUPABASE_TEST_ANON_KEY: anonKey,
      SUPABASE_TEST_SERVICE_KEY: serviceKey,
    },
  },
);

process.exit(result.status ?? 1);
