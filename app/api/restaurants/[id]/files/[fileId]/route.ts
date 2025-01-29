import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 })
    }

    // Verificar se o arquivo pertence ao restaurante do usuário
    const file = await prisma.restaurantFile.findFirst({
      where: {
        id: params.fileId,
        restaurant: {
          id: params.id,
          userId: session.user.id,
        },
      },
    })

    if (!file) {
      return new NextResponse("Arquivo não encontrado", { status: 404 })
    }

    // Aqui você implementaria a lógica para excluir o arquivo do seu serviço de armazenamento

    // Excluir o registro do banco de dados
    await prisma.restaurantFile.delete({
      where: {
        id: params.fileId,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Erro ao excluir arquivo:", error)
    return new NextResponse("Erro interno", { status: 500 })
  }
} 