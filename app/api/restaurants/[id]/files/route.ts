import { NextRequest, NextResponse } from "next/server";
import { bucket } from "@/lib/google-cloud-storage";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { v4 as uuidv4 } from 'uuid';
import path from "path";
import os from "os";
import fs from "fs";
import { generateEmbedding } from "@/lib/services/openAI";
import { saveEmbedding } from "@/lib/services/big-query";
import { processTXTFile } from "@/lib/services/chunkerTXT";
import { processPDFFile } from "@/lib/services/chunkerPDF";

const STORAGE_LIMIT_MB = 100;

async function Embeddings(file: File, ext: string, tempFilePath: string, restaurantId: string, fileId: string) {
  let chunks_AND_summary;

  if (ext === '.pdf') {
    chunks_AND_summary = await processPDFFile(tempFilePath);  
  } else if (ext === '.csv'){
    // chunks = await processCSVFile(file, ext);  
  } else if (ext === '.txt'){
    chunks_AND_summary = await processTXTFile(tempFilePath);
  } 
  
  let chunks = chunks_AND_summary?.semanticChunks;
  let summary = chunks_AND_summary?.summary;

  if (chunks)
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk);
      console.log("Embeddding Gerado");
      await saveEmbedding(fileId, restaurantId, chunk, embedding, summary);
      console.log("Embedding Armazenado");
    }
}

// --- Ajuste do GET ---
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    console.log("Iniciando busca de arquivos");
    const session = await getServerSession(authOptions);
    console.log("Sessão:", session);
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const searchParams = new URL(req.url).searchParams;
    const limit = Number(searchParams.get("limit")) || undefined;

    // Verificar se o restaurante pertence ao usuário
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!restaurant) {
      return new NextResponse("Restaurante não encontrado", { status: 404 });
    }

    const files = await prisma.restaurantFile.findMany({
      where: {
        restaurantId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });
    
    console.log(files[0]);

    const usage = {
      files,
      totalSize: files.reduce((acc, file) => acc + file.size, 0),
      usedStorage: files.reduce((acc, file) => acc + (file.size / 1024 / 1024), 0),
      availableStorage: STORAGE_LIMIT_MB,
      percentageUsed: (files.reduce((acc, file) => acc + (file.size / 1024 / 1024), 0) / STORAGE_LIMIT_MB) * 100
    };

    return NextResponse.json(usage);
  } catch (error) {
    console.error("Erro detalhado ao buscar arquivos:", error);
    return new NextResponse(
      `Erro interno do servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 
      { status: 500 }
    );
  }
}

// --- Ajuste do POST ---
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!restaurant) {
      return new NextResponse("Restaurante não encontrado", { status: 404 });
    }

    // Calcular uso atual do usuário
    const userFiles = await prisma.restaurantFile.findMany({
      where: {
        restaurant: {
          userId: session.user.id
        }
      }
    });
    
    const currentUsageMB = userFiles.reduce((acc, file) => acc + (file.size / 1024 / 1024), 0);
    
    // Verificar o arquivo novo
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;

    if (!file) {
      return new NextResponse("Nenhum arquivo enviado", { status: 400 });
    }

    const fileSizeMB = file.size / 1024 / 1024;
    
    // Verificar se o novo arquivo excederá o limite
    if (currentUsageMB + fileSizeMB > STORAGE_LIMIT_MB) {
      return new NextResponse(
        `Limite de armazenamento excedido. Você tem ${STORAGE_LIMIT_MB - currentUsageMB}MB disponíveis.`, 
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const sanitizedDocumentType = documentType.trim().toLowerCase().replace(/\s+/g, '-');
    const fileName = `${restaurant.id}/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${sanitizedDocumentType}/${uuidv4()}-${file.name}`;
        
    const blob = bucket.file(`restaurants/${fileName}`);
    
    return new Promise((resolve, reject) => {
      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: {
          contentType: file.type,
        },
      });

      blobStream.on('error', async (err) => {
        console.error("Erro no upload:", err);
        try {
          await blob.delete();
        } catch (deleteError) {
          console.error("Erro ao limpar arquivo parcial:", deleteError);
        }
        reject(new NextResponse("Erro ao fazer upload do arquivo", { status: 500 }));
      });
      
      blobStream.on('finish', async () => {
        try {
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

          const fileRecord = await prisma.restaurantFile.create({
            data: {
              name: file.name,
              size: file.size,
              type: file.type,
              url: publicUrl,
              documentType: documentType,              
              restaurantId: restaurant.id,
            },
          });
          
          resolve(NextResponse.json(fileRecord));                  
          
          // Lógica para gerar e armazenar os embeddings
          const tempFilePath = path.join(os.tmpdir(), file.name);
          const ext = path.extname(file.name).toLowerCase();
          
          fs.writeFileSync(tempFilePath, fileBuffer);
          await Embeddings(file, ext, tempFilePath, restaurant.id, fileRecord.id);
          fs.unlinkSync(tempFilePath);           

        } catch (error) {
          console.error("Erro ao salvar arquivo:", error);
          try {
            await blob.delete();
          } catch (deleteError) {
            console.error("Erro ao limpar arquivo após falha:", deleteError);
          }
          reject(new NextResponse("Erro ao salvar arquivo", { status: 500 }));
        }
      });

      blobStream.end(fileBuffer);
    });
  } catch (error) {
    console.error("Erro ao processar upload:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
} 