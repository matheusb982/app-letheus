import { describe, it, expect } from "vitest";
import { purchaseSchema } from "@/lib/validations/purchases";
import { revenueSchema } from "@/lib/validations/revenues";
import { goalSchema } from "@/lib/validations/goals";
import { categorySchema, subcategorySchema } from "@/lib/validations/categories";

describe("purchaseSchema", () => {
  it("accepts valid purchase", () => {
    const result = purchaseSchema.safeParse({
      value: 100.5,
      purchase_date: "2024-01-15",
      purchase_type: "credit",
      description: "Test",
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero value", () => {
    const result = purchaseSchema.safeParse({
      value: 0,
      purchase_date: "2024-01-15",
      purchase_type: "credit",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid purchase type", () => {
    const result = purchaseSchema.safeParse({
      value: 100,
      purchase_date: "2024-01-15",
      purchase_type: "cash",
    });
    expect(result.success).toBe(false);
  });

  it("allows missing optional fields", () => {
    const result = purchaseSchema.safeParse({
      value: 50,
      purchase_date: "2024-01-15",
      purchase_type: "debit",
    });
    expect(result.success).toBe(true);
  });
});

describe("revenueSchema", () => {
  it("accepts valid revenue", () => {
    const result = revenueSchema.safeParse({
      value: 5000,
      name: "Salary",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = revenueSchema.safeParse({
      value: 5000,
      name: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("goalSchema", () => {
  it("accepts valid goal", () => {
    const result = goalSchema.safeParse({
      value: 200,
      subcategory_id: "abc123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing subcategory_id", () => {
    const result = goalSchema.safeParse({
      value: 200,
      subcategory_id: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("categorySchema", () => {
  it("accepts valid category", () => {
    const result = categorySchema.safeParse({
      name: "Test Category",
      category_type: "purchase",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid category_type", () => {
    const result = categorySchema.safeParse({
      name: "Test",
      category_type: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("subcategorySchema", () => {
  it("accepts valid subcategory", () => {
    const result = subcategorySchema.safeParse({
      name: "Test Sub",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = subcategorySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});
