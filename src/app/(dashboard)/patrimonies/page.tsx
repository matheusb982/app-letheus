import { getPatrimonies } from "@/lib/actions/patrimony-actions";
import { getCurrentPeriod } from "@/lib/actions/period-actions";
import { getSubcategoriesByType } from "@/lib/actions/category-actions";
import { PatrimoniesClient } from "@/components/shared/patrimonies-client";

export default async function PatrimoniesPage() {
  const period = await getCurrentPeriod();
  const [patrimonies, subcategories] = await Promise.all([
    period ? getPatrimonies() : [],
    getSubcategoriesByType("patrimony"),
  ]);

  return (
    <PatrimoniesClient
      patrimonies={patrimonies}
      subcategories={subcategories}
      periodLabel={period?.label}
    />
  );
}
