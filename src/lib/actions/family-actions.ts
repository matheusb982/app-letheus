"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connection";
import { auth } from "@/lib/auth";
import { User, type IUser } from "@/lib/db/models/user";
import { Family, type IFamily } from "@/lib/db/models/family";
import { Category, type ICategory } from "@/lib/db/models/category";
import { ADMIN_EMAIL } from "@/lib/utils/constants";

export interface SerializedFamily {
  id: string;
  name: string;
  owner_name: string;
  owner_email: string;
  member_count: number;
  created_at: string;
}

export interface SerializedFamilyMember {
  id: string;
  fullname: string;
  email: string;
  family_role: string;
  created_at: string;
}

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.email !== ADMIN_EMAIL) {
    throw new Error("Acesso negado");
  }
  return session;
}

export async function getFamilies(): Promise<SerializedFamily[]> {
  await requireSuperAdmin();
  await connectDB();

  const families = await Family.find().sort({ created_at: -1 }).lean<IFamily[]>();
  const result: SerializedFamily[] = [];

  for (const f of families) {
    const owner = await User.findById(f.owner_id).lean<IUser>();
    const memberCount = await User.countDocuments({ family_id: f._id });
    result.push({
      id: f._id.toString(),
      name: f.name,
      owner_name: owner?.fullname || "",
      owner_email: owner?.email || "",
      member_count: memberCount,
      created_at: f.created_at.toISOString().split("T")[0],
    });
  }

  return result;
}

export async function getFamilyMembers(familyId: string): Promise<SerializedFamilyMember[]> {
  await requireSuperAdmin();
  await connectDB();

  const members = await User.find({ family_id: familyId }).sort({ family_role: 1, fullname: 1 }).lean<IUser[]>();
  return members.map((m) => ({
    id: m._id.toString(),
    fullname: m.fullname || "",
    email: m.email,
    family_role: m.family_role || "member",
    created_at: m.created_at.toISOString().split("T")[0],
  }));
}

export async function createFamily(data: FormData) {
  await requireSuperAdmin();
  await connectDB();

  const familyName = (data.get("family_name") as string)?.trim();
  const memberEmail = (data.get("member_email") as string)?.toLowerCase().trim();
  const memberFullname = (data.get("member_fullname") as string)?.trim() || "";
  const memberPassword = data.get("member_password") as string;

  if (!familyName) return { error: "Nome da família é obrigatório" };
  if (!memberEmail || !memberPassword) return { error: "Email e senha do primeiro membro são obrigatórios" };
  if (memberPassword.length < 6) return { error: "Senha deve ter no mínimo 6 caracteres" };

  const existingUser = await User.findOne({ email: memberEmail });
  if (existingUser) return { error: "Email já cadastrado" };

  // Create the first member
  const encrypted_password = await bcrypt.hash(memberPassword, 12);
  const member = await User.create({
    email: memberEmail,
    fullname: memberFullname,
    encrypted_password,
    family_role: "admin",
  });

  // Create the family
  const family = await Family.create({
    name: familyName,
    owner_id: member._id,
  });

  // Link member to family
  await User.findByIdAndUpdate(member._id, { family_id: family._id });

  // Clone global category templates for this family
  const templates = await Category.find({ family_id: null }).lean<ICategory[]>();
  for (const template of templates) {
    await Category.create({
      name: template.name,
      description: template.description,
      category_type: template.category_type,
      subcategories: template.subcategories.map((s) => ({
        name: s.name,
        description: s.description,
      })),
      family_id: family._id,
    });
  }

  revalidatePath("/admin/families");
  return { success: true };
}

export async function addFamilyMember(familyId: string, data: FormData) {
  await requireSuperAdmin();
  await connectDB();

  const email = (data.get("email") as string)?.toLowerCase().trim();
  const fullname = (data.get("fullname") as string)?.trim() || "";
  const password = data.get("password") as string;

  if (!email || !password) return { error: "Email e senha são obrigatórios" };
  if (password.length < 6) return { error: "Senha deve ter no mínimo 6 caracteres" };

  const existingUser = await User.findOne({ email });
  if (existingUser) return { error: "Email já cadastrado" };

  const family = await Family.findById(familyId);
  if (!family) return { error: "Família não encontrada" };

  const encrypted_password = await bcrypt.hash(password, 12);
  await User.create({
    email,
    fullname,
    encrypted_password,
    family_id: familyId,
    family_role: "member",
  });

  revalidatePath("/admin/families");
  return { success: true };
}

export async function removeFamilyMember(userId: string) {
  await requireSuperAdmin();
  await connectDB();

  const user = await User.findById(userId);
  if (!user) return { error: "Usuário não encontrado" };

  // Don't allow removing family owner
  if (user.family_id) {
    const family = await Family.findById(user.family_id);
    if (family && family.owner_id.toString() === userId) {
      return { error: "Não é possível remover o dono da família" };
    }
  }

  await User.findByIdAndDelete(userId);
  revalidatePath("/admin/families");
  return { success: true };
}

export async function deleteFamily(familyId: string) {
  await requireSuperAdmin();
  await connectDB();

  // Check if family has data (periods)
  const { Period } = await import("@/lib/db/models/period");
  const periodCount = await Period.countDocuments({ family_id: familyId });

  if (periodCount > 0) {
    return { error: "Não é possível excluir uma família que possui dados. Remova os períodos primeiro." };
  }

  // Remove all members
  await User.updateMany({ family_id: familyId }, { $unset: { family_id: 1, family_role: 1 } });

  // Remove family categories
  await Category.deleteMany({ family_id: familyId });

  // Remove family
  await Family.findByIdAndDelete(familyId);

  revalidatePath("/admin/families");
  return { success: true };
}
