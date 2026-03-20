import { describe, it, expect } from "vitest";
import { formatCurrency, parseBRLValue } from "@/lib/utils/format";

describe("formatCurrency", () => {
  it("formats positive values as BRL", () => {
    expect(formatCurrency(1234.56)).toBe("R$\u00a01.234,56");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("R$\u00a00,00");
  });

  it("formats negative values", () => {
    expect(formatCurrency(-500)).toBe("-R$\u00a0500,00");
  });
});

describe("parseBRLValue", () => {
  it("parses standard BRL format", () => {
    expect(parseBRLValue("R$ 1.234,56")).toBe(1234.56);
  });

  it("parses without R$ prefix", () => {
    expect(parseBRLValue("1.234,56")).toBe(1234.56);
  });

  it("parses simple values", () => {
    expect(parseBRLValue("100,00")).toBe(100);
  });

  it("parses with spaces", () => {
    expect(parseBRLValue(" R$ 50,99 ")).toBe(50.99);
  });
});
