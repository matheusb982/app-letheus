import { getPurchases, type SerializedPurchase } from "@/lib/actions/purchase-actions";
import { getCurrentPeriod } from "@/lib/actions/period-actions";
import { getSubcategoriesByType } from "@/lib/actions/category-actions";
import { PurchasesClient } from "@/components/purchases/purchases-client";

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ subcategory?: string }>;
}) {
  const params = await searchParams;
  const period = await getCurrentPeriod();
  const [purchases, subcategories] = await Promise.all([
    period ? getPurchases(params.subcategory) : ([] as SerializedPurchase[]),
    getSubcategoriesByType("purchase"),
  ]);

  return (
    <PurchasesClient
      purchases={purchases}
      subcategories={subcategories}
      periodLabel={period?.label}
    />
  );
}
