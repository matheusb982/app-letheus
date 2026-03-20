import { redirect } from "next/navigation";
import { getChatSessions, getChatMessages, getChatLimit } from "@/lib/actions/chat-actions";
import { ChatClient } from "@/components/chat/chat-client";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id?: string[] }>;
}) {
  const { id } = await params;
  const sessionId = id?.[0];

  const [sessions, chatLimit] = await Promise.all([
    getChatSessions(),
    getChatLimit(),
  ]);

  // If no session selected and sessions exist, redirect to most recent
  if (!sessionId && sessions.length > 0) {
    redirect(`/chat/${sessions[0].id}`);
  }

  const messages = sessionId ? await getChatMessages(sessionId) : [];

  return (
    <ChatClient
      sessions={sessions}
      currentSessionId={sessionId ?? null}
      initialMessages={messages}
      chatLimit={chatLimit}
    />
  );
}
