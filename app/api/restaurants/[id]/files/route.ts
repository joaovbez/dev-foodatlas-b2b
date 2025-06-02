import { NextRequest, NextResponse } from "next/server";
import { bucket } from "@/lib/google-cloud-storage";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { v4 as uuidv4 } from 'uuid';
import path from "path";
import os from "os";
import fs from "fs";
import { generateEmbedding } from "@/lib/process_chat_data/openAI";
import { saveCSVtoSQL, saveEmbedding, saveEmbedding_tabular } from "@/lib/big-query/chat/saves";
import { processTXTFile } from "@/lib/process_chat_data/chunkerTXT";
import { processPDFFile } from "@/lib/process_chat_data/chunkerPDF";
import { processCSVFile } from "@/lib/process_chat_data/chunkerCSV";
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


// Função que chama o child_process pra usar o script python 
// Em breve vamos mudar para uma API, mais organizado. FastAPI rodando no CloudRun com Docker.
async function processFileWithPython(tempFilePath: string, fileId: string, restaurantId: string) {  

  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'lib', 'dataprep', 'processFile.py');
    console.log(`[DEBUG] Caminho do script Python: ${scriptPath}`);
    
    const command = `python3 ${scriptPath} "${tempFilePath}" "${restaurantId}"`;
    console.log(`[DEBUG] Comando a ser executado: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`[ERROR] Erro ao executar script Python: ${error.message}`);
        console.error(`[ERROR] Código de saída: ${error.code}`);
        console.error(`[ERROR] Signal: ${error.signal}`);
        reject(new Error(`Erro ao executar script Python: ${error.message}`));
        return;
      }
      
      if (stderr) {
        // Verifica se o stderr contém apenas logs de debug/info
        const isDebugLog = stderr.includes("DEBUG") || stderr.includes("INFO");
        if (!isDebugLog) {
          console.error(`[ERROR] Erro no script Python: ${stderr}`);
          reject(new Error(`Erro no script Python: ${stderr}`));
          return;
        }
      }
      
      console.log(`[DEBUG] Script Python executado com sucesso`);
      console.log(`[DEBUG] Saída do script: ${stdout}`);
      resolve(stdout);
    });
  });
}

async function Embeddings(pathGSC: string, ext: string, tempFilePath: string, restaurantId: string, fileId: string, documentType: string) {

  try {
    try {
      await processFileWithPython(tempFilePath, fileId, restaurantId);
    } catch (error) {
      console.error("[ERROR] Erro ao processar arquivo com script Python:", error);
    }
    
    if(ext === '.pdf'){
      try {
        let chunks_AND_summary = await processPDFFile(tempFilePath);  
        let chunks = chunks_AND_summary?.semanticChunks;
        let summary = chunks_AND_summary?.summary;
        if(chunks) {
          for (const chunk of chunks) {
            try {
              const embedding = await generateEmbedding(chunk);
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
      try {
        const file_description = await processCSVFile(tempFilePath);
        if(file_description){
          const embedding = await generateEmbedding(file_description);
          await saveEmbedding_tabular(fileId, restaurantId, file_description, embedding);
          await saveCSVtoSQL(pathGSC, restaurantId, documentType);  
        }
      } catch (error) {
        console.error("[ERROR] Erro ao processar CSV:", error);
      }
    } else if (ext === '.txt'){
      try {
        let chunks_AND_summary = await processTXTFile(tempFilePath);
        let chunks = chunks_AND_summary?.semanticChunks;
        let summary = chunks_AND_summary?.summary;
        if(chunks) {
          for (const chunk of chunks) {
            try {
              const embedding = await generateEmbedding(chunk);
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
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
    
    const currentUsageMB = userFiles.reduce((acc: number, file: RestaurantFile) => acc + (file.size / 1024 / 1024), 0);
    
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

    // Criar um arquivo temporário com um nome único
    const tempFileName = `${uuidv4()}-${file.name}`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);
    let pathGCS = '';
      
    // Converter o arquivo para um buffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const buffer = Buffer.from(uint8Array);

    // Salvar o arquivo temporário
    await fs.promises.writeFile(tempFilePath, buffer);

    const sanitizedDocumentType = documentType.trim().toLowerCase().replace(/\s+/g, '-');
    const fileName = `${restaurant.id}/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${sanitizedDocumentType}/${tempFileName}`;
    pathGCS = `restaurants/${fileName}`;
    const blob = bucket.file(pathGCS);

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
        } catch (deleteError) {
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
