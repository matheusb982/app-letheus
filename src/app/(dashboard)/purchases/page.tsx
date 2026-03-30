import { getPurchases, type SerializedPurchase } from "@/lib/actions/purchase-actions";
import { getCurrentPeriod } from "@/lib/actions/period-actions";
import { getSubcategoriesByType } from "@/lib/actions/category-actions";
import { hasSampleData } from "@/lib/actions/onboarding-actions";
import { PurchasesClient } from "@/components/purchases/purchases-client";
import { SampleDataBanner } from "@/components/shared/sample-data-banner";

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ subcategory?: string }>;
}) {
  const params = await searchParams;
  const period = await getCurrentPeriod();
  const [purchases, subcategories, showSampleBanner] = await Promise.all([
    period ? getPurchases(params.subcategory) : ([] as SerializedPurchase[]),
    getSubcategoriesByType("purchase"),
    hasSampleData(),
  ]);

  return (
    <div className="space-y-4">
      {showSampleBanner && <SampleDataBanner />}
      <PurchasesClient
        purchases={purchases}
        subcategories={subcategories}
        periodLabel={period?.label}
      />
    </div>
  );
}
