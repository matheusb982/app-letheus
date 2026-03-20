import { PurchaseForm } from "@/components/purchases/purchase-form";
import { getSubcategoriesByType } from "@/lib/actions/category-actions";
import { createPurchase } from "@/lib/actions/purchase-actions";

export default async function NewPurchasePage() {
  const subcategories = await getSubcategoriesByType("purchase");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nova Despesa</h1>
      <PurchaseForm subcategories={subcategories} action={createPurchase} />
    </div>
  );
}
