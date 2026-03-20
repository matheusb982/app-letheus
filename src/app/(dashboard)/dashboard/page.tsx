import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { Period } from "@/lib/db/models/period";
import { signOutAction } from "@/lib/actions/sign-out-action";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  await connectDB();
  const user = await User.findById(session.user.id);
  const period = user?.period_id
    ? await Period.findById(user.period_id)
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Olá, {user?.fullname || session.user.email}
            {period && ` — ${period.name} ${period.year}`}
          </p>
        </div>
        <form action={signOutAction}>
          <Button variant="outline" size="sm">
            Sair
          </Button>
        </form>
      </div>
      <p className="text-muted-foreground">KPIs e tabela de categorias — Fase 3</p>
    </div>
  );
}
