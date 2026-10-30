import { describe, expect, it } from "vitest";
import { getSiteUrl, LOCAL_SITE_URL } from "@/lib/site-url";

describe("getSiteUrl", () => {
  it("falls back to localhost outside production", () => {
    expect(getSiteUrl({ NODE_ENV: "development" })).toBe(LOCAL_SITE_URL);
    expect(getSiteUrl({ NODE_ENV: "test" })).toBe(LOCAL_SITE_URL);
  });

  it("requires an explicit URL in production", () => {
    expect(() => getSiteUrl({ NODE_ENV: "production" })).toThrow(
      /NEXT_PUBLIC_SITE_URL is required in production/,
    );
  });

  it("accepts a configured production origin and normalizes a trailing slash", () => {
    expect(
      getSiteUrl({
        NODE_ENV: "production",
        NEXT_PUBLIC_SITE_URL: "https://slotwise.example.com/",
      }),
    ).toBe("https://slotwise.example.com");
  });

  it("rejects invalid URLs and unsupported protocols", () => {
    expect(() =>
      getSiteUrl({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "not a url" }),
    ).toThrow(/absolute http\(s\) URL/);
    expect(() =>
      getSiteUrl({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "ftp://example.com" }),
    ).toThrow(/http or https/);
  });

  it("rejects URLs with paths, queries, hashes, or credentials", () => {
    for (const value of [
      "https://example.com/app",
      "https://example.com/?utm=1",
      "https://example.com/#top",
      "https://user:pass@example.com",
    ]) {
      expect(() =>
        getSiteUrl({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: value }),
      ).toThrow(/NEXT_PUBLIC_SITE_URL/);
    }
  });

  it("uses the Vercel preview URL when no explicit URL is set", () => {
    expect(
      getSiteUrl({
        NODE_ENV: "production",
        VERCEL_ENV: "preview",
        VERCEL_URL: "slotwise-git-feature.vercel.app",
      }),
    ).toBe("https://slotwise-git-feature.vercel.app");
  });

  it("requires an explicit URL for Vercel production deployments", () => {
    expect(() =>
      getSiteUrl({
        NODE_ENV: "production",
        VERCEL_ENV: "production",
        VERCEL_URL: "slotwise.vercel.app",
      }),
    ).toThrow(/NEXT_PUBLIC_SITE_URL is required in production/);
  });

  it("does not accept a localhost URL on Vercel", () => {
    expect(() =>
      getSiteUrl({
        NODE_ENV: "production",
        VERCEL_ENV: "preview",
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        VERCEL_URL: "slotwise-git-feature.vercel.app",
      }),
    ).toThrow(/public deployment origin/);
  });
});
