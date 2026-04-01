"use server";

import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { Family } from "@/lib/db/models/family";
import { Category, type ICategory } from "@/lib/db/models/category";

export type ActionState = {
  error?: string;
  success?: boolean;
};

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou senha inválidos" };
    }
    throw error;
  }

  redirect("/dashboard");
}

export async function registerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const termsAccepted = formData.get("terms") === "on";
  if (!termsAccepted) {
    return { error: "Você precisa aceitar os Termos de Uso e Política de Privacidade" };
  }

  const raw = {
    fullname: formData.get("fullname") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await connectDB();

  const existingUser = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (existingUser) {
    return { error: "Email já cadastrado" };
  }

  // Create user
  const encrypted_password = await bcrypt.hash(parsed.data.password, 12);
  const user = await User.create({
    email: parsed.data.email.toLowerCase(),
    fullname: parsed.data.fullname,
    encrypted_password,
    family_role: "admin",
    onboarding_completed: false,
    terms_accepted_at: new Date(),
  });

  // Create family (user's first name as family name)
  const familyName = parsed.data.fullname.split(" ")[0] || "Minha Família";
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 7);

  const family = await Family.create({
    name: `Família ${familyName}`,
    owner_id: user._id,
    subscription_status: "trialing",
    trial_ends_at: trialEndsAt,
  });

  // Link user to family
  await User.findByIdAndUpdate(user._id, { family_id: family._id });

  // Clone global category templates
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

  // Auto-login
  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Conta criada, mas falha no login automático. Faça login manualmente." };
    }
    throw error;
  }

  redirect("/onboarding");
}
