import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { Resend } from "resend"
import crypto from "crypto"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return new NextResponse("Email é obrigatório", { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Por segurança, não informamos se o usuário existe ou não
      return NextResponse.json({ message: "Se o email existir, você receberá as instruções de recuperação." })
    }

    // Gerar token único
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Salvar token no banco
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    })

    // URL de reset
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL
    const resetUrl = new URL("/reset-password", baseUrl)
    resetUrl.searchParams.set("token", resetToken)

    // Enviar email
    await resend.emails.send({
      from: "FoodAtlas <noreply@foodatlas.org>",
      to: email,
      subject: "Recuperação de Senha - FoodAtlas",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Recuperação de Senha</h1>
          <p style="color: #666; text-align: center;">
            Olá ${user.name},
          </p>
          <p style="color: #666; text-align: center;">
            Clique no botão abaixo para redefinir sua senha:
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl.toString()}" 
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

    return NextResponse.json({ message: "Se o email existir, você receberá as instruções de recuperação." })
  } catch (error) {
    console.error("[FORGOT_PASSWORD_ERROR]", error)
    return new NextResponse("Erro interno do servidor", { status: 500 })
  }
} 