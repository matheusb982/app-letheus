"use server";

import { connectDB } from "@/lib/db/connection";
import { auth } from "@/lib/auth";
import { ChatSession } from "@/lib/db/models/chat-session";
import { ChatMessage, type IChatMessage } from "@/lib/db/models/chat-message";
import { revalidatePath } from "next/cache";
import { DAILY_CHAT_LIMIT } from "@/lib/utils/constants";

export interface SerializedChatSession {
  id: string;
  title: string;
  updated_at: string;
}

export interface SerializedChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  created_at: string;
}

export async function getChatSessions(): Promise<SerializedChatSession[]> {
  const session = await auth();
  if (!session) return [];

  await connectDB();
  const sessions = await ChatSession.find({ user_id: session.user.id })
    .sort({ updated_at: -1 })
    .lean();

  return sessions.map((s: Record<string, unknown>) => ({
    id: String(s._id),
    title: String(s.title ?? ""),
    updated_at: s.updated_at
      ? new Date(s.updated_at as string).toISOString()
      : new Date(s.created_at as string).toISOString(),
  }));
}

export async function getChatMessages(sessionId: string): Promise<SerializedChatMessage[]> {
  await connectDB();
  const messages = await ChatMessage.find({ chat_session_id: sessionId })
    .sort({ created_at: 1 })
    .lean<IChatMessage[]>();

  return messages.map((m) => ({
    id: m._id.toString(),
    content: m.content,
    role: m.role,
    created_at: m.created_at.toISOString(),
  }));
}

export async function createChatSession(): Promise<string> {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");

  await connectDB();
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const chatSession = await ChatSession.create({
    title: `Nova conversa ${dateStr} ${timeStr}`,
    user_id: session.user.id,
  });

  revalidatePath("/chat");
  return chatSession._id.toString();
}

export async function deleteChatSession(sessionId: string) {
  await connectDB();
  await ChatMessage.deleteMany({ chat_session_id: sessionId });
  await ChatSession.findByIdAndDelete(sessionId);
  revalidatePath("/chat");
}

export async function getDailyRequestsCount(): Promise<number> {
  const session = await auth();
  if (!session) return 0;

  await connectDB();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return ChatMessage.countDocuments({
    user_id: session.user.id,
    role: "user",
    created_at: { $gte: todayStart },
  });
}

export async function getChatLimit(): Promise<{ used: number; limit: number }> {
  const used = await getDailyRequestsCount();
  return { used, limit: DAILY_CHAT_LIMIT };
}
