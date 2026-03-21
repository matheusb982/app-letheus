import { auth } from "@/lib/auth";
import { getAllPeriods, getCurrentPeriod } from "@/lib/actions/period-actions";
import { PeriodSelector } from "./period-selector";
import { UserMenu } from "./user-menu";
import { MobileSidebar } from "./mobile-sidebar";

export async function Header() {
  const session = await auth();
  if (!session) return null;

  const [periods, currentPeriod] = await Promise.all([
    getAllPeriods(),
    getCurrentPeriod(),
  ]);

  return (
    <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
      <div className="flex items-center gap-2">
        <MobileSidebar />
        <PeriodSelector
          periods={periods}
          currentPeriodId={currentPeriod?.id ?? null}
          canCreateNew={true}
        />
      </div>
      <UserMenu
        name={session.user.name || session.user.email}
        email={session.user.email}
      />
    </header>
  );
}
