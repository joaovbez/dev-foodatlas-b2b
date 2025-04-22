import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { calculateBreakEven } from "@/lib/break-even"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        costs: {
          orderBy: {
            createdAt: "desc",
          },
          take: 3, // Últimos 3 meses
        },
        revenues: {
          orderBy: {
            createdAt: "desc",
          },
          take: 3, // Últimos 3 meses
        },
      },
    })

    if (!restaurant) {
      return new NextResponse("Restaurant not found", { status: 404 })
    }

    const breakEvenData = calculateBreakEven(restaurant.costs, restaurant.revenues)

    return NextResponse.json(breakEvenData)
  } catch (error) {
    console.error("[BREAK_EVEN_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 