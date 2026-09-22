/**
 * Money handling for the whole application.
 *
 * Every monetary value is an **integer number of cents**. Floating point reais
 * are never stored, summed or compared. The code this replaces used decimal
 * dollars and rounded discounts and tax with `Math.round(subtotal * rate)`,
 * which rounded to whole dollars — a real financial divergence, not a cosmetic
 * one.
 *
 * `Cents` is a branded type so that a plain `number` cannot silently be passed
 * where cents are expected inside the domain. At the edges (database rows, form
 * input, JSON) values arrive as plain integers and go through `cents()`, which
 * validates them.
 */

declare const centsBrand: unique symbol;

export type Cents = number & { readonly [centsBrand]: true };

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}

/**
 * Wraps a plain integer as Cents, rejecting anything that cannot be an exact
 * cent amount. This is the guard that catches the classic mistake of handing a
 * reais value (49.99) to something expecting cents.
 */
export function cents(value: number): Cents {
  if (!Number.isFinite(value)) {
    throw new MoneyError(`Expected a finite amount in cents, received ${value}`);
  }
  if (!Number.isInteger(value)) {
    throw new MoneyError(
      `Expected an integer amount in cents, received ${value}. ` +
        `Values in reais must go through fromReais().`
    );
  }
  if (!Number.isSafeInteger(value)) {
    throw new MoneyError(`Amount in cents exceeds safe integer range: ${value}`);
  }
  return value as Cents;
}

export const ZERO = cents(0);

/** True when the value is a valid cent amount. Does not throw. */
export function isCents(value: number): value is Cents {
  return Number.isSafeInteger(value);
}

/**
 * Rounds half away from zero, which keeps positive and negative amounts
 * symmetric. `Math.round` rounds half *up*, biasing negative values.
 */
function roundHalfAwayFromZero(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/** Converts a reais amount (possibly fractional) to cents. */
export function fromReais(reais: number): Cents {
  if (!Number.isFinite(reais)) {
    throw new MoneyError(`Expected a finite amount in reais, received ${reais}`);
  }
  // Scale before rounding so 49.99 becomes 4999 rather than 4998.9999...
  return cents(roundHalfAwayFromZero(reais * 100));
}

/** Converts cents to a reais number. Presentation and export only. */
export function toReais(value: Cents): number {
  return value / 100;
}

export function addCents(...values: Cents[]): Cents {
  return cents(values.reduce<number>((total, value) => total + value, 0));
}

export function subtractCents(minuend: Cents, subtrahend: Cents): Cents {
  return cents(minuend - subtrahend);
}

/** Multiplies by an integer quantity. Fractional quantities are meaningless. */
export function multiplyCents(value: Cents, quantity: number): Cents {
  if (!Number.isInteger(quantity)) {
    throw new MoneyError(`Quantity must be an integer, received ${quantity}`);
  }
  return cents(value * quantity);
}

/**
 * Applies a percentage, rounding to the nearest cent. A 10% discount on
 * R$ 24,99 is R$ 2,50 (2499 -> 250), never R$ 2,00.
 */
export function applyPercentage(value: Cents, percent: number): Cents {
  if (!Number.isFinite(percent)) {
    throw new MoneyError(`Percentage must be finite, received ${percent}`);
  }
  return cents(roundHalfAwayFromZero((value * percent) / 100));
}

export function minCents(a: Cents, b: Cents): Cents {
  return a <= b ? a : b;
}

export function maxCents(a: Cents, b: Cents): Cents {
  return a >= b ? a : b;
}

/** Clamps to zero. Used wherever a discount must not exceed the amount owed. */
export function clampToZero(value: Cents): Cents {
  return value < 0 ? ZERO : value;
}

const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats cents as Brazilian currency: 24990 -> "R$ 249,90".
 *
 * Always two decimal places. Trimming the decimals on round amounts (the old
 * behaviour, "$348") reads as sloppy in a price list and makes columns of
 * numbers fail to line up.
 */
export function formatBRL(value: number): string {
  const amount = isCents(value) ? value : cents(value);
  // Intl uses U+00A0 between symbol and digits; normalise to a plain space so
  // that server and client markup match and tests can assert readable strings.
  return BRL_FORMATTER.format(amount / 100).replace(/\u00a0/g, " ");
}

/**
 * Parses operator input in Brazilian format into cents: "1.249,90" -> 124990.
 * Accepts "1249,90", "1249.90" and "1249". Returns null when unparseable, so
 * callers can surface a validation error instead of storing a wrong price.
 */
export function parseReaisInput(input: string): Cents | null {
  const trimmed = input.trim().replace(/^R\$\s*/i, "");
  if (trimmed === "") return null;

  // Brazilian format uses "." for thousands and "," for decimals. When both are
  // present, the last separator is the decimal one.
  const lastComma = trimmed.lastIndexOf(",");
  const lastDot = trimmed.lastIndexOf(".");
  let normalised: string;

  if (lastComma > lastDot) {
    normalised = trimmed.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    normalised = trimmed.replace(/,/g, "");
  } else {
    normalised = trimmed;
  }

  if (!/^-?\d+(\.\d+)?$/.test(normalised)) return null;

  const value = Number(normalised);
  if (!Number.isFinite(value)) return null;

  return fromReais(value);
}

/** Percentage off, rounded to an integer for display ("-18%"). */
export function percentOff(price: Cents, compareAtPrice: Cents): number {
  if (compareAtPrice <= 0 || price >= compareAtPrice) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}
