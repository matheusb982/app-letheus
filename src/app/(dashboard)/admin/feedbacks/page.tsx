import { getFeedbacks } from "@/lib/actions/feedback-actions";
import { AdminFeedbacksClient } from "@/components/admin/admin-feedbacks-client";

export default async function AdminFeedbacksPage() {
  const feedbacks = await getFeedbacks();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Feedbacks</h1>
      <AdminFeedbacksClient feedbacks={feedbacks} />
    </div>
  );
}
