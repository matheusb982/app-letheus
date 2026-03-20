import { notFound } from "next/navigation";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { getSubcategoriesByType } from "@/lib/actions/category-actions";
import { getPurchaseById, updatePurchase } from "@/lib/actions/purchase-actions";

export default async function EditPurchasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [purchase, subcategories] = await Promise.all([
    getPurchaseById(id),
    getSubcategoriesByType("purchase"),
  ]);

  if (!purchase) notFound();

  async function handleUpdate(data: FormData) {
    "use server";
    return updatePurchase(id, data);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Despesa</h1>
      <PurchaseForm
        purchase={purchase}
        subcategories={subcategories}
        action={handleUpdate}
      />
    </div>
  );
}
