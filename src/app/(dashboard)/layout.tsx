import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAllPeriods, getCurrentPeriod } from "@/lib/actions/period-actions";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { connectDB } from "@/lib/db/connection";
import { User, type IUser } from "@/lib/db/models/user";
import { Family, type IFamily } from "@/lib/db/models/family";
import { TrialBanner } from "@/components/layout/trial-banner";
import { ADMIN_EMAIL } from "@/lib/utils/constants";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  await connectDB();
  let trialDaysRemaining: number | null = null;
  let subscriptionExpired = false;

  if (session?.user?.id) {
    const dbUser = await User.findById(session.user.id).lean<IUser>();
    if (dbUser && dbUser.onboarding_completed === false) {
      redirect("/onboarding");
    }

    // Check trial status from family (skip for admin)
    if (dbUser?.family_id && session.user.email !== ADMIN_EMAIL) {
      const family = await Family.findById(dbUser.family_id).lean<IFamily>();
      if (family) {
        const status = family.subscription_status ?? "trialing";
        const trialEndsAt = family.trial_ends_at;
        const now = new Date();

        if (status === "trialing" && trialEndsAt) {
          trialDaysRemaining = Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          if (trialDaysRemaining === 0) {
            subscriptionExpired = true;
            await Family.updateOne({ _id: family._id }, { subscription_status: "expired" });
          }
        } else if (status === "expired" || status === "canceled") {
          subscriptionExpired = true;
        }
      }
    }
  }

  const [periods, currentPeriod] = await Promise.all([
    getAllPeriods(),
    getCurrentPeriod(),
  ]);

  const user = {
    name: session?.user?.name || session?.user?.email || "Usuário",
    email: session?.user?.email || "",
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset className="light bg-background text-foreground">
        <SiteHeader
          periods={periods}
          currentPeriodId={currentPeriod?.id ?? null}
        />
        <TrialBanner daysRemaining={trialDaysRemaining} expired={subscriptionExpired} />
        <div className="flex flex-1 flex-col">
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
