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
    const { amount, description } = body

    if (!amount || !description) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const revenue = await prisma.revenue.create({
      data: {
        amount,
        description,
        restaurantId: params.id,
      },
    })

    return NextResponse.json(revenue)
  } catch (error) {
    console.error("[REVENUES_POST]", error)
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

    const revenues = await prisma.revenue.findMany({
      where: {
        restaurantId: params.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(revenues)
  } catch (error) {
    console.error("[REVENUES_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 