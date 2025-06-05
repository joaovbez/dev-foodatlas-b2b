import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getCostControlData } from "@/lib/big-query/dashboards/getData"
import { format, subMonths } from "date-fns";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    // Buscar o usuário completo
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      }
    });

    if (!user) {
      return new NextResponse("Usuário não encontrado", { status: 404 });
    }

    // Buscar o restaurante especificado pelo ID
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id,
        userId: user.id,
      }
    });

    if (!restaurant) {
      return new NextResponse("Restaurante não encontrado", { status: 404 });
    }

    // Datas para a consulta (últimos 6 meses para o gráfico)
    const today = new Date();
    const sixMonthsAgo = subMonths(today, 6);
    
    const startDate = format(sixMonthsAgo, "yyyy-MM-dd");
    const endDate = format(today, "yyyy-MM-dd");

    try {
      // Buscar dados de custos do BigQuery
      const costData = await getCostControlData(restaurant.id, startDate, endDate);
      
      if (!costData || costData.length === 0) {
        // Retornar dados vazios para 6 meses
        const emptyData = Array.from({ length: 6 }, (_, i) => {
          const date = subMonths(today, 5 - i);
          return {
            month: format(date, "yyyy-MM-dd"),
            stockCost: 0,
            foodCost: 0,
            laborCost: 0,
            promoCost: 0,
            variableCosts: 0,
            fixedCosts: 0,
            totalCosts: 0,
          };
        });
        
        return NextResponse.json(emptyData);
      }
      
      // Processar dados para o gráfico
      const processedData = costData.map(item => ({
        month: item.month,
        stockCost: item.stock_cost || 0,
        foodCost: item.food_cost || 0,
        laborCost: item.labor_cost || 0,
        promoCost: item.promo_cost || 0,
        variableCosts: item.variable_costs || 0,
        fixedCosts: item.fixed_costs || 0,
        totalCosts: item.total_costs || 0,
      }));
      
      return NextResponse.json(processedData);
    } catch (dbError) {
      console.error("[COST_CONTROL_CHART_GET] Erro ao acessar BigQuery:", dbError);
      
      // Dados de contingência em caso de falha no BigQuery
      const emptyData = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(today, 5 - i);
        return {
          month: format(date, "yyyy-MM-dd"),
          stockCost: 0,
          foodCost: 0,
          laborCost: 0,
          promoCost: 0,
          variableCosts: 0,
          fixedCosts: 0,
          totalCosts: 0,
        };
      });
      
      return NextResponse.json(emptyData);
    }
  } catch (error) {
    console.error("[COST_CONTROL_CHART_GET] Erro:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
} 