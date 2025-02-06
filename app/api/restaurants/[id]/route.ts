import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
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

    // Buscar o usuário completo
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email!
      }
    })

    if (!user) {
      return new NextResponse("Usuário não encontrado", { status: 404 })
    }

    // Buscar o restaurante garantindo que pertence ao usuário
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!restaurant) {
      return new NextResponse("Restaurante não encontrado", { status: 404 })
    }

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error("Erro ao buscar restaurante:", error)
    return new NextResponse("Erro interno", { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const body = await req.json()
    const { name, cnpj, address, phone } = body

    if (!name || !cnpj) {
      return new NextResponse("Nome e CNPJ são obrigatórios", { status: 400 })
    }

    // Verificar se o restaurante existe e pertence ao usuário
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existingRestaurant) {
      return new NextResponse("Restaurante não encontrado", { status: 404 })
    }

    // Verificar se o novo CNPJ já está em uso (se foi alterado)
    if (cnpj !== existingRestaurant.cnpj) {
      const cnpjExists = await prisma.restaurant.findFirst({
        where: {
          cnpj,
          userId: user.id,
          NOT: {
            id: params.id
          }
        }
      })

      if (cnpjExists) {
        return new NextResponse("CNPJ já cadastrado em outro restaurante", { status: 400 })
      }
    }

    // Atualizar o restaurante
    const restaurant = await prisma.restaurant.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        cnpj,
        address: address || null,
        phone: phone || null,
      },
    })

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error("Erro ao atualizar restaurante:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Erro interno do servidor",
      { status: 500 }
    )
  }
}

// Opcional: Adicionar rota DELETE para excluir restaurantes
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Verificar se o restaurante existe e pertence ao usuário
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existingRestaurant) {
      return new NextResponse("Restaurante não encontrado", { status: 404 })
    }

    // Excluir o restaurante
    await prisma.restaurant.delete({
      where: {
        id: params.id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Erro ao excluir restaurante:", error)
    return new NextResponse("Erro interno", { status: 500 })
  }
} 