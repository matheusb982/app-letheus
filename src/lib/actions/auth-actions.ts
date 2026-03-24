"use server";

import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { signIn } from "@/lib/auth";
import { registerSchema, loginSchema } from "@/lib/validations/auth";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

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
  _formData: FormData
): Promise<ActionState> {
  return { error: "O cadastro está desabilitado. Solicite ao administrador para criar sua conta." };
}
