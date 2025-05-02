import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { calculateBreakEven } from "@/lib/break-even"
import { getBreakEvenData } from "@/lib/big-query"
import { format, subMonths } from "date-fns";

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const { params } = context;
    const id = params.id;
    console.log("[BREAK_EVEN_GET] Iniciando busca dos dados de break-even para restaurante:", id);
    
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

    // Datas para a consulta
    const today = new Date();
    const threeMonthsAgo = subMonths(today, 3);
    
    const startDate = format(threeMonthsAgo, "yyyy-MM-dd");
    const endDate = format(today, "yyyy-MM-dd");
    
    console.log(`[BREAK_EVEN_GET] Buscando dados entre ${startDate} e ${endDate} para restaurante ${restaurant.id}`);

    try {
      // Buscar dados de transações do BigQuery para o período especificado
      const transactionData = await getBreakEvenData(restaurant.id, startDate, endDate);
      console.log(`[BREAK_EVEN_GET] Dados recuperados com sucesso: ${transactionData.length} transações`);
      
      if (!transactionData || transactionData.length === 0) {
        console.log("[BREAK_EVEN_GET] Nenhuma transação encontrada, retornando dados vazios");
        return NextResponse.json({
          currentMonth: {
            revenue: 0,
            fixedCost: 0,
            variableCost: 0,
            breakEvenPoint: 0,
          },
          lastMonth: {
            revenue: 0,
            fixedCost: 0,
            variableCost: 0,
            breakEvenPoint: 0,
          },
          nextMonth: {
            revenue: 0,
            fixedCost: 0,
            variableCost: 0,
            breakEvenPoint: 0,
          },
          is_fallback: true
        });
      }
      
      // Calcular o break-even baseado nos dados
      const breakEvenData = calculateBreakEven(transactionData);
      console.log("[BREAK_EVEN_GET] Cálculo de break-even concluído com sucesso");
      
      return NextResponse.json(breakEvenData);
    } catch (dbError) {
      console.error("[BREAK_EVEN_GET] Erro ao acessar BigQuery:", dbError);
      
      // Dados de contingência em caso de falha no BigQuery
      return NextResponse.json({
        currentMonth: {
          revenue: 143863.08,
          fixedCost: 97300,
          variableCost: 8631.78,
          breakEvenPoint: 106537.74
        },
        lastMonth: {
          revenue: 129476.77,
          fixedCost: 97300,
          variableCost: 7768.61,
          breakEvenPoint: 105649.07
        },
        nextMonth: {
          revenue: 158249.39,
          fixedCost: 97300,
          variableCost: 9494.96,
          breakEvenPoint: 107427.39
        },
        is_fallback: true
      });
    }
  } catch (error) {
    console.error("[BREAK_EVEN_GET] Erro:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
} 