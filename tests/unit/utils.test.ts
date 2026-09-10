import { describe, it, expect } from "vitest";
import { rs, rsExact, pctChange, availabilityLabel, availabilityClass, formatDate, slugify } from "../../src/lib/utils";

describe("rs (Rs. formatting)", () => {
  it("formats whole numbers", () => {
    expect(rs(1280)).toBe("Rs. 1,280");
  });

  it("formats zero", () => {
    expect(rs(0)).toBe("Rs. 0");
  });

  it("formats large numbers", () => {
    expect(rs(7800)).toBe("Rs. 7,800");
  });

  it("formats decimals by truncating fraction", () => {
    expect(rs(1280.5)).toBe("Rs. 1,281");
  });

  it("formats negative numbers", () => {
    expect(rs(-500)).toBe("Rs. -500");
  });

  it("handles string input", () => {
    expect(rs("1280" as any)).toBe("Rs. 1,280");
  });
});

describe("rsExact (Rs. with decimals)", () => {
  it("formats with 2 decimal places", () => {
    expect(rsExact(1280)).toBe("Rs. 1,280.00");
  });

  it("preserves cents", () => {
    expect(rsExact(1280.5)).toBe("Rs. 1,280.50");
  });

  it("formats zero", () => {
    expect(rsExact(0)).toBe("Rs. 0.00");
  });
});

describe("pctChange (percentage change)", () => {
  it("calculates increase", () => {
    const result = pctChange(1000, 1100);
    expect(result.text).toBe("+10.00%");
    expect(result.direction).toBe("up");
  });

  it("calculates decrease", () => {
    const result = pctChange(1280, 1210);
    expect(result.text).toBe("-5.47%");
    expect(result.direction).toBe("down");
  });

  it("handles no change", () => {
    const result = pctChange(1280, 1280);
    expect(result.text).toBe("No change");
    expect(result.direction).toBe("same");
  });

  it("handles old price = 0", () => {
    const result = pctChange(0, 1280);
    expect(result.text).toBe("N/A");
    expect(result.direction).toBe("same");
  });

  it("handles old price = null/undefined", () => {
    const result = pctChange(null as any, 1280);
    expect(result.text).toBe("N/A");
  });

  it("handles new price = 0", () => {
    const result = pctChange(1280, 0);
    expect(result.text).toBe("-100.00%");
    expect(result.direction).toBe("down");
  });

  it("formats small changes", () => {
    const result = pctChange(1280, 1295);
    expect(result.text).toBe("+1.17%");
    expect(result.direction).toBe("up");
  });

  it("formats large changes", () => {
    const result = pctChange(1000, 2000);
    expect(result.text).toBe("+100.00%");
    expect(result.direction).toBe("up");
  });
});

describe("availabilityLabel", () => {
  it("formats AVAILABLE", () => {
    expect(availabilityLabel("AVAILABLE")).toBe("Available");
  });

  it("formats LOW_STOCK", () => {
    expect(availabilityLabel("LOW_STOCK")).toBe("Low stock");
  });

  it("formats OUT_OF_STOCK", () => {
    expect(availabilityLabel("OUT_OF_STOCK")).toBe("Out of stock");
  });

  it("returns raw value for unknown", () => {
    expect(availabilityLabel("UNKNOWN")).toBe("UNKNOWN");
  });
});

describe("availabilityClass", () => {
  it("returns badge-available for AVAILABLE", () => {
    expect(availabilityClass("AVAILABLE")).toBe("badge-available");
  });

  it("returns badge-low-stock for LOW_STOCK", () => {
    expect(availabilityClass("LOW_STOCK")).toBe("badge-low-stock");
  });

  it("returns badge-out-of-stock for OUT_OF_STOCK", () => {
    expect(availabilityClass("OUT_OF_STOCK")).toBe("badge-out-of-stock");
  });

  it("returns empty for unknown", () => {
    expect(availabilityClass("UNKNOWN")).toBe("");
  });
});

describe("formatDate", () => {
  it("formats ISO date string", () => {
    const result = formatDate("2026-09-08T00:00:00.000Z");
    expect(result).toContain("08");
    expect(result).toContain("2026");
  });

  it("formats Date object", () => {
    const result = formatDate(new Date("2026-01-15"));
    expect(result).toContain("15");
    expect(result).toContain("2026");
  });
});

describe("slugify", () => {
  it("lowercases", () => {
    expect(slugify("Black Tea")).toBe("black-tea");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("Broken Orange Pekoe")).toBe("broken-orange-pekoe");
  });

  it("removes special characters", () => {
    expect(slugify("BOP (Fine)")).toBe("bop-fine");
  });

  it("removes leading/trailing hyphens", () => {
    expect(slugify(" Hello World ")).toBe("hello-world");
  });
});
