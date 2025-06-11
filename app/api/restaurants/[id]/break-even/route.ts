import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { calculateBreakEven } from "@/lib/break-even"
<<<<<<< HEAD
import { getBreakEvenData } from "@/lib/big-query/dashboards/getData"
=======
import { getBreakEvenData } from "@/lib/big-query"
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
import { format, subMonths } from "date-fns";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id

<<<<<<< HEAD
=======
    console.log("[BREAK_EVEN_GET] Iniciando busca dos dados de break-even para restaurante:", id);
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
    
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
    
<<<<<<< HEAD
=======
    console.log(`[BREAK_EVEN_GET] Buscando dados entre ${startDate} e ${endDate} para restaurante ${restaurant.id}`);
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5

    try {
      // Buscar dados de transações do BigQuery para o período especificado
      const transactionData = await getBreakEvenData(restaurant.id, startDate, endDate);
<<<<<<< HEAD
      
      if (!transactionData || transactionData.length === 0) {
=======
      console.log(`[BREAK_EVEN_GET] Dados recuperados com sucesso: ${transactionData.length} transações`);
      
      if (!transactionData || transactionData.length === 0) {
        console.log("[BREAK_EVEN_GET] Nenhuma transação encontrada, retornando dados vazios");
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
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
<<<<<<< HEAD
=======
      console.log("[BREAK_EVEN_GET] Cálculo de break-even concluído com sucesso");
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
      
      return NextResponse.json(breakEvenData);
    } catch (dbError) {
      console.error("[BREAK_EVEN_GET] Erro ao acessar BigQuery:", dbError);
      
      // Dados de contingência em caso de falha no BigQuery
      return NextResponse.json({
        currentMonth: {
<<<<<<< HEAD
          revenue: 0,
          fixedCost: 0,
          variableCost: 0,
          breakEvenPoint: 0
        },
        lastMonth: {
          revenue: 0,
          fixedCost: 0,
          variableCost: 0,
          breakEvenPoint: 0
        },
        nextMonth: {
          revenue: 0,
          fixedCost: 0,
          variableCost: 0,
          breakEvenPoint: 0
=======
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
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
        },
        is_fallback: true
      });
    }
  } catch (error) {
    console.error("[BREAK_EVEN_GET] Erro:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
} 