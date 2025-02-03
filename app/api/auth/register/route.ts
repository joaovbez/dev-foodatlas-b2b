import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { Resend } from "resend"
import { emailVerificationTemplate } from "@/lib/email-templates"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return new NextResponse("Dados inválidos", { status: 400 })
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return new NextResponse("Email já cadastrado", { status: 400 })
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Gerar código de verificação
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const codeExpiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        verificationCode,
        codeExpiresAt,
      }
    })

    // Enviar email de verificação
    try {
      await resend.emails.send({
        from: "FoodAtlas <noreply@foodatlas.org>",
        to: email,
        subject: "Verifique seu email - FoodAtlas",
        html: emailVerificationTemplate({
          code: verificationCode,
        }),
      })
    } catch (emailError) {
      console.error("Erro ao enviar email:", emailError)
      // Continua mesmo se falhar o envio do email
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    })
  } catch (error) {
    console.error("Erro ao registrar usuário:", error)
    return new NextResponse("Erro ao criar conta", { status: 500 })
  }
} 