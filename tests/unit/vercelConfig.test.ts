import { describe, expect, it } from "vitest";
import vercelConfig from "../../vercel.json";

describe("Vercel routing", () => {
  it("redirects the top page to join", () => {
    expect(vercelConfig.redirects).toContainEqual({
      source: "/",
      destination: "/join",
      permanent: false
    });
  });
});
