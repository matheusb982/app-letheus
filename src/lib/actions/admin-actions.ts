"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connection";
import { auth } from "@/lib/auth";
import { User, type IUser } from "@/lib/db/models/user";
import { ADMIN_EMAIL } from "@/lib/utils/constants";

export interface SerializedUser {
  id: string;
  fullname: string;
  email: string;
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
  return users.map((u) => ({
    id: u._id.toString(),
    fullname: u.fullname || "",
    email: u.email,
    created_at: u.created_at.toISOString().split("T")[0],
  }));
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
