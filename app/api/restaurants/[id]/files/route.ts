import { NextRequest, NextResponse } from "next/server";
import { bucket } from "@/lib/google-cloud-storage";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { v4 as uuidv4 } from 'uuid';
import path from "path";
import os from "os";
import fs from "fs";
import { generateEmbedding } from "@/lib/chat_data/openAI";
import { saveCSVtoSQL, saveEmbedding, saveEmbedding_tabular } from "@/lib/big-query";
import { processTXTFile } from "@/lib/chat_data/chunkerTXT";
import { processPDFFile } from "@/lib/chat_data/chunkerPDF";
import { processCSVFile } from "@/lib/chat_data/chunkerCSV";
import fetch from 'node-fetch'
import FormData from 'form-data'
import { exec } from 'child_process';

interface ProcessResult {
  success?: boolean
  records?: number
  error?: string
}

interface RestaurantFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
  documentType: string | null;
}

const STORAGE_LIMIT_MB = 100;

// export async function processFileWithPython(
//   tempFilePath: string,
//   fileId: string,
//   restaurantId: string
// ): Promise<ProcessResult> {
//   console.log('[DEBUG] Iniciando processamento do arquivo com Python via HTTP')
//   console.log(`[DEBUG] Caminho do arquivo temporário: ${tempFilePath}`)
//   console.log(`[DEBUG] File ID: ${fileId}`)
//   console.log(`[DEBUG] Restaurant ID: ${restaurantId}`)

//   // 1) Leia o arquivo em memória
//   const fileBuffer = await fs.promises.readFile(tempFilePath)
//   const filename = path.basename(tempFilePath)

//   // 2) Monte o form-data
//   const form = new FormData()
//   form.append('file', fileBuffer, filename)
//   form.append('restaurant_id', restaurantId)

//   // 3) Faça a chamada ao FastAPI
//   const url = `${process.env.PYTHON_SERVICE_URL}/process/`
//   console.log(`[DEBUG] Enviando POST ${url}`)

//   const res = await fetch(url, {
//     method: 'POST',
//     body: form,
//     headers: form.getHeaders(),
//   })

//   // 4) Trate erros HTTP
//   if (!res.ok) {
//     const text = await res.text()
//     console.error(`[ERROR] Processor service retornou status ${res.status}: ${text}`)
//     throw new Error(`Processor service error: ${text}`)
//   }

//   // 5) Retorne o JSON
//   const result = await res.json() as ProcessResult
//   if (result.error) {
//     console.error(`[ERROR] Processor service reportou erro: ${result.error}`)
//     throw new Error(result.error)
//   }

//   console.log(`[DEBUG] Processamento concluído com sucesso, registros: ${result.records}`)
//   return result
// }

async function Embeddings(pathGSC: string, ext: string, tempFilePath: string, restaurantId: string, fileId: string, documentType: string) {
  console.log("[DEBUG] Iniciando processamento de embeddings");
  console.log(`[DEBUG] Caminho GCS: ${pathGSC}`);
  console.log(`[DEBUG] Extensão: ${ext}`);
  console.log(`[DEBUG] Caminho temporário: ${tempFilePath}`);
  console.log(`[DEBUG] Restaurant ID: ${restaurantId}`);
  console.log(`[DEBUG] File ID: ${fileId}`);

  try {
    // Primeiro processa o arquivo com o script Python
    try {
      console.log("[DEBUG] Iniciando processamento com script Python");
      // await processFileWithPython(tempFilePath, fileId, restaurantId);
      console.log("[DEBUG] Processamento com script Python concluído");
    } catch (error) {
      console.error("[ERROR] Erro ao processar arquivo com script Python:", error);
      // Não interrompe o fluxo, apenas registra o erro
    }
    
    if(ext === '.pdf'){
      console.log("[DEBUG] Processando arquivo PDF");
      try {
        let chunks_AND_summary = await processPDFFile(tempFilePath);  
        let chunks = chunks_AND_summary?.semanticChunks;
        let summary = chunks_AND_summary?.summary;
        if(chunks) {
          console.log(`[DEBUG] Número de chunks do PDF: ${chunks.length}`);
          for (const chunk of chunks) {
            try {
              console.log("[DEBUG] Gerando embedding para chunk do PDF");
              const embedding = await generateEmbedding(chunk);
              console.log("[DEBUG] Salvando embedding do PDF");
              await saveEmbedding(fileId, restaurantId, chunk, embedding, summary);
            } catch (error) {
              console.error("[ERROR] Erro ao processar chunk do PDF:", error);
              continue;
            }
          }
        }
      } catch (error) {
        console.error("[ERROR] Erro ao processar PDF:", error);
      }
    } else if (ext === '.csv'){
      console.log("[DEBUG] Processando arquivo CSV");
      try {
        console.log("[DEBUG] Obtendo descrição do arquivo CSV");
        const file_description = await processCSVFile(tempFilePath);
        if(file_description){
          console.log("[DEBUG] Gerando embedding para descrição do CSV");
          const embedding = await generateEmbedding(file_description);
          console.log("[DEBUG] Salvando embedding tabular");
          await saveEmbedding_tabular(fileId, restaurantId, file_description, embedding);
          console.log("[DEBUG] Salvando CSV no SQL");
          await saveCSVtoSQL(pathGSC, restaurantId, documentType);  
        }
      } catch (error) {
        console.error("[ERROR] Erro ao processar CSV:", error);
      }
    } else if (ext === '.txt'){
      console.log("[DEBUG] Processando arquivo TXT");
      try {
        let chunks_AND_summary = await processTXTFile(tempFilePath);
        let chunks = chunks_AND_summary?.semanticChunks;
        let summary = chunks_AND_summary?.summary;
        if(chunks) {
          console.log(`[DEBUG] Número de chunks do TXT: ${chunks.length}`);
          for (const chunk of chunks) {
            try {
              console.log("[DEBUG] Gerando embedding para chunk do TXT");
              const embedding = await generateEmbedding(chunk);
              console.log("[DEBUG] Salvando embedding do TXT");
              await saveEmbedding(fileId, restaurantId, chunk, embedding, summary);
            } catch (error) {
              console.error("[ERROR] Erro ao processar chunk do TXT:", error);
              continue;
            }
          }
        }
      } catch (error) {
        console.error("[ERROR] Erro ao processar TXT:", error);
      }
    }
  } catch (error) {
    console.error("[ERROR] Erro geral no processamento de embeddings:", error);
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

    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    const usedStorage = files.reduce((acc, file) => acc + (file.size / 1024 / 1024), 0);

    const usage = {
      files,
      totalSize,
      usedStorage,
      availableStorage: STORAGE_LIMIT_MB,
      percentageUsed: (usedStorage / STORAGE_LIMIT_MB) * 100
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  console.log(`[DEBUG] Restaurant ID: ${id}`);
  
  try {
    console.log("[DEBUG] Verificando sessão do usuário");
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("[ERROR] Usuário não autorizado");
      return new NextResponse("Não autorizado", { status: 401 });
    }
    console.log(`[DEBUG] Usuário autorizado: ${session.user.email}`);

    console.log("[DEBUG] Verificando restaurante");
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!restaurant) {
      console.log("[ERROR] Restaurante não encontrado");
      return new NextResponse("Restaurante não encontrado", { status: 404 });
    }
    console.log(`[DEBUG] Restaurante encontrado: ${restaurant.name}`);

    // Calcular uso atual do usuário
    console.log("[DEBUG] Calculando uso atual de armazenamento");
    const userFiles = await prisma.restaurantFile.findMany({
      where: {
        restaurant: {
          userId: session.user.id
        }
      }
    });
    
    const currentUsageMB = userFiles.reduce((acc: number, file: RestaurantFile) => acc + (file.size / 1024 / 1024), 0);
    console.log(`[DEBUG] Uso atual de armazenamento: ${currentUsageMB}MB`);
    
    // Verificar o arquivo novo
    console.log("[DEBUG] Obtendo dados do formulário");
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;

    if (!file) {
      console.log("[ERROR] Nenhum arquivo enviado");
      return new NextResponse("Nenhum arquivo enviado", { status: 400 });
    }
    console.log(`[DEBUG] Arquivo recebido: ${file.name} (${file.size} bytes)`);

    const fileSizeMB = file.size / 1024 / 1024;
    console.log(`[DEBUG] Tamanho do arquivo: ${fileSizeMB}MB`);
    
    // Verificar se o novo arquivo excederá o limite
    if (currentUsageMB + fileSizeMB > STORAGE_LIMIT_MB) {
      console.log("[ERROR] Limite de armazenamento excedido");
      return new NextResponse(
        `Limite de armazenamento excedido. Você tem ${STORAGE_LIMIT_MB - currentUsageMB}MB disponíveis.`, 
        { status: 400 }
      );
    }

    // Criar um arquivo temporário com um nome único
    console.log("[DEBUG] Criando arquivo temporário");
    const tempFileName = `${uuidv4()}-${file.name}`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);
    console.log(`[DEBUG] Caminho do arquivo temporário: ${tempFilePath}`);
    let pathGCS = '';
      
    // Converter o arquivo para um buffer de forma segura
    console.log("[DEBUG] Convertendo arquivo para buffer");
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const buffer = Buffer.from(uint8Array);

    // Salvar o arquivo temporário
    console.log("[DEBUG] Salvando arquivo temporário");
    await fs.promises.writeFile(tempFilePath, buffer);
    console.log("[DEBUG] Arquivo temporário salvo com sucesso");

    const sanitizedDocumentType = documentType.trim().toLowerCase().replace(/\s+/g, '-');
    const fileName = `${restaurant.id}/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${sanitizedDocumentType}/${tempFileName}`;
    pathGCS = `restaurants/${fileName}`;
    const blob = bucket.file(pathGCS);
    console.log(bucket.name);

    return new Promise((resolve, reject) => {
      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: {
          contentType: file.type,
        },
      });

      blobStream.on('error', async(err) => {
        console.error("[ERROR] Erro ao salvar arquivo no GCS:", err);
        try {
          await blob.delete();
          console.log("[DEBUG] Arquivo no GCS deletado devido ao erro");
        } catch (deleteError) {
          console.error("[ERROR] Não foi possível deletar arquivo no GCS após erro:", deleteError);
        }
        reject(new Error("[ERROR]Erro ao salvar arquivo no GCS"));
      })
      
      blobStream.on('finish', async() => {
        try {
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${pathGCS}`;

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

          const ext = path.extname(file.name).toLowerCase();
          
          fs.writeFileSync(tempFilePath, buffer);
          await Embeddings(pathGCS, ext, tempFilePath, restaurant.id, fileRecord.id, documentType);
          fs.unlinkSync(tempFilePath);                    

        } catch (error) {
          console.error("[ERROR] Erro ao salvar arquivo", error);
          try {
            await blob.delete();
          } catch (deleteError) {
              console.error("[ERROR] Erro ao deletar arquivo no GCS", deleteError);
          }
          reject(new Error("[ERROR] Erro ao gerar URL pública"));          
        }           
      });
      
      blobStream.end(buffer);
    });            
  } catch (error) {
    console.error("[ERROR] Erro ao processar upload:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}
