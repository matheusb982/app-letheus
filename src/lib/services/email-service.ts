import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@letheus.com.br";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
  userName: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password/${token}`;

  const { error } = await resend.emails.send({
    from: `Letheus <${fromEmail}>`,
    to,
    subject: "Recuperação de senha - Letheus",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a;">Recuperação de Senha</h2>
        <p>Olá${userName ? `, ${escapeHtml(userName)}` : ""},</p>
        <p>Recebemos uma solicitação para redefinir sua senha no Letheus.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #171717; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            Redefinir minha senha
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Este link expira em 1 hora. Se você não solicitou a redefinição, ignore este email.
        </p>
        <p style="color: #666; font-size: 14px;">
          Se o botão não funcionar, copie e cole este link no seu navegador:<br/>
          <a href="${resetUrl}" style="color: #666;">${resetUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">Letheus - Gestão Financeira Pessoal</p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send password reset email:", error);
    throw new Error("Falha ao enviar email de recuperação");
  }
}

export async function sendTrialExpiringEmail(
  to: string,
  userName: string,
  daysRemaining: number
) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const { error } = await resend.emails.send({
    from: `Letheus <${fromEmail}>`,
    to,
    subject: `Seu período de teste termina em ${daysRemaining} dia${daysRemaining > 1 ? "s" : ""} - Letheus`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a;">Seu período de teste está acabando</h2>
        <p>Olá${userName ? `, ${escapeHtml(userName)}` : ""},</p>
        <p>Seu período de teste no Letheus termina em <strong>${daysRemaining} dia${daysRemaining > 1 ? "s" : ""}</strong>.</p>
        <p>Para continuar usando todas as funcionalidades, assine um plano antes do término.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/dashboard"
             style="background-color: #171717; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            Acessar Letheus
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Após o término do teste, seus dados serão mantidos mas o acesso será limitado.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">Letheus - Gestão Financeira Pessoal</p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send trial expiring email:", error);
    throw new Error("Falha ao enviar email de aviso de trial");
  }
}
