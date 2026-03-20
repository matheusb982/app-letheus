import { SubcategoryEntityForm } from "@/components/shared/subcategory-form";
import { getSubcategoriesByType } from "@/lib/actions/category-actions";
import { createGoal } from "@/lib/actions/goal-actions";

export default async function NewGoalPage() {
  const subcategories = await getSubcategoriesByType("purchase");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nova Meta</h1>
      <SubcategoryEntityForm
        subcategories={subcategories}
        action={createGoal}
        entityName="Meta"
        returnPath="/goals"
      />
    </div>
  );
}
