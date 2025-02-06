import { NextRequest, NextResponse } from "next/server"
import { bucket } from "@/lib/google-cloud-storage"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"


export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 })
    }

    // Buscar o arquivo e verificar permissões
    const file = await prisma.restaurantFile.findFirst({
      where: {
        id: params.fileId,
        restaurantId: params.id,
        restaurant: {
          userId: session.user.id,
        },
      },
    })

    if (!file) {
      return new NextResponse("Arquivo não encontrado", { status: 404 })
    }

    // Extrair o nome do arquivo da URL
    const filePathMatch = file.url.match(/restaurants\/.*$/)
    if (!filePathMatch) {
      throw new Error("URL do arquivo inválida")
    }

    // Deletar do Google Cloud Storage
    await bucket.file(filePathMatch[0]).delete()

    // Deletar do banco de dados
    await prisma.restaurantFile.delete({
      where: {
        id: file.id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Erro ao deletar arquivo:", error)
    return new NextResponse("Erro interno do servidor", { status: 500 })
  }
} 