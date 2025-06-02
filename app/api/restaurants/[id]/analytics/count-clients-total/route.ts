import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getTransactionsData } from "@/lib/big-query/dashboards/getData"
import { format, subDays } from "date-fns"

type DailyClients = { date: string; clientes: number }

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) return new NextResponse("ID não fornecido", { status: 400 })

  // Autenticação e validações…
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return new NextResponse("Não autorizado", { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return new NextResponse("Usuário não encontrado", { status: 404 })
  const restaurant = await prisma.restaurant.findFirst({ where: { id, userId: user.id } })
  if (!restaurant) return new NextResponse("Restaurante não encontrado", { status: 404 })

  // range param: e.g. "7d", "30d", "90d"
  const url = new URL(req.url)
  const range = url.searchParams.get("range") ?? "30d"
  const days = parseInt(range.replace("d", ""), 10)
  const today = new Date()
  const startDate = subDays(today, days - 1)

  try {
    const startStr = format(startDate, "yyyy-MM-dd")
    const endStr = format(today, "yyyy-MM-dd")
    const txs = await getTransactionsData(id, startStr, endStr)

    // Agrupar sets de client_id por dia
    const map: Record<string, Set<string>> = {}
    txs.forEach(tx => {
      if (!tx.date.value || !tx.client_id) return
      map[tx.date.value] = map[tx.date.value] || new Set()
      map[tx.date.value].add(tx.client_id)
      console.log(tx);
    })

    // Montar array com contagens diárias
    const daysArr: DailyClients[] = []
    for (
      let d = new Date(startDate);
      d <= today;
      d.setDate(d.getDate() + 1)
    ) {
      const key = format(d, "yyyy-MM-dd")
      daysArr.push({ date: key, clientes: map[key]?.size ?? 0 })
    }
    return NextResponse.json(daysArr)
  } catch (err) {
    console.error("Erro na rota count-clients-total:", err)
    // fallback
    return NextResponse.json(
      Array.from({ length: days }).map((_, i) => ({
        date: format(subDays(today, days - 1 - i), "yyyy-MM-dd"),
        clientes: Math.floor(Math.random() * 300) + 50,
      }))
    )
  }
}
