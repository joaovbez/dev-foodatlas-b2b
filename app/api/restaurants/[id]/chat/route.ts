// /app/api/restaurants/[id]/chat/route.ts
import { NextResponse } from "next/server";
import { generateEmbedding, generateResponse } from "@/lib/services/openAI";
import { vector_search } from "@/lib/services/big-query";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { question } = await req.json();
    if (!question) {
      return NextResponse.json({ error: "Pergunta é obrigatória." }, { status: 400 });
    }
    
    // Geração do embedding e busca vetorial
    const embedding_input = await generateEmbedding(question);
    const best_results = await vector_search(embedding_input, 5, id);
    
    const contextText = best_results
      .map((result) => `Resumo do arquivo original: ${result.summary}\n\n Trecho relevante: "${result.text}" `)
      .join("\n\n");
    
    const prompt = `Você é um assistente de dados com vasta experiência no setor de restaurantes, devendo responder as perguntas dos usuários da nossa plataforma (donos de restaurantes) da melhor forma possível, fornecendo insights e recomendações baseando-se exclusivamente no contexto e nas informações fornecidas a seguir.

    ## Dados do restaurante:
    ${contextText}
    
    Agora, responda à seguinte pergunta:
    "${question}"`;
    
    const streamResponse = await generateResponse(prompt);
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of streamResponse) {
          const content = chunk.choices[0].delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      },
    });
    
    return new NextResponse(stream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Erro no endpoint de chat:", error);
    return NextResponse.json({ error: "Erro no processamento do chat." }, { status: 500 });
  }
}