import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return new NextResponse("Email e código são obrigatórios", { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.verificationCode) {
      return new NextResponse("Usuário não encontrado ou código não solicitado", { status: 400 })
    }

    if (user.verificationCode !== code) {
      return new NextResponse("Código inválido", { status: 400 })
    }

    // Verificar se o código expirou
    if (user.codeExpiresAt && user.codeExpiresAt < new Date()) {
      // Limpar o código expirado
      await prisma.user.update({
        where: { email },
        data: {
          verificationCode: null,
          codeExpiresAt: null
        }
      })
      return new NextResponse("Código expirado. Por favor, solicite um novo código.", { status: 400 })
    }

    // Marcar email como verificado
    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
        verificationCode: null,
        codeExpiresAt: null
      }
    })

    return NextResponse.json({ message: "Email verificado com sucesso" })
  } catch (error) {
    console.error("Erro ao verificar código:", error)
    return new NextResponse("Erro ao verificar código", { status: 500 })
  }
}
