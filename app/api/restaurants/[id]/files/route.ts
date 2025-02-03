import { NextRequest, NextResponse } from "next/server"
import { bucket } from "@/lib/google-cloud-storage"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { v4 as uuidv4 } from 'uuid'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 })
    }

    // Verificar se o restaurante pertence ao usuário
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!restaurant) {
      return new NextResponse("Restaurante não encontrado", { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return new NextResponse("Nenhum arquivo enviado", { status: 400 })
    }

    // Gerar nome único para o arquivo
    const fileName = `${uuidv4()}-${file.name}`
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Upload para o Google Cloud Storage
    const blob = bucket.file(`restaurants/${restaurant.id}/${fileName}`)
    const blobStream = blob.createWriteStream({
      resumable: false,
      gzip: true,
    })

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        reject(new NextResponse("Erro ao fazer upload do arquivo", { status: 500 }))
      })

      blobStream.on('finish', async () => {
        // Tornar o arquivo público
        await blob.makePublic()

        // Salvar referência no banco de dados
        const fileRecord = await prisma.RestaurantFile.create({
          data: {
            name: file.name,
            size: file.size,
            type: file.type,
            url: `https://storage.googleapis.com/${bucket.name}/${blob.name}`,
            restaurantId: restaurant.id,
          },
        })

        resolve(NextResponse.json(fileRecord))
      })

      blobStream.end(fileBuffer)
    })
  } catch (error) {
    console.error("Erro ao fazer upload:", error)
    return new NextResponse("Erro interno do servidor", { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 })
    }

    const searchParams = new URL(req.url).searchParams
    const limit = Number(searchParams.get("limit")) || undefined

    const files = await prisma.RestaurantFile.findMany({
      where: {
        restaurantId: params.id,
        restaurant: {
          userId: session.user.id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })

    return NextResponse.json(files)
  } catch (error) {
    console.error("Erro ao buscar arquivos:", error)
    return new NextResponse("Erro interno do servidor", { status: 500 })
  }
} 