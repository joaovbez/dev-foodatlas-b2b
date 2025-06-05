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

    // Datas para a consulta (últimos 3 meses)
    const today = new Date();
    const threeMonthsAgo = subMonths(today, 3);
    
    const startDate = format(threeMonthsAgo, "yyyy-MM-dd");
    const endDate = format(today, "yyyy-MM-dd");

    try {
      // Buscar dados de custos do BigQuery
      const costData = await getCostControlData(restaurant.id, startDate, endDate);
      
      if (!costData || costData.length === 0) {
        return NextResponse.json({
          currentMonth: {
            stockCost: 0,
            foodCost: 0,
            laborCost: 0,
            promoCost: 0,
            variableCosts: 0,
            fixedCosts: 0,
            totalCosts: 0,
          },
          lastMonth: {
            stockCost: 0,
            foodCost: 0,
            laborCost: 0,
            promoCost: 0,
            variableCosts: 0,
            fixedCosts: 0,
            totalCosts: 0,
          },
          is_fallback: true
        });
      }
      
      // Organizar dados por mês (assumindo que os dados vêm ordenados por mês DESC)
      const currentMonth = costData[0] || {};
      const lastMonth = costData[1] || {};
      
      const processedData = {
        currentMonth: {
          stockCost: currentMonth.stock_cost || 0,
          foodCost: currentMonth.food_cost || 0,
          laborCost: currentMonth.labor_cost || 0,
          promoCost: currentMonth.promo_cost || 0,
          variableCosts: currentMonth.variable_costs || 0,
          fixedCosts: currentMonth.fixed_costs || 0,
          totalCosts: currentMonth.total_costs || 0,
        },
        lastMonth: {
          stockCost: lastMonth.stock_cost || 0,
          foodCost: lastMonth.food_cost || 0,
          laborCost: lastMonth.labor_cost || 0,
          promoCost: lastMonth.promo_cost || 0,
          variableCosts: lastMonth.variable_costs || 0,
          fixedCosts: lastMonth.fixed_costs || 0,
          totalCosts: lastMonth.total_costs || 0,
        }
      };
      
      return NextResponse.json(processedData);
    } catch (dbError) {
      console.error("[COST_CONTROL_GET] Erro ao acessar BigQuery:", dbError);
      
      // Dados de contingência em caso de falha no BigQuery
      return NextResponse.json({
        currentMonth: {
          stockCost: 0,
          foodCost: 0,
          laborCost: 0,
          promoCost: 0,
          variableCosts: 0,
          fixedCosts: 0,
          totalCosts: 0,
        },
        lastMonth: {
          stockCost: 0,
          foodCost: 0,
          laborCost: 0,
          promoCost: 0,
          variableCosts: 0,
          fixedCosts: 0,
          totalCosts: 0,
        },
        is_fallback: true
      });
    }
  } catch (error) {
    console.error("[COST_CONTROL_GET] Erro:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
} 