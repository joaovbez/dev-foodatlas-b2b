import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { hash, compare } from "bcryptjs"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email!,
      },
      select: {
        name: true,
        email: true,
      },
    })

    if (!user) {
      return new NextResponse("Usuário não encontrado", { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Erro ao buscar dados do usuário:", error)
    return new NextResponse("Erro interno do servidor", { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, email, password, confirmPassword } = body

    // Buscar usuário atual
    const currentUser = await prisma.user.findUnique({
      where: {
        email: session.user.email!,
      },
    })

    if (!currentUser) {
      return new NextResponse("Usuário não encontrado", { status: 404 })
    }

    // Verificar senha atual
    const isPasswordValid = await compare(password, currentUser.password!)
    if (!isPasswordValid) {
      return new NextResponse("Senha atual incorreta", { status: 400 })
    }

    // Preparar dados para atualização
    const updateData: any = {
      name: name.trim(),
    }

    // Se o email for diferente, verificar se já está em uso
    if (email !== currentUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: {
          email: email.trim(),
        },
      })

      if (emailExists) {
        return new NextResponse("Email já está em uso", { status: 400 })
      }

      updateData.email = email.trim()
    }

    // Se uma nova senha foi fornecida, fazer o hash
    if (confirmPassword) {
      updateData.password = await hash(confirmPassword, 12)
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: updateData,
      select: {
        name: true,
        email: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Erro interno do servidor",
      { status: 500 }
    )
  }
}