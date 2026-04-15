import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { WhatsAppLink, type IWhatsAppLink } from "@/lib/db/models/whatsapp-link";
import { WhatsAppSession, type IWhatsAppSession } from "@/lib/db/models/whatsapp-session";
import { User } from "@/lib/db/models/user";
import { Family } from "@/lib/db/models/family";
import {
  verifyWebhookSignature,
  parseWebhookMessage,
  sendTextMessage,
  sendInteractiveButtons,
  markAsRead,
} from "@/lib/services/whatsapp-client";
import { classifyIntent, type MessageIntent } from "@/lib/services/whatsapp-router";
import { parseExpense, saveExpense } from "@/lib/services/whatsapp-expense";
import { generateChatResponse } from "@/lib/services/chat-service";
import { checkRateLimit } from "@/lib/services/rate-limiter";
import { verifyWhatsAppToken } from "@/lib/actions/whatsapp-actions";

// Track processed message IDs to avoid duplicates (in-memory, resets on deploy)
const processedMessages = new Set<string>();

/**
 * GET — Meta webhook verification handshake.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

/**
 * POST — Receive incoming WhatsApp messages.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();

  // Verify webhook signature
  const signature = req.headers.get("x-hub-signature-256") ?? "";
  if (!(await verifyWebhookSignature(rawBody, signature))) {
    return new Response("Invalid signature", { status: 403 });
  }

  // Parse the payload
  const body = JSON.parse(rawBody);
  const message = parseWebhookMessage(body);

  // Always return 200 quickly to Meta (they retry on non-200)
  if (!message || message.type === "unknown") {
    return NextResponse.json({ status: "ok" });
  }

  // Idempotency: skip already-processed messages
  if (processedMessages.has(message.messageId)) {
    return NextResponse.json({ status: "ok" });
  }
  processedMessages.add(message.messageId);

  // Cleanup old message IDs (keep last 1000)
  if (processedMessages.size > 1000) {
    const ids = [...processedMessages];
    for (let i = 0; i < ids.length - 1000; i++) {
      processedMessages.delete(ids[i]);
    }
  }

  // Process message asynchronously (don't block the 200 response)
  processMessage(message).catch((err) =>
    console.error("[WhatsApp] Error processing message:", err)
  );

  return NextResponse.json({ status: "ok" });
}

async function processMessage(message: ReturnType<typeof parseWebhookMessage> & object) {
  const { from, messageId } = message;

  // Mark as read
  await markAsRead(messageId).catch(() => {});

  await connectDB();

  // Rate limit: 50 messages/hour per phone
  const { allowed } = checkRateLimit(`whatsapp:${from}`, 50, 60 * 60 * 1000);
  if (!allowed) {
    await sendTextMessage(from, "Voce enviou muitas mensagens. Tente novamente em alguns minutos.");
    return;
  }

  // Find linked account
  const link = await WhatsAppLink.findOne<IWhatsAppLink>({
    phone_number: from,
    verified: true,
  });

  if (!link) {
    // Check if this is a token verification attempt
    const msgText = message.text?.trim() ?? "";
    if (/^[A-F0-9]{6}$/i.test(msgText)) {
      // Try to verify the token for any pending link with this phone
      const verified = await verifyWhatsAppToken(from, msgText);
      if (verified) {
        await sendTextMessage(from, "WhatsApp vinculado com sucesso! Agora voce pode registrar gastos e fazer perguntas sobre suas financas.");
        return;
      }
    }

    await sendTextMessage(
      from,
      "Seu numero ainda nao esta vinculado. Acesse o app e va em Configuracoes > Vincular WhatsApp para conectar sua conta."
    );
    return;
  }

  // Verify subscription is active
  const family = await Family.findById(link.family_id);
  if (!family) {
    await sendTextMessage(from, "Familia nao encontrada. Verifique sua conta no app.");
    return;
  }

  const status = family.subscription_status ?? "trialing";
  const trialEndsAt = family.trial_ends_at;
  const isExpired =
    status === "expired" ||
    status === "canceled" ||
    (status === "trialing" && trialEndsAt && new Date() > trialEndsAt);

  if (isExpired) {
    await sendTextMessage(from, "Seu periodo de teste expirou. Assine o plano no app para continuar usando.");
    return;
  }

  // Get or create session
  const session = await WhatsAppSession.findOneAndUpdate<IWhatsAppSession>(
    { phone_number: from },
    {
      $set: { last_activity: new Date() },
      $setOnInsert: {
        user_id: link.user_id,
        family_id: link.family_id,
        mode: "idle",
      },
    },
    { upsert: true, new: true }
  );

  const text = message.text ?? "";
  const buttonReplyId = message.type === "interactive" ? message.buttonReplyId : undefined;

  // Handle pending expense confirmation
  if (session.pending_expense) {
    await handlePendingConfirmation(session, from, text, buttonReplyId);
    return;
  }

  // Classify intent
  const intent: MessageIntent = buttonReplyId
    ? (buttonReplyId.startsWith("confirm_yes") ? "confirm_yes" : "confirm_no")
    : await classifyIntent(text);

  switch (intent) {
    case "expense_add":
      await handleExpenseAdd(session, from, text);
      break;

    case "financial_question":
      await handleFinancialQuestion(session, from, text);
      break;

    case "greeting":
      await sendTextMessage(
        from,
        "Oi! Sou seu assistente financeiro. Voce pode:\n\n" +
        "- Registrar gastos: \"Cafe R$15,00\"\n" +
        "- Fazer perguntas: \"Quanto gastei esse mes?\"\n\n" +
        "Como posso ajudar?"
      );
      break;

    case "help":
      await sendTextMessage(
        from,
        "*Como usar o Letheus no WhatsApp:*\n\n" +
        "Registrar gasto:\n" +
        "  Cafe R$15,00\n" +
        "  Almoco 45 reais\n" +
        "  Uber 22,50\n\n" +
        "Perguntar sobre financas:\n" +
        "  Quanto gastei esse mes?\n" +
        "  Qual meu saldo?\n" +
        "  Como estao minhas metas?"
      );
      break;

    default:
      await sendTextMessage(
        from,
        "Nao entendi. Voce pode registrar um gasto (ex: \"Cafe R$15\") ou fazer uma pergunta sobre suas financas. Digite *ajuda* para mais info."
      );
  }
}

async function handleExpenseAdd(
  session: IWhatsAppSession,
  from: string,
  text: string
) {
  const user = await User.findById(session.user_id);
  const expense = await parseExpense(
    text,
    session.user_id.toString(),
    session.family_id,
    user?.period_id
  );

  if (!expense) {
    await sendTextMessage(from, "Nao consegui entender o gasto. Tente no formato: \"Cafe R$15,00\"");
    return;
  }

  // Save pending expense and ask for confirmation
  await WhatsAppSession.updateOne(
    { _id: session._id },
    {
      pending_expense: expense,
      mode: "expense",
    }
  );

  await sendInteractiveButtons(
    from,
    `${expense.description} - R$ ${expense.value.toFixed(2)}\nCategoria: ${expense.subcategory_name}\n\nConfirma?`,
    [
      { id: "confirm_yes", title: "Sim, salvar" },
      { id: "confirm_no", title: "Cancelar" },
    ]
  );
}

async function handlePendingConfirmation(
  session: IWhatsAppSession,
  from: string,
  text: string,
  buttonReplyId?: string
) {
  const isYes = buttonReplyId === "confirm_yes" ||
    /^s(im)?$/i.test(text.trim()) ||
    /^ok$/i.test(text.trim());

  const isNo = buttonReplyId === "confirm_no" ||
    /^n(ao|ão)?$/i.test(text.trim()) ||
    /^cancela/i.test(text.trim());

  if (isYes && session.pending_expense) {
    const user = await User.findById(session.user_id);
    const result = await saveExpense(
      session.pending_expense,
      session.user_id.toString(),
      session.family_id,
      user?.period_id
    );

    // Clear pending state
    await WhatsAppSession.updateOne(
      { _id: session._id },
      { $unset: { pending_expense: 1 }, mode: "idle" }
    );

    if (result.success) {
      await sendTextMessage(from, `Salvo! ${result.message}`);
    } else {
      await sendTextMessage(from, result.message);
    }
  } else if (isNo) {
    await WhatsAppSession.updateOne(
      { _id: session._id },
      { $unset: { pending_expense: 1 }, mode: "idle" }
    );
    await sendTextMessage(from, "Cancelado. Envie o gasto novamente se quiser corrigir.");
  } else {
    // User sent something else while confirmation is pending
    await sendInteractiveButtons(
      from,
      `Voce tem um gasto pendente:\n${session.pending_expense!.description} - R$ ${session.pending_expense!.value.toFixed(2)}\n\nDeseja salvar?`,
      [
        { id: "confirm_yes", title: "Sim, salvar" },
        { id: "confirm_no", title: "Cancelar" },
      ]
    );
  }
}

async function handleFinancialQuestion(
  session: IWhatsAppSession,
  from: string,
  text: string
) {
  try {
    const response = await generateChatResponse(
      session.user_id.toString(),
      session.family_id,
      text
    );

    await sendTextMessage(from, response);
  } catch (error) {
    console.error("[WhatsApp] Chat error:", error);
    await sendTextMessage(from, "Erro ao processar sua pergunta. Tente novamente.");
  }
}
