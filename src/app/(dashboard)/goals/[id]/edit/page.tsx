import { notFound } from "next/navigation";
import { SubcategoryEntityForm } from "@/components/shared/subcategory-form";
import { getSubcategoriesByType } from "@/lib/actions/category-actions";
import { getGoalById, updateGoal } from "@/lib/actions/goal-actions";

export default async function EditGoalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [goal, subcategories] = await Promise.all([
    getGoalById(id),
    getSubcategoriesByType("purchase"),
  ]);

  if (!goal) notFound();

  async function handleUpdate(data: FormData) {
    "use server";
    return updateGoal(id, data);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Meta</h1>
      <SubcategoryEntityForm
        entity={goal}
        subcategories={subcategories}
        action={handleUpdate}
        entityName="Meta"
        returnPath="/goals"
      />
    </div>
  );
}
