import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { buildApp } from "./app.js";

// Versions pinned by the dependency security update. Each package must be
// installed at these CVE-fixed versions.
const FIXED_VERSIONS: Record<string, string> = {
  tinypool: "2.1.1",
  "fast-uri": "2.4.3",
  fastify: "5.12.2",
  "find-my-way": "9.7.0",
  postcss: "8.5.18",
  "source-map-js": "1.2.2",
};

function installedVersions(name: string): string[] {
  const lock = JSON.parse(
    readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"),
  ) as { packages: Record<string, { version?: string } | undefined> };
  const versions: string[] = [];
  for (const [key, entry] of Object.entries(lock.packages)) {
    if (key.endsWith(`node_modules/${name}`) && entry?.version) {
      versions.push(entry.version);
    }
  }
  return versions;
}

describe("dependency security fixes", () => {
  for (const [name, expected] of Object.entries(FIXED_VERSIONS)) {
    test(`${name} is installed at the fixed version ${expected}`, () => {
      const versions = installedVersions(name);
      expect(versions.length).toBeGreaterThan(0);
      expect(versions.every((version) => version === expected)).toBe(true);
    });
  }

  test("API still boots and serves routes after dependency bumps", async () => {
    const app = buildApp();
    const tokenRes = await app.inject({ method: "POST", url: "/api/tokens" });
    expect(tokenRes.statusCode).toBe(200);
    const projectsRes = await app.inject({
      method: "GET",
      url: "/api/projects?page=1",
    });
    expect(projectsRes.json()).toHaveLength(2);
  });
});
