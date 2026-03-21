import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { auth } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/lib/utils/constants";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = session?.user.email === ADMIN_EMAIL;

  return (
    <div className="flex h-screen">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
