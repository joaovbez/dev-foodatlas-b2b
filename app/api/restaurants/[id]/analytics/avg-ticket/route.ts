import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getTransactionsData } from "@/lib/big-query"
import { format, subMonths, parseISO } from "date-fns"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id

    if (!id) {
      return new NextResponse("ID do restaurante não fornecido", { status: 400 });
    }

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

    // Verificar se o restaurante existe e pertence ao usuário
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id,
        userId: user.id,
      }
    });

    if (!restaurant) {
      return new NextResponse("Restaurante não encontrado", { status: 404 });
    }

    try {
      // Datas para a consulta
      const today = new Date();
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonthStart = subMonths(currentMonthStart, 1);
      
      // Formato YYYY-MM-DD para as datas
      const startDateStr = format(lastMonthStart, "yyyy-MM-dd");
      const endDateStr = format(today, "yyyy-MM-dd");
      
     // console.log(`[AVG_TICKET_GET] Buscando transações entre ${startDateStr} e ${endDateStr}`);
      
      // Usar a função getTransactionsData para buscar transações
      const transactions = await getTransactionsData(id, startDateStr, endDateStr);
      
      if (!transactions || transactions.length === 0) {
        //console.log("[AVG_TICKET_GET] Nenhuma transação encontrada, retornando dados vazios");
        return NextResponse.json({
          avg_ticket: 0,
          percentage: 0,
          currency: "BRL",
          period: "month",
          compared_to: "last_month"
        });
      }
      
     // console.log(`[AVG_TICKET_GET] Encontradas ${transactions.length} transações`);
      //console.log(`[AVG_TICKET_GET] Exemplo de data da transação:`, transactions[0]?.date);
      
      // Agrupar transações por mês e calcular médias
      const currentMonthStr = format(currentMonthStart, "yyyy-MM");
      const lastMonthStr = format(lastMonthStart, "yyyy-MM");
      
      let currentMonthTotal = 0;
      let currentMonthCount = 0;
      let lastMonthTotal = 0;
      let lastMonthCount = 0;
      
      // Processar transações
      transactions.forEach(tx => {
        try {
          // Verifica se a data está no formato correto antes de processar
          if (!tx.date || typeof tx.date !== 'string') {
            //console.log(`[AVG_TICKET_GET] Data inválida na transação:`, tx);
            return; // Pula esta transação
          }

          // Trata a data como string no formato YYYY-MM-DD
          const txYear = tx.date.substring(0, 4);
          const txMonth = tx.date.substring(5, 7);
          const txMonthStr = `${txYear}-${txMonth}`;
          
          if (txMonthStr === currentMonthStr) {
            currentMonthTotal += Number(tx.amount);
            currentMonthCount++;
          } else if (txMonthStr === lastMonthStr) {
            lastMonthTotal += Number(tx.amount);
            lastMonthCount++;
          }
        } catch (err) {
          //console.error(`[AVG_TICKET_GET] Erro ao processar transação:`, tx, err);
        }
      });
      
      // Calcular médias
      const currentAvgTicket = currentMonthCount > 0 ? 
        parseFloat((currentMonthTotal / currentMonthCount).toFixed(2)) : 0;
      
      const lastAvgTicket = lastMonthCount > 0 ? 
        parseFloat((lastMonthTotal / lastMonthCount).toFixed(2)) : 1; // Evitar divisão por zero
      
      //console.log(`[AVG_TICKET_GET] Ticket médio atual: ${currentAvgTicket}, anterior: ${lastAvgTicket}`);
      //console.log(`[AVG_TICKET_GET] Contagem de transações: atual=${currentMonthCount}, anterior=${lastMonthCount}`);
      
      // Calcular percentual de variação
      const percentage = Math.round(((currentAvgTicket - lastAvgTicket) / lastAvgTicket) * 100);
      
      return NextResponse.json({
        avg_ticket: currentAvgTicket,
        percentage: percentage,
        currency: "BRL",
        period: "month",
        compared_to: "last_month"
      });
    } catch (dbError) {
      //console.error("[AVG_TICKET_GET] Erro na consulta:", dbError);
      
      // Dados fictícios em caso de erro durante o desenvolvimento
      return NextResponse.json({
        avg_ticket: 153.28,
        percentage: 12,
        currency: "BRL",
        period: "month",
        compared_to: "last_month",
        is_fallback: true
      });
    }
  } catch (error) {
    //console.error("[AVG_TICKET_GET] Erro:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}