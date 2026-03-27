import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/actions/admin-actions";
import { getFamilies } from "@/lib/actions/family-actions";
import { AdminFamiliesClient } from "@/components/admin/admin-families-client";

export default async function AdminFamiliesPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/dashboard");

  const families = await getFamilies();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gerenciar Famílias</h1>
      <AdminFamiliesClient families={families} />
    </div>
  );
}
