"use server";

import { connectDB } from "@/lib/db/connection";
import { auth } from "@/lib/auth";
import { User } from "@/lib/db/models/user";

export async function getUserFamilyContext() {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");
  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user?.family_id) throw new Error("Usuário não pertence a nenhuma família");
  if (!user?.period_id) throw new Error("Nenhum período selecionado");
  return {
    userId: session.user.id,
    familyId: user.family_id,
    periodId: user.period_id,
  };
}

export async function getUserFamilyId() {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");
  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user?.family_id) throw new Error("Usuário não pertence a nenhuma família");
  return user.family_id;
}
