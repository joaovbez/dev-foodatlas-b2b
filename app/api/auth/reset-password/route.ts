import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return new NextResponse("Token e senha são obrigatórios", { status: 400 })
    }

    console.log("Verificando token:", token) // Debug

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    })

    console.log("Usuário encontrado:", user ? "Sim" : "Não") // Debug

    if (!user) {
      return new NextResponse("Token inválido ou expirado", { status: 400 })
    }

    const hashedPassword = await hash(password, 12)

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    return new NextResponse("Senha alterada com sucesso", { status: 200 })
  } catch (error) {
    console.error("[RESET_PASSWORD_ERROR]", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Erro interno do servidor", 
      { status: 500 }
    )
  }
} 