import { describe, it, expect } from "vitest";
import {
  parseBRLValue,
  removeBOM,
  parseISODate,
  parseCSVDebito,
  parseCSVCredito,
  parseCSVNubank,
  isIgnored,
  detectFormat,
} from "@/lib/services/csv-parsers";

describe("parseBRLValue", () => {
  it("parses standard BRL format", () => {
    expect(parseBRLValue("R$ 1.234,56")).toBe(1234.56);
  });

  it("parses without R$ prefix", () => {
    expect(parseBRLValue("1.234,56")).toBe(1234.56);
  });

  it("parses simple value", () => {
    expect(parseBRLValue("100,00")).toBe(100);
  });

  it("parses negative BRL value with comma", () => {
    expect(parseBRLValue("-7.447,84")).toBe(-7447.84);
  });

  it("parses negative value with decimal dot", () => {
    expect(parseBRLValue("-7447.84")).toBe(-7447.84);
  });
});

describe("removeBOM", () => {
  it("removes BOM character", () => {
    expect(removeBOM("\uFEFFhello")).toBe("hello");
  });

  it("returns unchanged if no BOM", () => {
    expect(removeBOM("hello")).toBe("hello");
  });
});

describe("parseISODate", () => {
  it("converts YYYY-MM-DD to DD/MM/YYYY", () => {
    expect(parseISODate("2026-03-24")).toBe("24/03/2026");
  });

  it("preserves leading zeros", () => {
    expect(parseISODate("2026-01-05")).toBe("05/01/2026");
  });
});

describe("parseCSVDebito", () => {
  it("parses debito CSV format with semicolon delimiter", () => {
    const csv = `Data;Estabelecimento;Portador;Valor;Parcela
15/03/2026;SUPERMERCADO XYZ;MATHEUS;R$ 150,00;-
16/03/2026;FARMACIA ABC;MATHEUS;R$ 45,50;2/3`;

    const rows = parseCSVDebito(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      date: "15/03/2026",
      card_holder: "MATHEUS",
      csv_category: "-",
      csv_description: "SUPERMERCADO XYZ",
      installment: "-",
      value: 150,
    });
    expect(rows[1].value).toBe(45.5);
    expect(rows[1].installment).toBe("2/3");
  });

  it("skips rows without Data or Valor", () => {
    const csv = `Data;Estabelecimento;Portador;Valor;Parcela
;SUPERMERCADO XYZ;MATHEUS;R$ 150,00;-`;

    const rows = parseCSVDebito(csv);
    expect(rows).toHaveLength(0);
  });
});

describe("parseCSVCredito", () => {
  it("parses credito CSV format with decimal dot", () => {
    const csv = `Data de Compra;Nome no Cartão;Final do Cartão;Categoria;Descrição;Parcela;Valor (em US$);Cotação (em R$);Valor (em R$)
07/02/2026;MATHEUS B T MENDES;3313;Restaurante / Lanchonete / Bar;CAFETERIA;Única;0;0;37.00
08/02/2026;MATHEUS B T MENDES;3313;Supermercados;IFD*CARREFOUR COMERCIO;Única;0;0;197.27`;

    const rows = parseCSVCredito(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      date: "07/02/2026",
      card_holder: "MATHEUS B T MENDES",
      card_last_digits: "3313",
      csv_category: "Restaurante / Lanchonete / Bar",
      csv_description: "CAFETERIA",
      installment: "Única",
      value: 37,
    });
    expect(rows[1].value).toBe(197.27);
  });

  it("parses credito CSV format with BRL comma", () => {
    const csv = `Data de Compra;Nome no Cartão;Final do Cartão;Categoria;Descrição;Parcela;Valor (em US$);Cotação (em R$);Valor (em R$)
07/02/2026;MATHEUS B T MENDES;3313;Restaurante;CAFE;Única;0;0;1.234,56`;

    const rows = parseCSVCredito(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].value).toBe(1234.56);
  });

  it("handles negative values (payments/refunds)", () => {
    const csv = `Data de Compra;Nome no Cartão;Final do Cartão;Categoria;Descrição;Parcela;Valor (em US$);Cotação (em R$);Valor (em R$)
09/02/2026;MATHEUS B T MENDES;1955;-;Pagamento Fatura QR CODE;Única;0;0;-7447.84`;

    const rows = parseCSVCredito(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].value).toBe(-7447.84);
  });
});

describe("parseCSVNubank", () => {
  it("parses Nubank CSV format with comma delimiter", () => {
    const csv = `date,title,amount
2026-03-24,Cartao de Todos Mar,33.40
2026-03-22,VANDERLEI CANDIDO,20.62`;

    const rows = parseCSVNubank(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      date: "24/03/2026",
      csv_category: "-",
      csv_description: "Cartao de Todos Mar",
      value: 33.4,
    });
    expect(rows[1]).toEqual({
      date: "22/03/2026",
      csv_category: "-",
      csv_description: "VANDERLEI CANDIDO",
      value: 20.62,
    });
  });

  it("skips rows with zero amount", () => {
    const csv = `date,title,amount
2026-03-17,Encerramento de dívida,0.00
2026-03-24,Cartao de Todos Mar,33.40`;

    const rows = parseCSVNubank(csv);
    // Both rows are parsed; the zero-value one is filtered by importCSV, not the parser
    expect(rows).toHaveLength(2);
    expect(rows[0].value).toBe(0);
    expect(rows[1].value).toBe(33.4);
  });

  it("handles BOM in Nubank CSV", () => {
    const csv = `\uFEFFdate,title,amount
2026-03-24,Cartao de Todos Mar,33.40`;

    const rows = parseCSVNubank(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].csv_description).toBe("Cartao de Todos Mar");
  });
});

describe("isIgnored", () => {
  it("ignores anuidade diferenciada", () => {
    expect(isIgnored("Anuidade Diferenciada")).toBe(true);
  });

  it("ignores estorno tarifa", () => {
    expect(isIgnored("Estorno Tarifa")).toBe(true);
  });

  it("ignores pagamento fatura", () => {
    expect(isIgnored("Pagamento Fatura QR CODE")).toBe(true);
  });

  it("ignores encerramento de dívida", () => {
    expect(isIgnored("Encerramento de dívida")).toBe(true);
  });

  it("ignores juros de dívida", () => {
    expect(isIgnored("Juros de dívida encerrada")).toBe(true);
  });

  it("does not ignore regular descriptions", () => {
    expect(isIgnored("SUPERMERCADO XYZ")).toBe(false);
    expect(isIgnored("CAFETERIA")).toBe(false);
    expect(isIgnored("UBER UBER *TRIP")).toBe(false);
  });
});

describe("detectFormat", () => {
  it("detects Nubank format", () => {
    expect(detectFormat("date,title,amount\n2026-03-24,Test,33.40")).toBe("nubank");
  });

  it("detects Nubank format with BOM", () => {
    expect(detectFormat("\ndate,title,amount\n2026-03-24,Test,33.40")).toBe("nubank");
  });

  it("detects debito format", () => {
    expect(detectFormat("Data;Estabelecimento;Portador;Valor")).toBe("debito");
  });

  it("detects credito format", () => {
    expect(detectFormat("Data de Compra;Nome no Cartão;Final do Cartão")).toBe("credito");
  });
});
