import { describe, expect, it } from "vitest";
import { isValidCpf, isValidCnpj, isValidDocument, stripDocumentPunctuation } from "./document-validation";

describe("isValidCpf", () => {
  it("accepts a CPF with correct check digits", () => {
    expect(isValidCpf("123.456.789-09")).toBe(true);
    expect(isValidCpf("12345678909")).toBe(true);
  });

  it("rejects a CPF with wrong check digits", () => {
    expect(isValidCpf("12345678900")).toBe(false);
  });

  it("rejects a CPF with all repeated digits", () => {
    expect(isValidCpf("11111111111")).toBe(false);
    expect(isValidCpf("00000000000")).toBe(false);
  });

  it("rejects the wrong length", () => {
    expect(isValidCpf("123456789")).toBe(false);
    expect(isValidCpf("123456789099")).toBe(false);
  });
});

describe("isValidCnpj", () => {
  it("accepts a CNPJ with correct check digits", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpj("11222333000181")).toBe(true);
  });

  it("rejects a CNPJ with wrong check digits", () => {
    expect(isValidCnpj("11222333000180")).toBe(false);
  });

  it("rejects a CNPJ with all repeated digits", () => {
    expect(isValidCnpj("11111111111111")).toBe(false);
  });

  it("rejects the wrong length", () => {
    expect(isValidCnpj("1122233300018")).toBe(false);
  });
});

describe("isValidDocument", () => {
  it("dispatches to the right validator by type", () => {
    expect(isValidDocument("CPF", "12345678909")).toBe(true);
    expect(isValidDocument("CNPJ", "12345678909")).toBe(false);
    expect(isValidDocument("CNPJ", "11222333000181")).toBe(true);
  });
});

describe("stripDocumentPunctuation", () => {
  it("keeps only digits", () => {
    expect(stripDocumentPunctuation("123.456.789-09")).toBe("12345678909");
    expect(stripDocumentPunctuation("11.222.333/0001-81")).toBe("11222333000181");
  });
});
