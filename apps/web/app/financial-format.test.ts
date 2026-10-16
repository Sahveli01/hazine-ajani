import { describe, expect, it } from "vitest";

import { exactPercentLabel } from "./financial-format.js";

describe("accessible financial formatting", () => {
  it("preserves full decimal precision for assistive technology", () => {
    expect(exactPercentLabel({ value: "0.123456789", scale: 9 })).toBe(
      "Tam değer yüzde 12.345678900",
    );
  });
});
