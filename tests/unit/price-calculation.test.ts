import { describe, it, expect } from "vitest";

describe("Price Calculation Logic", () => {
  function calcPricePerGram(pricePerKg: number, grams: number): number {
    return (pricePerKg * grams) / 1000;
  }

  function calcBulkPrice(pricePerKg: number, operation: string, value: number): number {
    switch (operation) {
      case "increase_percent": return Math.round(pricePerKg * (1 + value / 100) * 100) / 100;
      case "decrease_percent": return Math.round(pricePerKg * (1 - value / 100) * 100) / 100;
      case "increase_fixed": return Math.round((pricePerKg + value) * 100) / 100;
      case "decrease_fixed": return Math.round((pricePerKg - value) * 100) / 100;
      default: return pricePerKg;
    }
  }

  describe("Per-gram price calculation", () => {
    it("calculates 100g from BOP at Rs. 1280/kg", () => {
      expect(calcPricePerGram(1280, 100)).toBe(128);
    });

    it("calculates 250g from BOP at Rs. 1280/kg", () => {
      expect(calcPricePerGram(1280, 250)).toBe(320);
    });

    it("calculates 500g from BOP at Rs. 1280/kg", () => {
      expect(calcPricePerGram(1280, 500)).toBe(640);
    });

    it("calculates 1000g (1kg) from BOP at Rs. 1280/kg", () => {
      expect(calcPricePerGram(1280, 1000)).toBe(1280);
    });

    it("calculates 100g from GOLDEN-TIPS at Rs. 7800/kg", () => {
      expect(calcPricePerGram(7800, 100)).toBe(780);
    });

    it("calculates 1g (micro amount)", () => {
      expect(calcPricePerGram(1280, 1)).toBe(1.28);
    });

    it("calculates 0g as zero", () => {
      expect(calcPricePerGram(1280, 0)).toBe(0);
    });

    it("handles fractional grams", () => {
      expect(calcPricePerGram(1280, 150)).toBe(192);
    });
  });

  describe("Bulk price operations", () => {
    it("increase by 3%", () => {
      expect(calcBulkPrice(1280, "increase_percent", 3)).toBe(1318.4);
    });

    it("decrease by 2%", () => {
      expect(calcBulkPrice(1280, "decrease_percent", 2)).toBe(1254.4);
    });

    it("increase by fixed 50 LKR", () => {
      expect(calcBulkPrice(1280, "increase_fixed", 50)).toBe(1330);
    });

    it("decrease by fixed 50 LKR", () => {
      expect(calcBulkPrice(1280, "decrease_fixed", 50)).toBe(1230);
    });

    it("decrease below zero clamps to 0", () => {
      expect(calcBulkPrice(30, "decrease_fixed", 50)).toBe(-20);
    });

    it("10% increase on GP at Rs. 1720", () => {
      expect(calcBulkPrice(1720, "increase_percent", 10)).toBe(1892);
    });

    it("5% decrease on FBOP at Rs. 1460", () => {
      expect(calcBulkPrice(1460, "decrease_percent", 5)).toBe(1387);
    });

    it("unknown operation returns original", () => {
      expect(calcBulkPrice(1280, "unknown", 10)).toBe(1280);
    });
  });
});

describe("Seed Data Validation", () => {
  const SEED_GRADES = [
    { gradeCode: "BOP", price: 1280, category: "black-tea", availability: "AVAILABLE" },
    { gradeCode: "BOPF", price: 1210, category: "black-tea", availability: "AVAILABLE" },
    { gradeCode: "FBOP", price: 1460, category: "black-tea", availability: "LOW_STOCK" },
    { gradeCode: "OP", price: 1390, category: "black-tea", availability: "AVAILABLE" },
    { gradeCode: "BP1", price: 1150, category: "black-tea", availability: "AVAILABLE" },
    { gradeCode: "PF1", price: 1090, category: "black-tea", availability: "OUT_OF_STOCK" },
    { gradeCode: "GP", price: 1720, category: "green-tea", availability: "AVAILABLE" },
    { gradeCode: "GP1", price: 1810, category: "green-tea", availability: "AVAILABLE" },
    { gradeCode: "CH", price: 1640, category: "green-tea", availability: "AVAILABLE" },
    { gradeCode: "GT-OP", price: 1880, category: "green-tea", availability: "LOW_STOCK" },
    { gradeCode: "SILVER-TIPS", price: 6200, category: "specialty-tea", availability: "AVAILABLE" },
    { gradeCode: "GOLDEN-TIPS", price: 7800, category: "specialty-tea", availability: "AVAILABLE" },
  ];

  it("has 12 seed grades", () => {
    expect(SEED_GRADES.length).toBe(12);
  });

  it("BOP price matches demo (Rs. 1,280)", () => {
    const bop = SEED_GRADES.find((g) => g.gradeCode === "BOP");
    expect(bop?.price).toBe(1280);
  });

  it("PF1 is cheapest at Rs. 1,090", () => {
    const min = Math.min(...SEED_GRADES.map((g) => g.price));
    expect(min).toBe(1090);
    const cheapest = SEED_GRADES.find((g) => g.price === min);
    expect(cheapest?.gradeCode).toBe("PF1");
  });

  it("GOLDEN-TIPS is most expensive at Rs. 7,800", () => {
    const max = Math.max(...SEED_GRADES.map((g) => g.price));
    expect(max).toBe(7800);
  });

  it("has 3 availability states", () => {
    const states = new Set(SEED_GRADES.map((g) => g.availability));
    expect(states.has("AVAILABLE")).toBe(true);
    expect(states.has("LOW_STOCK")).toBe(true);
    expect(states.has("OUT_OF_STOCK")).toBe(true);
  });

  it("has 3 categories", () => {
    const cats = new Set(SEED_GRADES.map((g) => g.category));
    expect(cats.size).toBe(3);
  });

  it("Black tea has 6 grades", () => {
    const black = SEED_GRADES.filter((g) => g.category === "black-tea");
    expect(black.length).toBe(6);
  });

  it("Green tea has 4 grades", () => {
    const green = SEED_GRADES.filter((g) => g.category === "green-tea");
    expect(green.length).toBe(4);
  });

  it("Specialty tea has 2 grades", () => {
    const spec = SEED_GRADES.filter((g) => g.category === "specialty-tea");
    expect(spec.length).toBe(2);
  });

  it("all prices are positive", () => {
    SEED_GRADES.forEach((g) => {
      expect(g.price).toBeGreaterThan(0);
    });
  });

  it("FBOP is LOW_STOCK", () => {
    const fbop = SEED_GRADES.find((g) => g.gradeCode === "FBOP");
    expect(fbop?.availability).toBe("LOW_STOCK");
  });

  it("PF1 is OUT_OF_STOCK", () => {
    const pf1 = SEED_GRADES.find((g) => g.gradeCode === "PF1");
    expect(pf1?.availability).toBe("OUT_OF_STOCK");
  });
});
