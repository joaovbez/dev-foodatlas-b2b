import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { Resend } from "resend"
import { emailVerificationTemplate } from "@/lib/email-templates"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return new NextResponse("Email é obrigatório", { status: 400 })
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return new NextResponse("Usuário não encontrado", { status: 404 })
    }

    // Gerar código de verificação de 6 dígitos
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Definir data de expiração (30 minutos)
    const codeExpiresAt = new Date(Date.now() + 30 * 60 * 1000)

    // Atualizar usuário com o novo código
    await prisma.user.update({
      where: { email },
      data: {
        verificationCode,
        codeExpiresAt,
      },
    })

    try {
      // Enviar email com o código
      const emailResult = await resend.emails.send({
        from: "FoodAtlas <noreply@foodatlas.com.br>",
        to: email,
        subject: "Verifique seu email - FoodAtlas",
        html: emailVerificationTemplate({
          code: verificationCode,
        }),
      })

      console.log('Email enviado:', emailResult)
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError)
      return new NextResponse("Erro ao enviar email de verificação", { status: 500 })
    }

    return NextResponse.json({ message: "Código de verificação enviado" })
  } catch (error) {
    console.error("Erro ao enviar código de verificação:", error)
    return new NextResponse("Erro ao enviar código de verificação", { status: 500 })
  }
}
