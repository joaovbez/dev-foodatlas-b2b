import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
<<<<<<< HEAD
import { getTransactionsData } from "@/lib/big-query/dashboards/getData"
=======
import { getTransactionsData } from "@/lib/big-query"
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
import { format, subMonths } from "date-fns"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Estamos esperando o objeto params antes de acessar suas propriedades
<<<<<<< HEAD
    const id = (await params).id;    
=======
    const id = (await params).id

    //console.log("[COUNT_CLIENTS_GET] Iniciando busca de contagem de clientes para o restaurante:", id);

>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
    // Validar se o ID foi fornecido
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
      const currentMonthStart = new Date();
      currentMonthStart.setDate(1); // Primeiro dia do mês atual
      currentMonthStart.setHours(0, 0, 0, 0);
      
      // Buscar dados do mês anterior para comparação
      const lastMonthStart = new Date(currentMonthStart);
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      
      const lastMonthEnd = new Date(currentMonthStart);
      lastMonthEnd.setDate(0); // Último dia do mês anterior
      lastMonthEnd.setHours(23, 59, 59, 999);
      
      // Formato YYYY-MM-DD para as datas
      const startDateStr = format(lastMonthStart, "yyyy-MM-dd");
      const endDateStr = format(new Date(), "yyyy-MM-dd");
      
<<<<<<< HEAD
=======
      //console.log(`[COUNT_CLIENTS_GET] Buscando dados entre ${startDateStr} e ${endDateStr}`);
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
      
      // Usar a nova função para buscar transações
      const transactions = await getTransactionsData(id, startDateStr, endDateStr);
      
      if (!transactions || transactions.length === 0) {
<<<<<<< HEAD
=======
        //console.log("[COUNT_CLIENTS_GET] Nenhuma transação encontrada, retornando dados vazios");
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
        return NextResponse.json({
          total: 0,
          percentage: 0,
          period: "month",
          compared_to: "last_month"
        });
      }
      
<<<<<<< HEAD
=======
      //console.log(`[COUNT_CLIENTS_GET] Encontradas ${transactions.length} transações`);
      //console.log(`[COUNT_CLIENTS_GET] Exemplo de data da transação:`, transactions[0]?.date);
      
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
      // Agrupar transações por mês e contar clientes únicos
      const currentMonthStr = format(currentMonthStart, "yyyy-MM");
      const lastMonthStr = format(lastMonthStart, "yyyy-MM");
      
      // Filtragem e agrupamento
      const currentMonthClients = new Set();
      const lastMonthClients = new Set();
      
      transactions.forEach(tx => {
        try {
          // Verifica se a data está no formato correto antes de processar
          if (!tx.date || typeof tx.date !== 'string') {
<<<<<<< HEAD
            return;
=======
            //console.log(`[COUNT_CLIENTS_GET] Data inválida na transação:`, tx);
            return; // Pula esta transação
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
          }

          // Trata a data como string no formato YYYY-MM-DD
          const txYear = tx.date.substring(0, 4);
          const txMonth = tx.date.substring(5, 7);
          const txMonthStr = `${txYear}-${txMonth}`;
          
          if (txMonthStr === currentMonthStr) {
            currentMonthClients.add(tx.client_id);
          } else if (txMonthStr === lastMonthStr) {
            lastMonthClients.add(tx.client_id);
          }
        } catch (err) {
<<<<<<< HEAD
          
=======
          //console.error(`[COUNT_CLIENTS_GET] Erro ao processar transação:`, tx, err);
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
        }
      });
      
      const currentTotal = currentMonthClients.size;
      const lastTotal = lastMonthClients.size || 1; // Evitar divisão por zero
      
<<<<<<< HEAD

=======
      //console.log(`[COUNT_CLIENTS_GET] Clientes mês atual: ${currentTotal}, mês anterior: ${lastTotal}`);
      
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
      // Calcular percentual de variação
      const percentage = Math.round(((currentTotal - lastTotal) / lastTotal) * 100);
      
      const data = {
        total: currentTotal,
        percentage,
        period: "month",
        compared_to: "last_month"
      };
<<<<<<< HEAD
      return NextResponse.json(data);
    } catch (dbError) {
      //console.error("[COUNT_CLIENTS_GET] Erro na consulta:", dbError);
      // Fornecer dados fictícios em caso de erro durante o desenvolvimento
      return NextResponse.json({
        total: 0,
        percentage: 0,
=======

      return NextResponse.json(data);
    } catch (dbError) {
      //console.error("[COUNT_CLIENTS_GET] Erro na consulta:", dbError);
      
      // Fornecer dados fictícios em caso de erro durante o desenvolvimento
      return NextResponse.json({
        total: 24748,
        percentage: 13,
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
        period: "month",
        compared_to: "last_month",
        is_fallback: true
      });
    }
  } catch (error) {
<<<<<<< HEAD
    console.error("[COUNT_CLIENTS_GET] Erro:", error);
=======
    //console.error("[COUNT_CLIENTS_GET] Erro:", error);
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
} 