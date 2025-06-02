import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getTransactionsData } from "@/lib/big-query/dashboards/getData"
import { format, subMonths, getDaysInMonth } from "date-fns";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return new NextResponse("ID do restaurante não fornecido", { status: 400 });

    // autenticação…
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Não autorizado", { status: 401 });

    // validação de usuário e restaurante…
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new NextResponse("Usuário não encontrado", { status: 404 });
    const restaurant = await prisma.restaurant.findFirst({
      where: { id, userId: user.id },
    });
    if (!restaurant) return new NextResponse("Restaurante não encontrado", { status: 404 });

    try {
      // datas de consulta
      const today = new Date();
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonthStart = subMonths(currentMonthStart, 1);
      const startDateStr = format(lastMonthStart, "yyyy-MM-dd");
      const endDateStr = format(today, "yyyy-MM-dd");

      // traz todas as transações dos 2 meses
      const transactions = await getTransactionsData(id, startDateStr, endDateStr);

      if (!transactions || transactions.length === 0) {
        return NextResponse.json({
          avg_count: 0,
          percentage: 0,
          period: "month",
          compared_to: "last_month",
        });
      }

      const currentMonthKey = format(currentMonthStart, "yyyy-MM");
      const lastMonthKey = format(lastMonthStart, "yyyy-MM");

      // agrupar sets de client_id por dia
      const currentMap: Record<string, Set<string>> = {};
      const lastMap: Record<string, Set<string>> = {};

      for (const tx of transactions) {
        if (!tx.date.value || typeof tx.date.value !== "string" || !tx.client_id) continue;
        const day = tx.date.value;              // “YYYY-MM-DD”
        const m = day.substring(0, 7);    // “YYYY-MM”
        if (m === currentMonthKey) {
          currentMap[day] = currentMap[day] || new Set();
          currentMap[day].add(tx.client_id);
        } else if (m === lastMonthKey) {
          lastMap[day] = lastMap[day] || new Set();
          lastMap[day].add(tx.client_id);
        }
      }

      // número de dias no período
      const daysElapsed =
        Math.floor((today.getTime() - currentMonthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const daysInLast = getDaysInMonth(lastMonthStart);

      // soma total de clientes únicos
      const sumCurrent = Object.values(currentMap).reduce((s, set) => s + set.size, 0);
      const sumLast = Object.values(lastMap).reduce((s, set) => s + set.size, 0);

      // média diária
      const avgCurrent = daysElapsed > 0
        ? parseFloat((sumCurrent / daysElapsed).toFixed(2))
        : 0;
      const avgLast = daysInLast > 0
        ? parseFloat((sumLast / daysInLast).toFixed(2))
        : 1;

      const percentage = Math.round(((avgCurrent - avgLast) / avgLast) * 100);

      return NextResponse.json({
        avg_count: avgCurrent,
        percentage,
        period: "month",
        compared_to: "last_month",
      });
    } catch {
      // fallback de desenvolvimento
      return NextResponse.json({
        avg_count: 348,
        percentage: 7,
        period: "month",
        compared_to: "last_month",
        is_fallback: true,
      });
    }
  } catch {
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}
