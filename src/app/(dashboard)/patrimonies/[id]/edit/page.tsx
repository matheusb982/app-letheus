import { notFound } from "next/navigation";
import { SubcategoryEntityForm } from "@/components/shared/subcategory-form";
import { getSubcategoriesByType } from "@/lib/actions/category-actions";
import { getPatrimonyById, updatePatrimony } from "@/lib/actions/patrimony-actions";

export default async function EditPatrimonyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [patrimony, subcategories] = await Promise.all([
    getPatrimonyById(id),
    getSubcategoriesByType("patrimony"),
  ]);

  if (!patrimony) notFound();

  async function handleUpdate(data: FormData) {
    "use server";
    return updatePatrimony(id, data);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Patrimônio</h1>
      <SubcategoryEntityForm
        entity={patrimony}
        subcategories={subcategories}
        action={handleUpdate}
        entityName="Patrimônio"
        returnPath="/patrimonies"
      />
    </div>
  );
}
