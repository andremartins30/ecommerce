/**
 * CPF/CNPJ check-digit validation.
 *
 * The database only enforces "11 or 14 digits, no punctuation" (see the
 * `customers_document_digits_only` CHECK constraint) — it cannot validate
 * the check digits themselves without a stored procedure, so that has to
 * happen here before the value ever reaches Prisma. A syntactically valid
 * but fabricated CPF (right length, wrong check digits) would otherwise be
 * silently accepted.
 */

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** True for values with the same digit repeated (e.g. "00000000000") — always invalid, and the naive check-digit algorithm below accepts them by coincidence. */
function isAllSameDigit(digits: string): boolean {
  return /^(\d)\1*$/.test(digits);
}

export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 11 || isAllSameDigit(digits)) return false;

  const calcCheckDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(digits[i]) * (length + 1 - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return calcCheckDigit(9) === Number(digits[9]) && calcCheckDigit(10) === Number(digits[10]);
}

export function isValidCnpj(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 14 || isAllSameDigit(digits)) return false;

  const calcCheckDigit = (length: number): number => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(digits[i]) * weights[i];
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return calcCheckDigit(12) === Number(digits[12]) && calcCheckDigit(13) === Number(digits[13]);
}

export function isValidDocument(type: "CPF" | "CNPJ", value: string): boolean {
  return type === "CPF" ? isValidCpf(value) : isValidCnpj(value);
}

/** Digits only, for storage — the schema's own CHECK constraint mirrors this expectation. */
export function stripDocumentPunctuation(value: string): string {
  return onlyDigits(value);
}
