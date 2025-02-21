// /app/api/restaurants/[id]/chat/init/route.ts
import { NextResponse } from "next/server";
import { bucket } from "@/lib/google-cloud-storage";
import { OpenAI } from "openai";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import os from "os";
import Papa from "papaparse";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Cache global para armazenar os dados pré-processados por restaurante.
const preprocessedCache = new Map<string, { allChunks: { chunk: string; embedding: number[] }[] }>();

async function extractTextFromFile(filePath: string, ext: string): Promise<string> {
  if (ext === ".pdf") {
    const { default: pdfParse } = await import("pdf-parse");
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } else if (ext === ".csv") {
    const csvText = fs.readFileSync(filePath, "utf-8");
    const parsed = Papa.parse(csvText, { header: true });
    return JSON.stringify(parsed.data, null, 2);
  } else if (ext === ".txt") {
    return fs.readFileSync(filePath, "utf-8");
  } else {
    return "";
  }
}

function splitTextIntoChunks(text: string, maxChunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxChunkSize, text.length);
    const chunk = text.substring(start, end);
    chunks.push(chunk);
    start += maxChunkSize - overlap;
  }
  return chunks;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const restaurantId = params.id;
    // Recupera os arquivos anexados ao restaurante via Prisma.
    const files = await prisma.restaurantFile.findMany({
      where: { restaurantId },
      select: { name: true, type: true, url: true }
    });
    if (files.length === 0) {
      return NextResponse.json({ error: "Nenhum arquivo encontrado para este restaurante." }, { status: 404 });
    }

    const extractedTexts: { fileName: string; text: string }[] = [];
    for (const file of files) {
      // Extrai o caminho relativo do objeto no bucket a partir da URL.
      const filePathInBucket = file.url.replace(`https://storage.googleapis.com/${bucket.name}/`, "");
      const blob = bucket.file(filePathInBucket);
      const tempFilePath = path.join(os.tmpdir(), file.name);
      await blob.download({ destination: tempFilePath });
      // Usa a extensão extraída do nome do arquivo
      const ext = path.extname(file.name).toLowerCase();
      const text = await extractTextFromFile(tempFilePath, ext);
      if (text) {
        extractedTexts.push({ fileName: file.name, text });
      }
      fs.unlinkSync(tempFilePath);
    }

    // Dividir cada texto extraído em chunks e gerar embeddings para cada chunk.
    const allChunks: { chunk: string; embedding: number[] }[] = [];
    for (const { text } of extractedTexts) {
      console.log("debugacao");
      var i = 0;
      const chunks = splitTextIntoChunks(text, 12000, 1000);
      for (const chunk of chunks) {
        console.log(i)
        const chunkEmbeddingResponse = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: chunk,
        });
        const embedding = chunkEmbeddingResponse.data[0].embedding;
        allChunks.push({ chunk, embedding });
        i = i + 1;
      }
    }
    console.log("debugacao");
    // Armazena os chunks processados no cache, associados ao restaurantId.
    preprocessedCache.set(restaurantId, { allChunks });
    console.log("Pré-processamento concluído.");
    console.log(preprocessedCache);
    return NextResponse.json({ message: "Pré-processamento concluído.", cached: true });
  } catch (error) {
    console.error("Erro no pré-processamento:", error);
    return NextResponse.json({ error: "Erro no pré-processamento." }, { status: 500 });
  }
}

// Exporta o cache para ser usado pelo endpoint de chat.
export { preprocessedCache };