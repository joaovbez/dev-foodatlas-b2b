import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { deleteRestaurantEmbeddings } from "@/lib/big-query"
import { bucket } from "@/lib/google-cloud-storage"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Estamos esperando o objeto params antes de acessar suas propriedades
    const id = (await params).id
    console.log("[RESTAURANT_GET] Iniciando busca do restaurante:", id);

    // Validar se o ID foi fornecido
    if (!id) {
      return new NextResponse("ID do restaurante não fornecido", { status: 400 });
    }

    const session = await getServerSession(authOptions);
    console.log("[RESTAURANT_GET] Sessão encontrada:", !!session);

    if (!session?.user?.email) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    // Buscar o usuário completo
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      }
    });
    console.log("[RESTAURANT_GET] Usuário encontrado:", !!user);

    if (!user) {
      return new NextResponse("Usuário não encontrado", { status: 404 });
    }

    // Buscar o restaurante garantindo que pertence ao usuário
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        files: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });
    console.log("[RESTAURANT_GET] Restaurante encontrado:", !!restaurant);

    if (!restaurant) {
      return new NextResponse("Restaurante não encontrado", { status: 404 });
    }

    return NextResponse.json(restaurant);
  } catch (error) {
    console.error("[RESTAURANT_GET] Erro detalhado:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extração segura do ID
    const id = (await params).id
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    // Buscar o usuário completo
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email!
      }
    });

    if (!user) {
      return new NextResponse("Usuário não encontrado", { status: 404 });
    }

    const body = await req.json();
    const { name, cnpj, address, phone } = body;

    if (!name || !cnpj) {
      return new NextResponse("Nome e CNPJ são obrigatórios", { status: 400 });
    }

    // Verificar se o restaurante existe e pertence ao usuário
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingRestaurant) {
      return new NextResponse("Restaurante não encontrado", { status: 404 });
    }

    // Verificar se o novo CNPJ já está em uso (se foi alterado)
    if (cnpj !== existingRestaurant.cnpj) {
      const cnpjExists = await prisma.restaurant.findFirst({
        where: {
          cnpj,
          userId: user.id,
          NOT: {
            id
          }
        }
      });

      if (cnpjExists) {
        return new NextResponse("CNPJ já cadastrado em outro restaurante", { status: 400 });
      }
    }

    // Atualizar o restaurante
    const restaurant = await prisma.restaurant.update({
      where: {
        id,
      },
      data: {
        name,
        cnpj,
        address: address || null,
        phone: phone || null,
      },
    });

    return NextResponse.json(restaurant);
  } catch (error) {
    console.error("Erro ao atualizar restaurante:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Erro interno do servidor",
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extração segura do ID
    const id = (await params).id
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    // Buscar o usuário completo
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email!
      }
    });

    if (!user) {
      return new NextResponse("Usuário não encontrado", { status: 404 });
    }

    // Verificar se o restaurante existe e pertence ao usuário
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingRestaurant) {
      return new NextResponse("Restaurante não encontrado", { status: 404 });
    }

    // Buscar o arquivo mais recente do restaurante
    const mostRecentFile = await prisma.restaurantFile.findFirst({
      where: {
        restaurantId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Verificar se existe algum arquivo e quanto tempo passou desde o upload mais recente
    if (mostRecentFile) {
      const fileCreatedAt = new Date(mostRecentFile.createdAt);
      const currentTime = new Date();
      const timeDifferenceMs = currentTime.getTime() - fileCreatedAt.getTime();
      const timeDifferenceMinutes = Math.floor(timeDifferenceMs / (1000 * 60));
      
      // Se passaram menos de 90 minutos desde o upload mais recente, não permitir a exclusão
      if (timeDifferenceMinutes < 90) {
        console.error("Não é possível excluir o restaurante antes de 90 minutos após o último upload de arquivo");
        return new NextResponse("Não é possível excluir o restaurante antes de 90 minutos após o último upload de arquivo", { status: 403 });
      }
    }

    await prisma.restaurant.delete({
      where: {
        id,
      },
    });

    await prisma.restaurantFile.deleteMany({
      where: {
        restaurantId: id,
      },
    });

    // Retornar sucesso após as exclusões no banco SQL
    const successResponse = new NextResponse(null, { status: 204 });

    
    // Excluir embeddings dos arquivos relacionados ao restaurante em background
    deleteRestaurantEmbeddings(existingRestaurant.id);

    return successResponse;
  } catch (error) {
    console.error("Erro ao excluir restaurante:", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}