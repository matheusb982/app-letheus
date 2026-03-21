import { getGoals } from "@/lib/actions/goal-actions";
import { getCurrentPeriod } from "@/lib/actions/period-actions";
import { getSubcategoriesByType } from "@/lib/actions/category-actions";
import { GoalsClient } from "@/components/shared/goals-client";

export default async function GoalsPage() {
  const period = await getCurrentPeriod();
  const [goals, subcategories] = await Promise.all([
    period ? getGoals() : [],
    getSubcategoriesByType("purchase"),
  ]);

  return (
    <GoalsClient
      goals={goals}
      subcategories={subcategories}
      periodLabel={period?.label}
    />
  );
}
