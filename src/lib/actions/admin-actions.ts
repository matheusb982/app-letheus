"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connection";
import { auth } from "@/lib/auth";
import { User, type IUser } from "@/lib/db/models/user";
import { Family, type IFamily, type SubscriptionStatus } from "@/lib/db/models/family";
import { ADMIN_EMAIL } from "@/lib/utils/constants";

export interface SerializedUser {
  id: string;
  fullname: string;
  email: string;
  family_name: string | null;
  family_id: string | null;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  created_at: string;
}

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.email !== ADMIN_EMAIL) {
    throw new Error("Acesso negado");
  }
  return session;
}

export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user.email === ADMIN_EMAIL;
}

export async function getUsers(): Promise<SerializedUser[]> {
  await requireAdmin();
  await connectDB();
  const users = await User.find().sort({ created_at: -1 }).lean<IUser[]>();
  const familyIds = users.map((u) => u.family_id).filter(Boolean);
  const families = await Family.find({ _id: { $in: familyIds } }).lean<IFamily[]>();
  const familyMap = new Map(families.map((f) => [f._id.toString(), f]));

  return users.map((u) => {
    const family = u.family_id ? familyMap.get(u.family_id.toString()) : null;
    return {
      id: u._id.toString(),
      fullname: u.fullname || "",
      email: u.email,
      family_name: family?.name ?? null,
      family_id: u.family_id?.toString() ?? null,
      subscription_status: (family?.subscription_status ?? "trialing") as SubscriptionStatus,
      trial_ends_at: family?.trial_ends_at ? family.trial_ends_at.toISOString() : null,
      created_at: u.created_at.toISOString().split("T")[0],
    };
  });
}

export async function createUser(data: FormData) {
  await requireAdmin();
  await connectDB();

  const email = (data.get("email") as string)?.toLowerCase().trim();
  const fullname = (data.get("fullname") as string)?.trim() || "";
  const password = data.get("password") as string;

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios" };
  }

  if (password.length < 6) {
    return { error: "Senha deve ter no mínimo 6 caracteres" };
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return { error: "Email já cadastrado" };
  }

  const encrypted_password = await bcrypt.hash(password, 12);
  await User.create({ email, fullname, encrypted_password });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUser(id: string, data: FormData) {
  await requireAdmin();
  await connectDB();

  const email = (data.get("email") as string)?.toLowerCase().trim();
  const fullname = (data.get("fullname") as string)?.trim() || "";
  const password = data.get("password") as string;

  if (!email) {
    return { error: "Email é obrigatório" };
  }

  const existing = await User.findOne({ email, _id: { $ne: id } });
  if (existing) {
    return { error: "Email já cadastrado por outro usuário" };
  }

  const updateData: Record<string, unknown> = { email, fullname };

  if (password && password.length > 0) {
    if (password.length < 6) {
      return { error: "Senha deve ter no mínimo 6 caracteres" };
    }
    updateData.encrypted_password = await bcrypt.hash(password, 12);
  }

  await User.findByIdAndUpdate(id, updateData);

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(id: string) {
  await requireAdmin();
  await connectDB();

  const session = await auth();
  const user = await User.findById(id);
  if (user?.email === session?.user.email) {
    return { error: "Você não pode excluir seu próprio usuário" };
  }

  await User.findByIdAndDelete(id);
  revalidatePath("/admin/users");
  return { success: true };
}

export async function activateSubscription(familyId: string) {
  await requireAdmin();
  await connectDB();

  await Family.findByIdAndUpdate(familyId, {
    subscription_status: "active",
    trial_ends_at: null,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function extendTrial(familyId: string, days: number) {
  await requireAdmin();
  await connectDB();

  const family = await Family.findById(familyId);
  if (!family) return { error: "Família não encontrada" };

  const baseDate = family.trial_ends_at && new Date(family.trial_ends_at) > new Date()
    ? new Date(family.trial_ends_at)
    : new Date();

  baseDate.setDate(baseDate.getDate() + days);

  await Family.findByIdAndUpdate(familyId, {
    subscription_status: "trialing",
    trial_ends_at: baseDate,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function cancelSubscription(familyId: string) {
  await requireAdmin();
  await connectDB();

  await Family.findByIdAndUpdate(familyId, {
    subscription_status: "canceled",
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function expireSubscription(familyId: string) {
  await requireAdmin();
  await connectDB();

  await Family.findByIdAndUpdate(familyId, {
    subscription_status: "expired",
  });

  revalidatePath("/admin/users");
  return { success: true };
}
