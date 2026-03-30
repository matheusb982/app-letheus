import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAllPeriods, getCurrentPeriod } from "@/lib/actions/period-actions";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { connectDB } from "@/lib/db/connection";
import { User, type IUser } from "@/lib/db/models/user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Check onboarding status — only redirect users who explicitly have onboarding_completed === false
  // Existing users (field doesn't exist in DB) return undefined with .lean(), so they skip this
  if (session?.user?.id) {
    await connectDB();
    const dbUser = await User.findById(session.user.id).lean<IUser>();
    if (dbUser && dbUser.onboarding_completed === false) {
      redirect("/onboarding");
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
        <div className="flex flex-1 flex-col">
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
