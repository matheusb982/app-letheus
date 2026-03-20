import { SubcategoryEntityForm } from "@/components/shared/subcategory-form";
import { getSubcategoriesByType } from "@/lib/actions/category-actions";
import { createPatrimony } from "@/lib/actions/patrimony-actions";

export default async function NewPatrimonyPage() {
  const subcategories = await getSubcategoriesByType("patrimony");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Novo Patrimônio</h1>
      <SubcategoryEntityForm
        subcategories={subcategories}
        action={createPatrimony}
        entityName="Patrimônio"
        returnPath="/patrimonies"
      />
    </div>
  );
}
