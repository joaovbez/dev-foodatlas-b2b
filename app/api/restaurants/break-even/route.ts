import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"
import { redirect } from "next/navigation"

// Esta rota antiga agora redireciona para o novo endpoint
export async function GET(
  req: NextRequest,
) {
  try {
    console.log("[BREAK_EVEN_GET_DEPRECATED] Redirecionando para novo endpoint");
    
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

    // Buscar o primeiro restaurante do usuário
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        userId: user.id,
      }
    });

    if (!restaurant) {
      return new NextResponse("Restaurante não encontrado", { status: 404 });
    }

    // Redirecionar para o novo endpoint
    return NextResponse.redirect(new URL(`/api/restaurants/${restaurant.id}/break-even`, req.url));
  } catch (error) {
    console.error("[BREAK_EVEN_GET_DEPRECATED] Erro:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
} 