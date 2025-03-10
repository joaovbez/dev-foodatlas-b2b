import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendResetPasswordEmailParams {
  to: string
  name: string
  resetUrl: string
}

export async function sendResetPasswordEmail({
  to,
  name,
  resetUrl,
}: SendResetPasswordEmailParams) {
  await resend.emails.send({
    from: "FoodAtlas <noreply@foodatlas.org>",
    to,
    subject: "Recuperação de Senha - FoodAtlas",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Recuperação de Senha</h1>
        <p style="color: #666; text-align: center;">
          Olá ${name},
        </p>
        <p style="color: #666; text-align: center;">
          Clique no botão abaixo para redefinir sua senha:
        </p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetUrl}" 
             style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Redefinir Senha
          </a>
        </div>
        <p style="color: #666; text-align: center;">
          Este link expira em 1 hora.
        </p>
        <p style="color: #666; text-align: center; font-size: 12px;">
          Se você não solicitou esta recuperação de senha, ignore este email.
        </p>
      </div>
    `,
  })
} 