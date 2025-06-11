import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getTeamData } from "@/lib/big-query/dashboards/getData";
import { format, subMonths } from "date-fns";
import { start } from "repl";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Não autorizado", { status: 401 });
    }
    // Buscar o usuário completo
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    if (!user) {
      return new NextResponse("Usuário não encontrado", { status: 404 });
    }
    // Buscar o restaurante garantindo que pertence ao usuário
    const restaurant = await prisma.restaurant.findFirst({
      where: { id, userId: user.id }
    });
    if (!restaurant) {
      return new NextResponse("Restaurante não encontrado", { status: 404 });
    }
    // Datas para a consulta (últimos 3 meses)
    const today = new Date();
    const threeMonthsAgo = subMonths(today, 3);
    const startDate = format(threeMonthsAgo, "yyyy-MM-dd");
    const endDate = format(today, "yyyy-MM-dd");
    console.log(startDate, endDate);
    try {
      const teamData = await getTeamData(restaurant.id, startDate, endDate);                 
      const roundedTeamData = teamData.map((item: any) => ({
        id_funcionario: item.id_funcionario,
        funcao: item.funcao,
        taxa_hora_brl: parseFloat(item.taxa_hora_brl.toFixed(2)),
        custo_total_brl: parseFloat(item.custo_total_brl.toFixed(2)),
        total_horas_trabalhadas: parseFloat(item.total_horas_trabalhadas.toFixed(2)),
        dias_trabalhados: item.dias_trabalhados
      }))
      console.log(roundedTeamData[1])
      return NextResponse.json(roundedTeamData);
    } catch (dbError) {
      console.error("[TEAM_MANAGEMENT_GET] Erro ao acessar BigQuery:", dbError);
      return NextResponse.json([], { status: 200 });
    }
  } catch (error) {
    console.error("[TEAM_MANAGEMENT_GET] Erro:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}
