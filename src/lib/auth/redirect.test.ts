import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/auth/redirect";

describe("safeRedirectPath", () => {
  it("keeps ordinary internal paths", () => {
    expect(safeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("/appointments?status=pending")).toBe(
      "/appointments?status=pending",
    );
    expect(safeRedirectPath("/customers/123#history")).toBe("/customers/123#history");
    expect(safeRedirectPath("  /reports  ")).toBe("/reports");
  });

  it("falls back for missing values", () => {
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
    expect(safeRedirectPath("")).toBe("/dashboard");
    expect(safeRedirectPath(null, "/calendar")).toBe("/calendar");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    for (const value of [
      "https://evil.example",
      "http://localhost:3000/dashboard",
      "//evil.example",
      "///evil.example",
      "javascript:alert(1)",
      "\\\\evil.example",
      "dashboard",
    ]) {
      expect(safeRedirectPath(value)).toBe("/dashboard");
    }
  });

  it("rejects control characters and malformed URLs", () => {
    expect(safeRedirectPath("/dash\u0000board")).toBe("/dashboard");
    expect(safeRedirectPath("/dash\nboard")).toBe("/dashboard");
    expect(safeRedirectPath("/%0d%0aSet-Cookie:x")).not.toContain("\n");
  });

  it("does not bounce back into auth screens", () => {
    expect(safeRedirectPath("/login")).toBe("/dashboard");
    expect(safeRedirectPath("/login?next=/reports")).toBe("/dashboard");
    expect(safeRedirectPath("/signup")).toBe("/dashboard");
    expect(safeRedirectPath("/auth/callback?code=abc")).toBe("/dashboard");
  });

  it("preserves deep paths with encoded characters", () => {
    expect(safeRedirectPath("/customers?q=Amara%20Silva")).toBe(
      "/customers?q=Amara%20Silva",
    );
  });
});
