import { RevenueForm } from "@/components/shared/revenue-form";
import { createRevenue } from "@/lib/actions/revenue-actions";

export default function NewRevenuePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nova Receita</h1>
      <RevenueForm action={createRevenue} />
    </div>
  );
}
