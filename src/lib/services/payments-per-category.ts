import { connectDB } from "@/lib/db/connection";
import { Category, type ICategory } from "@/lib/db/models/category";

interface SubcategoryRow {
  name: string;
  goal: number;
  purchase: number;
  diff: number;
  id: string | null;
}

interface CategoryGroup {
  category_name: string;
  subcategories: SubcategoryRow[];
  total: SubcategoryRow;
}

interface PurchaseDoc {
  value: number;
  subcategory_id?: { toString(): string };
}

interface GoalDoc {
  value: number;
  subcategory_id?: { toString(): string };
}

export async function getPaymentsPerCategory(
  purchases: PurchaseDoc[],
  goals: GoalDoc[]
): Promise<CategoryGroup[]> {
  await connectDB();

  // Group purchases by subcategory_id
  const purchasesBySubcat = new Map<string, number>();
  for (const p of purchases) {
    const key = p.subcategory_id?.toString() ?? "unknown";
    purchasesBySubcat.set(key, (purchasesBySubcat.get(key) ?? 0) + p.value);
  }

  // Group goals by subcategory_id
  const goalsBySubcat = new Map<string, number>();
  for (const g of goals) {
    const key = g.subcategory_id?.toString() ?? "unknown";
    goalsBySubcat.set(key, (goalsBySubcat.get(key) ?? 0) + g.value);
  }

  // Get all purchase categories with subcategories
  const categories = await Category.find({ category_type: "purchase" }).lean<ICategory[]>();

  const result: CategoryGroup[] = [];

  for (const category of categories) {
    const subcategoryRows: SubcategoryRow[] = [];
    let totalGoal = 0;
    let totalPurchase = 0;

    for (const sub of category.subcategories) {
      const subId = sub._id.toString();
      const goalVal = goalsBySubcat.get(subId) ?? 0;
      const purchaseVal = purchasesBySubcat.get(subId) ?? 0;
      const diff = goalVal - purchaseVal;

      if (goalVal > 0 || purchaseVal > 0) {
        subcategoryRows.push({
          name: sub.name,
          goal: goalVal,
          purchase: purchaseVal,
          diff,
          id: subId,
        });
        totalGoal += goalVal;
        totalPurchase += purchaseVal;
      }
    }

    if (subcategoryRows.length > 0) {
      result.push({
        category_name: category.name,
        subcategories: subcategoryRows,
        total: {
          name: "TOTAL",
          goal: totalGoal,
          purchase: totalPurchase,
          diff: totalGoal - totalPurchase,
          id: null,
        },
      });
    }
  }

  return result;
}
