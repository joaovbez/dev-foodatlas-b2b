import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { calculateBreakEven } from "@/lib/break-even"
import { getBreakEvenData } from "@/lib/big-query"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Não autorizado", { status: 401 })
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: {
        userId: session.user.id,
      }
    })

    if (!restaurant) {
      return new NextResponse("Restaurante não encontrado", { status: 404 })
    }

    const startDate = new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString()
    const endDate = new Date().toISOString()

    const transactions = await getBreakEvenData(restaurant.id, startDate, endDate)
    const breakEvenData = calculateBreakEven(transactions)

    return NextResponse.json(breakEvenData)
  } catch (error) {
    console.error("[BREAK_EVEN_GET]", error)
    return new NextResponse("Erro interno", { status: 500 })
  }
} 