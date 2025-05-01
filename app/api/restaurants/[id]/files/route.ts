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
import { exec } from 'child_process';

interface RestaurantFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
  documentType?: string;
}

const STORAGE_LIMIT_MB = 100;

async function processFileWithPython(tempFilePath: string, fileId: string, restaurantId: string) {
  console.log("[DEBUG] Iniciando processamento do arquivo com Python");
  console.log(`[DEBUG] Caminho do arquivo temporário: ${tempFilePath}`);
  console.log(`[DEBUG] File ID: ${fileId}`);
  console.log(`[DEBUG] Restaurant ID: ${restaurantId}`);

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
      await processFileWithPython(tempFilePath, fileId, restaurantId);
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

    const usage = {
      files,
      totalSize: files.reduce((acc: number, file: RestaurantFile) => acc + file.size, 0),
      usedStorage: files.reduce((acc: number, file: RestaurantFile) => acc + (file.size / 1024 / 1024), 0),
      availableStorage: STORAGE_LIMIT_MB,
      percentageUsed: (files.reduce((acc: number, file: RestaurantFile) => acc + (file.size / 1024 / 1024), 0) / STORAGE_LIMIT_MB) * 100
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
  console.log("[DEBUG] Iniciando processamento de upload de arquivo");
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
    
    try {
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
      console.log(`[DEBUG] Caminho GCS: ${pathGCS}`);
      
      // Upload do arquivo para o Google Cloud Storage
      console.log("[DEBUG] Iniciando upload para GCS");
      await bucket.upload(tempFilePath, {
        destination: pathGCS,
        metadata: {
          contentType: file.type,
        },
      });
      console.log("[DEBUG] Upload para GCS concluído");

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${pathGCS}`;
      console.log(`[DEBUG] URL pública: ${publicUrl}`);

      // Criar registro no banco de dados
      console.log("[DEBUG] Criando registro no banco de dados");
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
      console.log(`[DEBUG] Registro criado com ID: ${fileRecord.id}`);

      // Processar embeddings em background
      console.log("[DEBUG] Iniciando processamento de embeddings");
      const ext = path.extname(file.name).toLowerCase();
      console.log(`[DEBUG] Extensão do arquivo: ${ext}`);
      
      Embeddings(pathGCS, ext, tempFilePath, restaurant.id, fileRecord.id, documentType)
        .catch(error => {
          console.error("[ERROR] Erro ao processar embeddings:", error);
        })
        .finally(() => {
          try {
            console.log("[DEBUG] Removendo arquivo temporário");
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
              console.log("[DEBUG] Arquivo temporário removido");
            }
          } catch (error) {
            console.error("[ERROR] Erro ao remover arquivo temporário:", error);
          }
        });

      return NextResponse.json(fileRecord);
    } catch (error) {
      console.error("[ERROR] Erro ao fazer upload do arquivo:", error);
      try {
        console.log("[DEBUG] Limpando arquivos parciais");
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        await bucket.file(pathGCS).delete().catch(() => {});
      } catch (deleteError) {
        console.error("[ERROR] Erro ao limpar arquivo parcial:", deleteError);
      }
      return new NextResponse("Erro ao fazer upload do arquivo", { status: 500 });
    }
  } catch (error) {
    console.error("[ERROR] Erro ao processar upload:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
} 