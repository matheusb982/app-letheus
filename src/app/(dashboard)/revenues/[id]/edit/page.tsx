import { notFound } from "next/navigation";
import { RevenueForm } from "@/components/shared/revenue-form";
import { getRevenueById, updateRevenue } from "@/lib/actions/revenue-actions";

export default async function EditRevenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const revenue = await getRevenueById(id);
  if (!revenue) notFound();

  async function handleUpdate(data: FormData) {
    "use server";
    return updateRevenue(id, data);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Receita</h1>
      <RevenueForm revenue={revenue} action={handleUpdate} />
    </div>
  );
}
