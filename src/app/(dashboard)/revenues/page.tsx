import { getRevenues } from "@/lib/actions/revenue-actions";
import { getCurrentPeriod } from "@/lib/actions/period-actions";
import { RevenuesClient } from "@/components/shared/revenues-client";

export default async function RevenuesPage() {
  const period = await getCurrentPeriod();
  const revenues = period ? await getRevenues() : [];

  return <RevenuesClient revenues={revenues} periodLabel={period?.label} />;
}
