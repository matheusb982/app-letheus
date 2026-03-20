import { getCategories } from "@/lib/actions/category-actions";
import { CategoriesClient } from "@/components/categories/categories-client";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Categorias</h1>
      <CategoriesClient categories={categories} />
    </div>
  );
}
