"use client";

import { useState, useRef, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  Trash2,
  MessageCircle,
  Bot,
  User,
  Sparkles,
  ArrowUp,
  Lightbulb,
} from "lucide-react";
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

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const POPOVER_SUGGESTIONS: { label: string; items: string[] }[] = [
  {
    label: "Receitas",
    items: [
      "Quanto vai entrar de dinheiro esse mês?",
      "Quais são minhas fontes de renda?",
    ],
  },
  {
    label: "Despesas",
    items: [
      "Quanto gastei esse mês?",
      "Onde estou gastando mais?",
      "Quais minhas maiores despesas?",
      "Quanto gastei com mercado?",
    ],
  },
  {
    label: "Análises",
    items: [
      "Qual meu saldo do mês?",
      "Estou gastando mais do que ganho?",
      "Me dá um resumo financeiro completo",
    ],
  },
  {
    label: "Dicas",
    items: [
      "Como posso economizar?",
      "Onde posso cortar gastos?",
      "Me dá dicas financeiras",
    ],
  },
  {
    label: "Filtros",
    items: [
      "Quanto gastei em janeiro de 2025?",
      "Quanto gastei no débito?",
      "Quanto gastei na categoria educação?",
    ],
  },
];

const SUGGESTIONS = [
  { text: "Qual foi meu maior gasto este mês?", icon: "📊" },
  { text: "Como estou em relação às minhas metas?", icon: "🎯" },
  { text: "Qual o percentual de gastos por categoria?", icon: "📈" },
  { text: "Dê dicas para economizar este mês.", icon: "💡" },
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

let msgCounter = 0;
function genId() {
  return `msg-${Date.now()}-${++msgCounter}`;
}

export function ChatClient({
  sessions,
  currentSessionId,
  initialMessages,
  chatLimit,
}: ChatClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>(
    initialMessages.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content }))
  );
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isAtLimit = chatLimit.used >= chatLimit.limit;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset messages when session changes
  useEffect(() => {
    setMessages(
      initialMessages.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content }))
    );
  }, [initialMessages]);

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

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || isAtLimit) return;

    const userMsg: ChatMsg = { id: genId(), role: "user", content: text };
    const assistantMsg: ChatMsg = { id: genId(), role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: text }],
          chatSessionId: currentSessionId,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Erro ${res.status}`);
      }

      // Add empty assistant message
      setMessages((prev) => [...prev, assistantMsg]);

      // Stream the response
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        const captured = fullText;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: captured } : m))
        );
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error(err instanceof Error ? err.message : "Erro ao enviar mensagem");
      // Remove the empty assistant message on error
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [isLoading, isAtLimit, currentSessionId]);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || isLoading || isAtLimit) return;
    const text = input;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    sendMessage(text);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.14)-theme(spacing.12))]">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r bg-muted/30 flex flex-col">
        <div className="p-3">
          <Button onClick={handleNewSession} disabled={isPending} className="w-full gap-2" size="sm">
            <Plus className="h-4 w-4" />
            Nova Conversa
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-colors",
                s.id === currentSessionId
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
              onClick={() => router.push(`/chat/${s.id}`)}
            >
              <MessageCircle className="h-4 w-4 flex-shrink-0" />
              <span className="truncate flex-1">{s.title}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity"
                onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">Nenhuma conversa ainda</p>
          )}
        </div>
        <div className="p-3 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Perguntas hoje</span>
            <Badge variant={isAtLimit ? "destructive" : "secondary"} className="text-xs font-mono">
              {chatLimit.used}/{chatLimit.limit}
            </Badge>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        {!currentSessionId ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center space-y-6 max-w-sm">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Assistente Financeiro</h2>
                <p className="text-muted-foreground text-sm">
                  Crie uma conversa para perguntar sobre suas finanças, metas e despesas.
                </p>
              </div>
              <Button onClick={handleNewSession} disabled={isPending} className="gap-2">
                <Plus className="h-4 w-4" />
                Começar Conversa
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex flex-1 items-center justify-center h-full">
                  <div className="space-y-8 text-center max-w-lg px-4">
                    <div className="space-y-3">
                      <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Bot className="h-7 w-7 text-primary" />
                      </div>
                      <h2 className="text-lg font-semibold">Como posso ajudar?</h2>
                      <p className="text-muted-foreground text-sm">
                        Pergunte sobre seus gastos, metas, patrimônio ou peça dicas financeiras.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s.text}
                          className="flex items-start gap-3 rounded-xl border bg-card p-4 text-left text-sm transition-colors hover:bg-accent hover:border-primary/20 group"
                          onClick={() => setInput(s.text)}
                        >
                          <span className="text-lg">{s.icon}</span>
                          <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                            {s.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                  {messages.map((m) => (
                    <div key={m.id} className="flex gap-3 items-start">
                      <div
                        className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                          m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted border"
                        )}
                      >
                        {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          {m.role === "user" ? "Você" : "Assistente"}
                        </p>
                        {m.role === "user" ? (
                          <p className="text-sm leading-relaxed">{m.content}</p>
                        ) : m.content ? (
                          <div className="text-sm leading-relaxed prose prose-sm prose-neutral dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-2 [&>ol]:my-2 [&>li]:my-0.5">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <TypingIndicator />
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="border-t bg-background p-4">
              <div className="max-w-3xl mx-auto">
                <form
                  onSubmit={handleSubmit}
                  className="relative flex items-end rounded-2xl border bg-muted/50 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background transition-shadow"
                >
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute left-1 bottom-1.5 h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
                      >
                        <Lightbulb className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" className="w-80 p-2 max-h-80 overflow-y-auto">
                      {POPOVER_SUGGESTIONS.map((group) => (
                        <div key={group.label}>
                          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                            {group.label}
                          </p>
                          <div className="space-y-0.5 mb-1">
                            {group.items.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent transition-colors"
                                onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </PopoverContent>
                  </Popover>
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleTextareaChange}
                    onKeyDown={onKeyDown}
                    placeholder={isAtLimit ? "Limite diário atingido" : "Pergunte sobre suas finanças..."}
                    rows={1}
                    className="min-h-[44px] max-h-[150px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pl-10 pr-12"
                    disabled={isLoading || isAtLimit}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="absolute right-2 bottom-2 h-8 w-8 rounded-lg"
                    disabled={isLoading || !input.trim() || isAtLimit}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </form>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  Shift+Enter para nova linha
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
