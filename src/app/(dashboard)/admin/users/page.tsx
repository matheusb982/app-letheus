import { redirect } from "next/navigation";
import { getUsers, isAdmin } from "@/lib/actions/admin-actions";
import { AdminUsersClient } from "@/components/admin/admin-users-client";

export default async function AdminUsersPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/dashboard");

  const users = await getUsers();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
      <AdminUsersClient users={users} />
    </div>
  );
}
