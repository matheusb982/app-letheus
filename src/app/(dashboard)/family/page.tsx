import { redirect } from "next/navigation";
import { getMyFamily } from "@/lib/actions/family-member-actions";
import { FamilyManagementClient } from "@/components/family/family-management-client";

export default async function FamilyPage() {
  let familyData;
  try {
    familyData = await getMyFamily();
  } catch {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground">
          {familyData.memberCount} de {familyData.memberLimit} membros
        </p>
      </div>
      <FamilyManagementClient
        familyName={familyData.name}
        members={familyData.members}
        memberCount={familyData.memberCount}
        memberLimit={familyData.memberLimit}
        auditLog={familyData.auditLog}
      />
    </div>
  );
}
