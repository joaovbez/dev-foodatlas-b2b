import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { saveRevenue, getBreakEvenData } from "@/lib/big-query"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Não autorizado", { status: 401 })
    }

    const body = await req.json()
    const { amount, description, date } = body

    if (!amount || !description || !date) {
      return new NextResponse("Campos obrigatórios faltando", { status: 400 })
    }

    await saveRevenue(
      params.id,
      amount,
      description,
      date
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[REVENUES_POST]", error)
    return new NextResponse("Erro interno", { status: 500 })
  }
}

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

    const revenues = await getBreakEvenData(params.id, startDate, endDate)

    return NextResponse.json(revenues)
  } catch (error) {
    console.error("[REVENUES_GET]", error)
    return new NextResponse("Erro interno", { status: 500 })
  }
} 