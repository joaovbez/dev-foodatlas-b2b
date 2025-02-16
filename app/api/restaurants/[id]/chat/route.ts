// /app/api/restaurants/[id]/chat/route.ts
import { NextResponse } from "next/server";
import { bucket } from "@/lib/google-cloud-storage";
import { OpenAI } from "openai";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import os from "os";
import Papa from "papaparse";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Função para extrair texto de um arquivo .txt.
 */
async function extractTextFromFile(filePath: string, ext: string): Promise<string> {
  console.log("entrei na função")
  if (ext === ".pdf") {
    const { default: pdfParse } = await import("pdf-parse"); // lazy import
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } else if (ext === ".csv") {
    console.log("passei pelo step1")
    const csvText = fs.readFileSync(filePath, "utf-8");
    console.log("passei pelo step2")
    // Se o CSV possuir cabeçalho, o option header: true organiza os dados em objetos
    const parsed = Papa.parse(csvText, { header: true });
    console.log("passei pelo step3")
    // Formata os dados em JSON indentado para melhor legibilidade
    return JSON.stringify(parsed.data, null, 2);    
  } else if (ext === ".txt") {
    return fs.readFileSync(filePath, "utf-8");
  } else {
    return "";
  }
}

/**
 * Função para calcular a similaridade coseno entre dois vetores.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((acc, val, idx) => acc + val * vecB[idx], 0);
  const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}

/**
 * Função para dividir um texto em chunks menores com overlap.
 */
function splitTextIntoChunks(text: string, maxChunkSize = 10000, overlap = 2000): string[] {
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
    const { question } = await req.json();
    if (!question) {
      return NextResponse.json({ error: "Pergunta é obrigatória." }, { status: 400 });
    }
    
    // 1. Recuperar os arquivos do restaurante no banco (restaurantFile)
    const files = await prisma.restaurantFile.findMany({
      where: { restaurantId: params.id },
      select: { name: true, type: true, url: true }
    });
    if (files.length === 0) {
      return NextResponse.json({ error: "Nenhum arquivo encontrado para este restaurante." }, { status: 404 });
    }

    // 2. Para cada arquivo, baixar do bucket e extrair o texto
    const extractedTexts: { fileName: string; text: string }[] = [];
    for (const file of files) {
      // Usa o campo "url" para extrair o caminho relativo no bucket
      const filePathInBucket = file.url.replace(`https://storage.googleapis.com/${bucket.name}/`, '');
      const blob = bucket.file(filePathInBucket);
      
      const tempFilePath = path.join(os.tmpdir(), file.name);
      await blob.download({ destination: tempFilePath });
      
      
      const ext = path.extname(file.name).toLowerCase();
      console.log(ext)
      const text = await extractTextFromFile(tempFilePath, ext);
      console.log(text)
      if (text) {
        extractedTexts.push({ fileName: file.name, text });
      }
      fs.unlinkSync(tempFilePath);
    }

    // 3. Gerar embedding para a pergunta do usuário
    const questionEmbeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: question,
    });
    const questionEmbedding = questionEmbeddingResponse.data[0].embedding;

    // 4. Dividir os textos extraídos em chunks, gerar embeddings para cada chunk e calcular similaridade
    const allChunks: { chunk: string; embedding: number[] }[] = [];
    for (const { fileName, text } of extractedTexts) {
      const chunks = splitTextIntoChunks(text, 10000, 2000);
      for (const chunk of chunks) {
        const chunkEmbeddingResponse = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: chunk,
        });
        const embedding = chunkEmbeddingResponse.data[0].embedding;
        allChunks.push({ chunk, embedding });
      }
    }

    // Calcular similaridade de cada chunk com a embedding da pergunta
    const chunkSimilarities = allChunks.map(item => ({
      chunk: item.chunk,
      similarity: cosineSimilarity(questionEmbedding, item.embedding),
    }));

    // Selecionar os top 3 chunks com maior similaridade
    chunkSimilarities.sort((a, b) => b.similarity - a.similarity);
    const topChunks = chunkSimilarities.slice(0, 3);
    const contextText = topChunks.map(item => item.chunk).join("\n\n");   
    console.log("CHUNKS ABAIXO")
    console.log(topChunks)        
    // 5. Preparar o prompt com o contexto reduzido
    const prompt = `Você é um analista de dados especializado em restaurantes. Utilize as informações a seguir extraídas dos documentos do restaurante para responder à pergunta com insights precisos e recomendações práticas.

Informações relevantes:
${contextText}

Pergunta: ${question}

Responda com base nas informações fornecidas. Seja direto e conciso.`;

    // 6. Enviar o prompt para o GPT-4o e obter a resposta
    const completionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Você é um analista de dados experiente." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
    });
    const answer = completionResponse.choices[0].message.content;

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Erro no processamento do chat:", error);
    return NextResponse.json({ error: "Erro no processamento do chat." }, { status: 500 });
  }
}
