"use server";

import { connectDB } from "@/lib/db/connection";
import { auth } from "@/lib/auth";
import { User } from "@/lib/db/models/user";
import { Family, type SubscriptionStatus } from "@/lib/db/models/family";
import { ADMIN_EMAIL } from "@/lib/utils/constants";

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  isActive: boolean;
  trialEndsAt: Date | null;
  daysRemaining: number | null;
}

/**
 * Check subscription status for the current user's family.
 */
export async function getSubscriptionInfo(): Promise<SubscriptionInfo> {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.family_id) throw new Error("Usuário ou família não encontrado");

  const family = await Family.findById(user.family_id);
  if (!family) throw new Error("Família não encontrada");

  const now = new Date();
  const trialEndsAt = family.trial_ends_at ?? null;
  let status: SubscriptionStatus = family.subscription_status ?? "trialing";

  // Auto-expire trial if past end date
  if (status === "trialing" && trialEndsAt && now > trialEndsAt) {
    status = "expired";
    await Family.updateOne({ _id: family._id }, { subscription_status: "expired" });
  }

  const isActive = status === "trialing" || status === "active";

  let daysRemaining: number | null = null;
  if (status === "trialing" && trialEndsAt) {
    daysRemaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  return { status, isActive, trialEndsAt, daysRemaining };
}

/**
 * Guard for server actions that require an active subscription.
 * Admin is never blocked.
 */
export async function requireActiveSubscription(): Promise<void> {
  const session = await auth();
  if (session?.user?.email === ADMIN_EMAIL) return;

  const info = await getSubscriptionInfo();
  if (!info.isActive) {
    throw new Error("Seu período de teste expirou. Assine para continuar usando todas as funcionalidades.");
  }
}
