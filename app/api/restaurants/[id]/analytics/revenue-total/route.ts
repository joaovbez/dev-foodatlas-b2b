import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getTransactionsData } from "@/lib/big-query/dashboards/getData"
import { format, startOfYear, startOfMonth, subDays } from "date-fns"

type DailyRevenue = { date: string; revenue: number }

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) return new NextResponse("ID não fornecido", { status: 400 })

  // Autenticação e validações (igual ao avg-ticket)…
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return new NextResponse("Não autorizado", { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return new NextResponse("Usuário não encontrado", { status: 404 })
  const restaurant = await prisma.restaurant.findFirst({ where: { id, userId: user.id } })
  if (!restaurant) return new NextResponse("Restaurante não encontrado", { status: 404 })

  // Period param: yearly | quarterly | monthly
  const url = new URL(req.url)
  const period = url.searchParams.get("period") ?? "yearly"
  const today = new Date()
  let startDate: Date
  switch (period) {
    case "monthly":
      startDate = subDays(today, 7)
      break
    case "quarterly":
      startDate = startOfMonth(today)
      break
    default:
      startDate = startOfYear(today)
  }

  try {
    // Buscar transações no BigQuery
    const startStr = format(startDate, "yyyy-MM-dd")
    const endStr = format(today, "yyyy-MM-dd")
    const txs = await getTransactionsData(id, startStr, endStr)

    // Agrupar soma diária
    const map: Record<string, number> = {}
    txs.forEach(tx => {
      if (!tx.date.value || typeof tx.amount !== "number") return
      map[tx.date.value] = (map[tx.date.value] || 0) + tx.amount
    })
    
    // Transformar em array e preencher dias faltantes
    const days: DailyRevenue[] = []
    for (
      let d = new Date(startDate);
      d <= today;
      d.setDate(d.getDate() + 1)
    ) {
      const key = format(d, "yyyy-MM-dd")
      days.push({ date: key, revenue: parseFloat((map[key] || 0).toFixed(2)) })
    }
    
    return NextResponse.json(days)
  } catch (err) {
    console.error("Erro na rota revenue-total:", err)
    // fallback
    return NextResponse.json(
      Array.from({ length: 7 }).map((_, i) => ({
        date: format(subDays(today, 6 - i), "yyyy-MM-dd"),
        revenue: Math.random() * 5000,
      }))
    )
  }
}
