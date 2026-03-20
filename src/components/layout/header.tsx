import { auth } from "@/lib/auth";
import { getAllPeriods, getCurrentPeriod } from "@/lib/actions/period-actions";
import { PeriodSelector } from "./period-selector";
import { UserMenu } from "./user-menu";

export async function Header() {
  const session = await auth();
  if (!session) return null;

  const [periods, currentPeriod] = await Promise.all([
    getAllPeriods(),
    getCurrentPeriod(),
  ]);

  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      <PeriodSelector
        periods={periods}
        currentPeriodId={currentPeriod?.id ?? null}
        canCreateNew={true}
      />
      <UserMenu
        name={session.user.name || session.user.email}
        email={session.user.email}
      />
    </header>
  );
}
