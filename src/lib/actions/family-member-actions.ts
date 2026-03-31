"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connection";
import { auth } from "@/lib/auth";
import { signOut } from "@/lib/auth";
import { User, type IUser } from "@/lib/db/models/user";
import { Family, type IFamily } from "@/lib/db/models/family";
import { AuditLog } from "@/lib/db/models/audit-log";
import { Purchase } from "@/lib/db/models/purchase";
import { Revenue } from "@/lib/db/models/revenue";
import { Goal } from "@/lib/db/models/goal";
import { Patrimony } from "@/lib/db/models/patrimony";
import { Period } from "@/lib/db/models/period";
import { Category } from "@/lib/db/models/category";
import { ChatSession } from "@/lib/db/models/chat-session";
import { ChatMessage } from "@/lib/db/models/chat-message";
import { CachedResponse } from "@/lib/db/models/cached-response";
import { ClassificationRule } from "@/lib/db/models/classification-rule";
import type { SerializedFamilyMember } from "@/lib/actions/family-actions";

const MEMBER_LIMIT = 3;

export interface SerializedAuditLog {
  id: string;
  actor_email: string;
  action: string;
  target_email?: string;
  details?: string;
  created_at: string;
}

async function requireFamilyOwner() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autorizado");

  await connectDB();
  const user = await User.findById(session.user.id).lean<IUser>();
  if (!user?.family_id) throw new Error("Usuário não pertence a uma família");

  const family = await Family.findById(user.family_id).lean<IFamily>();
  if (!family) throw new Error("Família não encontrada");

  if (family.owner_id.toString() !== session.user.id) {
    throw new Error("Apenas o dono da família pode gerenciar membros");
  }

  return { session, user, family };
}

export async function isFamilyOwner(): Promise<boolean> {
  try {
    await requireFamilyOwner();
    return true;
  } catch {
    return false;
  }
}

export async function getMyFamily(): Promise<{
  name: string;
  members: SerializedFamilyMember[];
  memberCount: number;
  memberLimit: number;
  auditLog: SerializedAuditLog[];
}> {
  const { family } = await requireFamilyOwner();

  const members = await User.find({ family_id: family._id })
    .sort({ family_role: 1, fullname: 1 })
    .lean<IUser[]>();

  const auditLogs = await AuditLog.find({ family_id: family._id })
    .sort({ created_at: -1 })
    .limit(50)
    .lean();

  return {
    name: family.name,
    memberCount: members.length,
    memberLimit: MEMBER_LIMIT,
    members: members.map((m) => ({
      id: m._id.toString(),
      fullname: m.fullname || "",
      email: m.email,
      family_role: m.family_role || "member",
      created_at: m.created_at.toISOString().split("T")[0],
    })),
    auditLog: auditLogs.map((log) => ({
      id: (log._id as string).toString(),
      actor_email: log.actor_email,
      action: log.action,
      target_email: log.target_email,
      details: log.details,
      created_at: log.created_at.toISOString(),
    })),
  };
}

export async function updateMyFamilyName(data: FormData) {
  const { family } = await requireFamilyOwner();

  const name = (data.get("name") as string)?.trim();
  if (!name) return { error: "Nome da família é obrigatório" };

  await Family.findByIdAndUpdate(family._id, { name });

  revalidatePath("/family");
  return { success: true };
}

export async function addMyFamilyMember(data: FormData) {
  const { session, family } = await requireFamilyOwner();

  const email = (data.get("email") as string)?.toLowerCase().trim();
  const fullname = (data.get("fullname") as string)?.trim() || "";
  const password = data.get("password") as string;

  if (!email || !password) return { error: "Email e senha são obrigatórios" };
  if (password.length < 6) return { error: "Senha deve ter no mínimo 6 caracteres" };

  // Check member limit
  const currentCount = await User.countDocuments({ family_id: family._id });
  if (currentCount >= MEMBER_LIMIT) {
    return { error: `Limite de ${MEMBER_LIMIT} membros atingido` };
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) return { error: "Email já cadastrado" };

  const encrypted_password = await bcrypt.hash(password, 12);
  const newMember = await User.create({
    email,
    fullname,
    encrypted_password,
    family_id: family._id,
    family_role: "member",
    onboarding_completed: true,
  });

  // Audit log
  await AuditLog.create({
    family_id: family._id,
    actor_id: session.user.id,
    actor_email: session.user.email,
    action: "member_added",
    target_id: newMember._id,
    target_email: email,
    details: `${session.user.email} adicionou ${email} à família`,
  });

  revalidatePath("/family");
  return { success: true };
}

export async function removeMyFamilyMember(userId: string) {
  const { session, family } = await requireFamilyOwner();

  const targetUser = await User.findById(userId).lean<IUser>();
  if (!targetUser) return { error: "Usuário não encontrado" };

  // Verify target belongs to this family
  if (targetUser.family_id?.toString() !== family._id.toString()) {
    return { error: "Usuário não pertence a esta família" };
  }

  // Prevent removing yourself (the owner)
  if (userId === session.user.id) {
    return { error: "Não é possível remover o dono da família" };
  }

  const targetEmail = targetUser.email;

  // Unlink from family (don't delete the user account)
  await User.findByIdAndUpdate(userId, {
    $unset: { family_id: 1, family_role: 1 },
  });

  // Audit log
  await AuditLog.create({
    family_id: family._id,
    actor_id: session.user.id,
    actor_email: session.user.email,
    action: "member_removed",
    target_id: userId,
    target_email: targetEmail,
    details: `${session.user.email} removeu ${targetEmail} da família`,
  });

  revalidatePath("/family");
  return { success: true };
}

// ============================================================
// EXCLUSÃO DE CONTA E FAMÍLIA (LGPD)
// ============================================================

const ANONYMIZED_LABEL = "Usuário removido";

/**
 * Anonimiza referências ao usuário em dados da família.
 * Mantém os dados financeiros intactos, só remove referência pessoal.
 */
async function anonymizeUserReferences(userId: string) {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  await ChatSession.updateMany(
    { user_id: userObjectId },
    { $unset: { user_id: 1 } }
  );
  await ChatMessage.updateMany(
    { user_id: userObjectId },
    { $unset: { user_id: 1 } }
  );
  await CachedResponse.deleteMany({ user_id: userObjectId });
  await ClassificationRule.deleteMany({ user_id: userObjectId });

  // Audit log: anonimizar emails mas preservar o registro
  await AuditLog.updateMany(
    { actor_id: userObjectId },
    { actor_email: ANONYMIZED_LABEL }
  );
  await AuditLog.updateMany(
    { target_id: userObjectId },
    { target_email: ANONYMIZED_LABEL }
  );
}

/**
 * Exclui todos os dados financeiros de uma família.
 */
async function deleteAllFamilyData(familyId: mongoose.Types.ObjectId) {
  await Purchase.deleteMany({ family_id: familyId });
  await Revenue.deleteMany({ family_id: familyId });
  await Goal.deleteMany({ family_id: familyId });
  await Patrimony.deleteMany({ family_id: familyId });
  await Period.deleteMany({ family_id: familyId });
  await Category.deleteMany({ family_id: familyId });
  await ChatSession.deleteMany({ family_id: familyId });
  await ChatMessage.deleteMany({ family_id: familyId });
  await CachedResponse.deleteMany({ family_id: familyId });
  await ClassificationRule.deleteMany({ family_id: familyId });
  await AuditLog.deleteMany({ family_id: familyId });
}

/**
 * Exclusão de conta pelo próprio usuário.
 * - Membro comum: anonimiza referências, deleta usuário, mantém dados da família
 * - Owner (único membro): deleta tudo (família + dados + usuário)
 * - Owner (com membros): bloqueia — deve remover membros ou excluir família primeiro
 */
export async function deleteMyAccount() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autorizado");

  await connectDB();
  const user = await User.findById(session.user.id).lean<IUser>();
  if (!user) return { error: "Usuário não encontrado" };

  if (user.family_id) {
    const family = await Family.findById(user.family_id).lean<IFamily>();

    if (family && family.owner_id.toString() === session.user.id) {
      const memberCount = await User.countDocuments({ family_id: family._id });

      if (memberCount > 1) {
        return {
          error: "Você é o responsável pela família. Remova os membros ou exclua a família primeiro.",
        };
      }

      // Owner é o único membro — excluir tudo
      await deleteAllFamilyData(family._id as mongoose.Types.ObjectId);
      await User.findByIdAndDelete(session.user.id);
      await Family.findByIdAndDelete(family._id);

      await signOut({ redirect: false });
      return { success: true, redirect: "/login" };
    }

    // Membro comum — anonimizar e sair
    await anonymizeUserReferences(session.user.id);

    await AuditLog.create({
      family_id: user.family_id,
      actor_id: session.user.id,
      actor_email: ANONYMIZED_LABEL,
      action: "member_deleted_account",
      target_id: session.user.id,
      target_email: user.email,
      details: "Membro excluiu a própria conta",
    });
  }

  await User.findByIdAndDelete(session.user.id);

  await signOut({ redirect: false });
  return { success: true, redirect: "/login" };
}

/**
 * Exclusão de família inteira — apenas owner.
 * Deleta todos os dados financeiros, membros e a família.
 */
export async function deleteMyFamily(): Promise<{ error?: string; success?: boolean; redirect?: string }> {
  try {
    const { family } = await requireFamilyOwner();
    const familyId = family._id as mongoose.Types.ObjectId;

    await deleteAllFamilyData(familyId);
    await User.deleteMany({ family_id: familyId });
    await Family.findByIdAndDelete(familyId);

    await signOut({ redirect: false });
    return { success: true, redirect: "/login" };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao excluir família" };
  }
}
