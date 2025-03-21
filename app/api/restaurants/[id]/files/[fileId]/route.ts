import { NextRequest, NextResponse } from "next/server"
import { bucket } from "@/lib/google-cloud-storage"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import {deleteFileEmbeddings } from "@/lib/services/big-query-operations"

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
    // Verificar quanto tempo passou desde o upload do arquivo
    const fileCreatedAt = new Date(file.createdAt);
    const currentTime = new Date();
    const timeDifferenceMs = currentTime.getTime() - fileCreatedAt.getTime();
    const timeDifferenceMinutes = Math.floor(timeDifferenceMs / (1000 * 60));
    
    // Se passaram menos de 90 minutos, não permitir a exclusão
    if (timeDifferenceMinutes < 90) {
      console.error("Não é possível excluir o arquivo antes de 90 minutos após o upload")
      return new NextResponse( "Não é possível excluir o arquivo antes de 90 minutos após o upload", { status: 403 });
    }
    // Deletar do banco de dados
    await prisma.restaurantFile.delete({
      where: {
        id: file.id,
      },
    });

    // Retornar resposta de sucesso
    const response = new NextResponse(null, { status: 204 });

    // Deletar embeddings do BigQuery em background
    deleteFileEmbeddings(file.id, file.restaurantId)
      .then(() => console.log("embeddings deletados"))
      .catch(error => console.error("Erro ao deletar embeddings:", error));

    // Deletar do Google Cloud Storage em background
    bucket.file(filePathMatch[0]).delete()
      .then(() => console.log("Arquivo deletado do Google Cloud Storage"))
      .catch(error => console.error("Erro ao deletar arquivo do Google Cloud Storage:", error));

    return response;
  } catch (error) {
    console.error("Erro ao deletar arquivo:", error)
    return new NextResponse("Erro interno do servidor", { status: 500 })
  }
} 