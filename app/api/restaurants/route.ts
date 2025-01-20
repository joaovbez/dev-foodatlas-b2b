import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 })
    }

    // Buscar o usuário completo do banco de dados
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email!
      }
    })

    if (!user) {
      return new NextResponse("Usuário não encontrado", { status: 404 })
    }

    const body = await req.json()
    const { name, cnpj, address, phone } = body

    if (!name || !cnpj) {
      return new NextResponse("Nome e CNPJ são obrigatórios", { status: 400 })
    }

    // Verificar se já existe um restaurante com este CNPJ para este usuário
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: { 
        cnpj,
        userId: user.id 
      }
    })

    if (existingRestaurant) {
      return new NextResponse("CNPJ já cadastrado", { status: 400 })
    }

    // Criar o restaurante associado ao usuário
    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        cnpj,
        address: address || null,
        phone: phone || null,
        userId: user.id // Usar o ID do usuário obtido do banco
      }
    })

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error("Erro ao criar restaurante:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Erro interno do servidor", 
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 })
    }

    // Buscar o usuário completo
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email!
      }
    })

    if (!user) {
      return new NextResponse("Usuário não encontrado", { status: 404 })
    }

    // Buscar apenas os restaurantes do usuário
    const restaurants = await prisma.restaurant.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(restaurants)
  } catch (error) {
    console.error("Erro ao listar restaurantes:", error)
    return new NextResponse("Erro interno", { status: 500 })
  }
}
