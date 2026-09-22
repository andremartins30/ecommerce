import { describe, expect, it } from "vitest";
import {
  addCents,
  applyPercentage,
  cents,
  clampToZero,
  formatBRL,
  fromReais,
  maxCents,
  minCents,
  MoneyError,
  multiplyCents,
  parseReaisInput,
  percentOff,
  subtractCents,
  toReais,
  ZERO,
} from "./money";

describe("cents", () => {
  it("accepts integers", () => {
    expect(cents(24990)).toBe(24990);
    expect(cents(0)).toBe(0);
    expect(cents(-500)).toBe(-500);
  });

  it("rejects a reais value handed in as cents", () => {
    // The exact mistake this guard exists for: 49.99 is reais, not cents.
    expect(() => cents(49.99)).toThrow(MoneyError);
    expect(() => cents(49.99)).toThrow(/must go through fromReais/);
  });

  it("rejects non-finite values", () => {
    expect(() => cents(Number.NaN)).toThrow(MoneyError);
    expect(() => cents(Number.POSITIVE_INFINITY)).toThrow(MoneyError);
  });

  it("rejects values beyond the safe integer range", () => {
    expect(() => cents(Number.MAX_SAFE_INTEGER + 2)).toThrow(MoneyError);
  });
});

describe("fromReais / toReais", () => {
  it("converts whole reais", () => {
    expect(fromReais(249)).toBe(24900);
  });

  it("converts fractional reais without float drift", () => {
    expect(fromReais(249.9)).toBe(24990);
    expect(fromReais(49.99)).toBe(4999);
    expect(fromReais(0.01)).toBe(1);
    // 1.005 * 100 is 100.49999999999999 in binary floating point; scaling
    // before rounding is what keeps this correct.
    expect(fromReais(1.115)).toBe(112);
  });

  it("rounds half away from zero symmetrically", () => {
    expect(fromReais(0.005)).toBe(1);
    expect(fromReais(-0.005)).toBe(-1);
  });

  it("round-trips", () => {
    expect(toReais(fromReais(1249.9))).toBe(1249.9);
  });
});

describe("arithmetic", () => {
  it("adds without float error", () => {
    // The canonical float failure: 0.1 + 0.2 !== 0.3 in reais.
    const a = fromReais(0.1);
    const b = fromReais(0.2);
    expect(addCents(a, b)).toBe(fromReais(0.3));
    expect(toReais(addCents(a, b))).toBe(0.3);
  });

  it("sums a realistic cart exactly", () => {
    const lines = [fromReais(249.9), fromReais(189.9), fromReais(89.99)];
    expect(addCents(...lines)).toBe(52979);
    expect(formatBRL(addCents(...lines))).toBe("R$ 529,79");
  });

  it("subtracts", () => {
    expect(subtractCents(cents(24990), cents(5000))).toBe(19990);
  });

  it("multiplies by an integer quantity", () => {
    expect(multiplyCents(cents(4999), 3)).toBe(14997);
  });

  it("refuses a fractional quantity", () => {
    expect(() => multiplyCents(cents(4999), 1.5)).toThrow(/Quantity must be an integer/);
  });

  it("returns min, max and clamps to zero", () => {
    expect(minCents(cents(100), cents(200))).toBe(100);
    expect(maxCents(cents(100), cents(200))).toBe(200);
    expect(clampToZero(cents(-1))).toBe(ZERO);
    expect(clampToZero(cents(5))).toBe(5);
  });
});

describe("applyPercentage", () => {
  it("rounds to the cent, not to the unit", () => {
    // The replaced implementation produced whole-unit rounding here.
    expect(applyPercentage(cents(2499), 10)).toBe(250);
    expect(applyPercentage(cents(24990), 15)).toBe(3749); // 3748.5 -> 3749
  });

  it("handles an odd subtotal with an odd percentage", () => {
    expect(applyPercentage(cents(33333), 7)).toBe(2333); // 2333.31
  });

  it("is exact for 100% and 0%", () => {
    expect(applyPercentage(cents(24990), 100)).toBe(24990);
    expect(applyPercentage(cents(24990), 0)).toBe(0);
  });
});

describe("formatBRL", () => {
  it("formats cents as Brazilian currency", () => {
    expect(formatBRL(24990)).toBe("R$ 249,90");
  });

  it("keeps two decimals on round amounts", () => {
    expect(formatBRL(24900)).toBe("R$ 249,00");
    expect(formatBRL(0)).toBe("R$ 0,00");
  });

  it("groups thousands with a dot", () => {
    expect(formatBRL(124990)).toBe("R$ 1.249,90");
    expect(formatBRL(1234567)).toBe("R$ 12.345,67");
  });

  it("formats negative amounts", () => {
    expect(formatBRL(-2500)).toBe("-R$ 25,00");
  });

  it("uses a plain space so server and client markup match", () => {
    expect(formatBRL(24990)).not.toContain("\u00a0");
  });

  it("refuses a reais value", () => {
    expect(() => formatBRL(249.9)).toThrow(MoneyError);
  });
});

describe("parseReaisInput", () => {
  it("parses Brazilian formatting", () => {
    expect(parseReaisInput("249,90")).toBe(24990);
    expect(parseReaisInput("1.249,90")).toBe(124990);
    expect(parseReaisInput("R$ 1.249,90")).toBe(124990);
    expect(parseReaisInput("249")).toBe(24900);
  });

  it("accepts dot as decimal separator", () => {
    expect(parseReaisInput("249.90")).toBe(24990);
  });

  it("rejects garbage instead of guessing", () => {
    expect(parseReaisInput("")).toBeNull();
    expect(parseReaisInput("abc")).toBeNull();
    expect(parseReaisInput("12,34,56")).toBeNull();
  });
});

describe("percentOff", () => {
  it("computes the discount badge", () => {
    expect(percentOff(cents(24990), cents(29990))).toBe(17);
  });

  it("returns zero when there is no discount", () => {
    expect(percentOff(cents(24990), cents(24990))).toBe(0);
    expect(percentOff(cents(29990), cents(24990))).toBe(0);
    expect(percentOff(cents(24990), ZERO)).toBe(0);
  });
});
