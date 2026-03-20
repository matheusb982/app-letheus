import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock mongoose and models before importing the service
vi.mock("@/lib/db/connection", () => ({
  connectDB: vi.fn(),
}));

vi.mock("@/lib/db/models/category", () => ({
  Category: {
    find: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        {
          _id: "cat1",
          name: "ALIMENTAÇÃO",
          category_type: "purchase",
          subcategories: [
            { _id: "sub1", name: "Restaurante" },
            { _id: "sub2", name: "Supermercado" },
          ],
        },
        {
          _id: "cat2",
          name: "TRANSPORTE",
          category_type: "purchase",
          subcategories: [
            { _id: "sub3", name: "Uber" },
          ],
        },
      ]),
    }),
  },
}));

import { getPaymentsPerCategory } from "@/lib/services/payments-per-category";

describe("getPaymentsPerCategory", () => {
  it("groups purchases and goals by category", async () => {
    const purchases = [
      { value: 100, subcategory_id: { toString: () => "sub1" } },
      { value: 50, subcategory_id: { toString: () => "sub1" } },
      { value: 200, subcategory_id: { toString: () => "sub2" } },
      { value: 30, subcategory_id: { toString: () => "sub3" } },
    ];

    const goals = [
      { value: 300, subcategory_id: { toString: () => "sub1" } },
      { value: 250, subcategory_id: { toString: () => "sub2" } },
      { value: 100, subcategory_id: { toString: () => "sub3" } },
    ];

    const result = await getPaymentsPerCategory(purchases, goals);

    expect(result).toHaveLength(2);

    // ALIMENTAÇÃO
    const alimentacao = result.find((r) => r.category_name === "ALIMENTAÇÃO");
    expect(alimentacao).toBeDefined();
    expect(alimentacao!.subcategories).toHaveLength(2);

    const restaurante = alimentacao!.subcategories.find((s) => s.name === "Restaurante");
    expect(restaurante!.purchase).toBe(150); // 100 + 50
    expect(restaurante!.goal).toBe(300);
    expect(restaurante!.diff).toBe(150); // 300 - 150

    const supermercado = alimentacao!.subcategories.find((s) => s.name === "Supermercado");
    expect(supermercado!.purchase).toBe(200);
    expect(supermercado!.goal).toBe(250);
    expect(supermercado!.diff).toBe(50);

    // Total
    expect(alimentacao!.total.purchase).toBe(350);
    expect(alimentacao!.total.goal).toBe(550);

    // TRANSPORTE
    const transporte = result.find((r) => r.category_name === "TRANSPORTE");
    expect(transporte!.subcategories).toHaveLength(1);
    expect(transporte!.total.purchase).toBe(30);
    expect(transporte!.total.goal).toBe(100);
  });

  it("returns empty array when no data", async () => {
    const result = await getPaymentsPerCategory([], []);
    expect(result).toHaveLength(0);
  });
});
