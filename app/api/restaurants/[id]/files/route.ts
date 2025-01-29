import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = searchParams.get("limit")
    const page = searchParams.get("page") || "1"
    const pageSize = limit ? parseInt(limit) : 20

    const files = await prisma.restaurantFile.findMany({
      where: {
        restaurantId: params.id,
        restaurant: {
          userId: session.user.id
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: pageSize,
      skip: (parseInt(page) - 1) * pageSize
    })

    return NextResponse.json(files)
  } catch (error) {
    console.error("Erro ao listar arquivos:", error)
    return new NextResponse("Erro interno", { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return new NextResponse("Arquivo não fornecido", { status: 400 })
    }

    // Aqui você implementaria a lógica de upload do arquivo
    // usando seu serviço de armazenamento preferido (S3, etc)

    const fileRecord = await prisma.restaurantFile.create({
      data: {
        name: file.name,
        size: file.size,
        type: file.type,
        restaurantId: params.id,
        // url: URL do arquivo após upload
      }
    })

    return NextResponse.json(fileRecord)
  } catch (error) {
    console.error("Erro ao fazer upload:", error)
    return new NextResponse("Erro interno", { status: 500 })
  }
} 