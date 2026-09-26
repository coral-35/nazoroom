import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import vercelConfig from "../../vercel.json";

describe("Vercel routing", () => {
  it("does not define a top page in the app router", () => {
    expect(existsSync("app/page.tsx")).toBe(false);
  });

  it("redirects the top page to join", () => {
    expect(vercelConfig.redirects).toContainEqual({
      source: "/",
      destination: "/join",
      permanent: false
    });
  });
});
