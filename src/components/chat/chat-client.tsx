"use client";

import { TextStreamChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Send, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  createChatSession,
  deleteChatSession,
  type SerializedChatSession,
  type SerializedChatMessage,
} from "@/lib/actions/chat-actions";

interface ChatClientProps {
  sessions: SerializedChatSession[];
  currentSessionId: string | null;
  initialMessages: SerializedChatMessage[];
  chatLimit: { used: number; limit: number };
}

const SUGGESTIONS = [
  "Qual foi meu maior gasto este mês?",
  "Como estou em relação às minhas metas?",
  "Qual o percentual de gastos por categoria?",
  "Dê dicas para economizar este mês.",
];

export function ChatClient({
  sessions,
  currentSessionId,
  initialMessages,
  chatLimit,
}: ChatClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: "/api/chat",
        body: { chatSessionId: currentSessionId },
      }),
    [currentSessionId]
  );

  const { messages, sendMessage, status } = useChat({
    transport,
    messages: initialMessages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      parts: [{ type: "text" as const, text: m.content }],
    })),
    onError(error) {
      toast.error(error.message || "Erro ao enviar mensagem");
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleNewSession() {
    startTransition(async () => {
      const id = await createChatSession();
      router.push(`/chat/${id}`);
    });
  }

  async function handleDeleteSession(id: string) {
    if (!confirm("Excluir esta conversa?")) return;
    startTransition(async () => {
      await deleteChatSession(id);
      if (id === currentSessionId) {
        router.push("/chat");
      } else {
        router.refresh();
      }
    });
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.14)-theme(spacing.12))] gap-4">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 space-y-2 overflow-y-auto">
        <Button onClick={handleNewSession} disabled={isPending} className="w-full" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nova Conversa
        </Button>
        <Separator />
        <div className="space-y-1">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={cn(
                "group flex items-center justify-between rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-accent",
                s.id === currentSessionId && "bg-accent"
              )}
              onClick={() => router.push(`/chat/${s.id}`)}
            >
              <span className="truncate flex-1">{s.title}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSession(s.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        <div className="pt-2 text-xs text-muted-foreground text-center">
          {chatLimit.used}/{chatLimit.limit} perguntas hoje
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        {!currentSessionId ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center space-y-4">
              <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Crie uma conversa para começar.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              {messages.length === 0 && (
                <div className="flex flex-1 items-center justify-center pt-20">
                  <div className="space-y-4 text-center max-w-md">
                    <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Olá! Sou seu assistente financeiro. Pergunte sobre suas finanças.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {SUGGESTIONS.map((s) => (
                        <Button
                          key={s}
                          variant="outline"
                          size="sm"
                          className="h-auto whitespace-normal text-left text-xs"
                          onClick={() => setInput(s)}
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {messages.map((m) => {
                const textContent = m.parts
                  ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
                  .map((p) => p.text)
                  .join("") || "";

                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex",
                      m.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <Card
                      className={cn(
                        "max-w-[80%] px-4 py-3",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{textContent}</p>
                    </Card>
                  </div>
                );
              })}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <Card className="bg-muted px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </Card>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Digite sua pergunta... (Shift+Enter para nova linha)"
                rows={2}
                className="resize-none"
                disabled={isLoading || chatLimit.used >= chatLimit.limit}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim() || chatLimit.used >= chatLimit.limit}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
