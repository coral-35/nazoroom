import { describe, expect, it } from "vitest";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from "next/constants";
import nextConfig from "../../next.config";

describe("Next.js build output isolation", () => {
  it("keeps development chunks separate while build and start share output", () => {
    const dev = nextConfig(PHASE_DEVELOPMENT_SERVER).distDir;
    const build = nextConfig(PHASE_PRODUCTION_BUILD).distDir;
    const start = nextConfig(PHASE_PRODUCTION_SERVER).distDir;
    expect(dev).toBe(".next-dev");
    expect(build).toBe(".next");
    expect(start).toBe(build);
    expect(dev).not.toBe(build);
  });
});
