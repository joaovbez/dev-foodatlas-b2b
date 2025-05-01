import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getBreakEvenData } from "@/lib/big-query"
import { calculateBreakEven } from "@/lib/break-even"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Não autorizado", { status: 401 })
    }

    const searchParams = new URL(req.url).searchParams
    const startDate = searchParams.get("startDate") || new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString()
    const endDate = searchParams.get("endDate") || new Date().toISOString()

    const breakEvenRows = await getBreakEvenData(params.id, startDate, endDate)
    const breakEvenData = calculateBreakEven(breakEvenRows)

    return NextResponse.json(breakEvenData)
  } catch (error) {
    console.error("[BREAK_EVEN_GET]", error)
    return new NextResponse("Erro interno", { status: 500 })
  }
} 