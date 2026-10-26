import { describe, expect, test } from "vitest";
import { z } from "zod";

// GHSA-mrhx-c7xc-m3w5 / CVE-2023-54404: validating an oversized array
// against a size-bounded schema must reject it up front instead of walking
// every element and accumulating one issue per failing element (which can
// exhaust memory). Patched in zod >= 4.6.6.
describe("zod array size bound (CVE-2023-54404)", () => {
  test("oversized array fails fast with a bounded number of issues", () => {
    const schema = z.array(z.number()).max(1000);
    const result = schema.safeParse(new Array(50_000).fill("not-a-number"));
    if (result.success) {
      throw new Error("expected oversized array to fail validation");
    }
    // Vulnerable versions emit one issue per failing element (~50,000).
    // Fixed versions reject the input with a single size issue.
    expect(result.error.issues.length).toBeLessThan(10);
  });
});
