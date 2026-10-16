import { describe, expect, it } from "vitest";

import { deploymentLabel } from "./deployment-metadata.js";

describe("deployment metadata", () => {
  it("shows a short verified commit and rejects absent or malformed values", () => {
    expect(deploymentLabel("9e3d8ca7c641")).toBe("Build 9e3d8ca");
    expect(deploymentLabel(undefined)).toBe("Build yerel");
    expect(deploymentLabel("branch/main")).toBe("Build doğrulanamadı");
  });
});
