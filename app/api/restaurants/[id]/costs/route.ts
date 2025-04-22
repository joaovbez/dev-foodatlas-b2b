import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { amount, type, description } = body

    if (!amount || !type || !description) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const cost = await prisma.cost.create({
      data: {
        amount,
        type,
        description,
        restaurantId: params.id,
      },
    })

    return NextResponse.json(cost)
  } catch (error) {
    console.error("[COSTS_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const costs = await prisma.cost.findMany({
      where: {
        restaurantId: params.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(costs)
  } catch (error) {
    console.error("[COSTS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 