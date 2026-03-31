"use server";

import { connectDB } from "@/lib/db/connection";
import { auth } from "@/lib/auth";
import { User } from "@/lib/db/models/user";
import { Feedback } from "@/lib/db/models/feedback";
import { getUserFamilyId } from "@/lib/actions/family-helpers";
import { revalidatePath } from "next/cache";
import { ADMIN_EMAIL } from "@/lib/utils/constants";

export async function submitFeedback(message: string) {
  const session = await auth();
  if (!session) return { error: "Não autorizado" };

  if (!message || message.trim().length === 0) {
    return { error: "Mensagem não pode ser vazia" };
  }

  if (message.trim().length > 2000) {
    return { error: "Mensagem muito longa (máximo 2000 caracteres)" };
  }

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user) return { error: "Usuário não encontrado" };

  const familyId = await getUserFamilyId();

  await Feedback.create({
    user_id: session.user.id,
    user_name: user.fullname ?? user.email,
    user_email: user.email,
    family_id: familyId,
    message: message.trim(),
  });

  return { success: true };
}

export interface SerializedFeedback {
  id: string;
  user_name: string;
  user_email: string;
  message: string;
  status: "pending" | "read" | "resolved";
  created_at: string;
}

export async function getFeedbacks(): Promise<SerializedFeedback[]> {
  const session = await auth();
  if (!session || session.user.email !== ADMIN_EMAIL) return [];

  await connectDB();
  const feedbacks = await Feedback.find().sort({ created_at: -1 }).lean();

  return feedbacks.map((f: Record<string, unknown>) => ({
    id: String(f._id),
    user_name: String(f.user_name ?? ""),
    user_email: String(f.user_email ?? ""),
    message: String(f.message ?? ""),
    status: (f.status as "pending" | "read" | "resolved") ?? "pending",
    created_at: f.created_at ? new Date(f.created_at as string).toLocaleDateString("pt-BR") : "",
  }));
}

export async function updateFeedbackStatus(id: string, status: "pending" | "read" | "resolved") {
  const session = await auth();
  if (!session || session.user.email !== ADMIN_EMAIL) return { error: "Não autorizado" };

  await connectDB();
  await Feedback.findByIdAndUpdate(id, { status });
  revalidatePath("/admin/feedbacks");
  return { success: true };
}

export async function deleteFeedback(id: string) {
  const session = await auth();
  if (!session || session.user.email !== ADMIN_EMAIL) return { error: "Não autorizado" };

  await connectDB();
  await Feedback.findByIdAndDelete(id);
  revalidatePath("/admin/feedbacks");
  return { success: true };
}
