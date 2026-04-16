"use server";

import { randomBytes } from "crypto";
import { connectDB } from "@/lib/db/connection";
import { auth } from "@/lib/auth";
import { WhatsAppLink, type IWhatsAppLink } from "@/lib/db/models/whatsapp-link";
import { WhatsAppSession } from "@/lib/db/models/whatsapp-session";
import { getUserFamilyId } from "@/lib/actions/family-helpers";

/**
 * Get WhatsApp link status for the current user.
 */
export async function getWhatsAppLinkStatus(): Promise<{
  linked: boolean;
  phoneNumber?: string;
  verified: boolean;
  linkToken?: string;
}> {
  const session = await auth();
  if (!session) throw new Error("Nao autorizado");

  await connectDB();

  const link = await WhatsAppLink.findOne<IWhatsAppLink>({ user_id: session.user.id });

  if (!link) {
    return { linked: false, verified: false };
  }

  return {
    linked: true,
    phoneNumber: link.phone_number,
    verified: link.verified,
    linkToken: link.verified ? undefined : link.link_token,
  };
}

/**
 * Initiate WhatsApp linking.
 * Generates a token that the user will send via WhatsApp to verify.
 */
export async function linkWhatsApp(
  phoneNumber: string
): Promise<{ success: boolean; error?: string; token?: string }> {
  const session = await auth();
  if (!session) return { success: false, error: "Nao autorizado" };

  // Validate phone number (E.164 format)
  const cleaned = phoneNumber.replace(/\D/g, "");
  if (cleaned.length < 10 || cleaned.length > 15) {
    return { success: false, error: "Numero de telefone invalido" };
  }
  const e164 = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;

  await connectDB();
  const familyId = await getUserFamilyId();

  // Check if phone is already linked to another user
  const existing = await WhatsAppLink.findOne<IWhatsAppLink>({
    phone_number: e164,
    user_id: { $ne: session.user.id },
    verified: true,
  });

  if (existing) {
    return { success: false, error: "Este numero ja esta vinculado a outra conta" };
  }

  const token = randomBytes(3).toString("hex").toUpperCase(); // 6 char code
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await WhatsAppLink.findOneAndUpdate(
    { user_id: session.user.id },
    {
      phone_number: e164,
      family_id: familyId,
      verified: false,
      link_token: token,
      link_token_expires_at: expiresAt,
    },
    { upsert: true }
  );

  return { success: true, token };
}

/**
 * Verify WhatsApp link using a token sent via WhatsApp.
 * Called from the webhook when an unverified user sends the token.
 */
export async function verifyWhatsAppToken(
  phoneNumber: string,
  token: string
): Promise<boolean> {
  await connectDB();

  const link = await WhatsAppLink.findOne<IWhatsAppLink>({
    phone_number: phoneNumber,
    link_token: token.toUpperCase().trim(),
    link_token_expires_at: { $gt: new Date() },
  });

  if (!link) return false;

  await WhatsAppLink.updateOne(
    { _id: link._id },
    {
      verified: true,
      $unset: { link_token: 1, link_token_expires_at: 1 },
    }
  );

  return true;
}

/**
 * Unlink WhatsApp from the current user's account.
 */
export async function unlinkWhatsApp(): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session) return { success: false, error: "Nao autorizado" };

  await connectDB();

  const link = await WhatsAppLink.findOne<IWhatsAppLink>({ user_id: session.user.id });
  if (!link) return { success: false, error: "WhatsApp nao vinculado" };

  // Remove link and session
  await WhatsAppLink.deleteOne({ _id: link._id });
  await WhatsAppSession.deleteOne({ phone_number: link.phone_number });

  return { success: true };
}
