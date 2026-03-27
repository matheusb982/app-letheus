import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/actions/admin-actions";
import { getFamilyMembers } from "@/lib/actions/family-actions";
import { Family } from "@/lib/db/models/family";
import { connectDB } from "@/lib/db/connection";
import { AdminFamilyMembersClient } from "@/components/admin/admin-family-members-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminFamilyDetailPage({ params }: Props) {
  const { id } = await params;
  const admin = await isAdmin();
  if (!admin) redirect("/dashboard");

  await connectDB();
  const family = await Family.findById(id).lean();
  if (!family) redirect("/admin/families");

  const members = await getFamilyMembers(id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{(family as Record<string, unknown>).name as string}</h1>
        <p className="text-muted-foreground">Membros da família</p>
      </div>
      <AdminFamilyMembersClient familyId={id} members={members} />
    </div>
  );
}
