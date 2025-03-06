// /app/api/restaurants/[id]/chat/route.ts
import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { preprocessedCache } from "./init/route"; // Certifique-se de que esse caminho esteja correto
// Função de similaridade (igual ao código atual)
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((acc, val, idx) => acc + val * vecB[idx], 0);
  const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { question } = await req.json();
    if (!question) {
      return NextResponse.json({ error: "Pergunta é obrigatória." }, { status: 400 });
    }
    const restaurantId = params.id;

    // Verifica se os dados pré-processados estão no cache
    console.log(preprocessedCache); 
    const cachedData = preprocessedCache.get(restaurantId);   
    
    if (!cachedData) {
      return NextResponse.json({ error: "Contexto não pré-processado. Por favor, inicialize o chat." }, { status: 400 });
    }
    const { allChunks } = cachedData;

    // Gerar embedding para a pergunta do usuário
    const questionEmbeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: question,
    });
    const questionEmbedding = questionEmbeddingResponse.data[0].embedding;

    // Calcular similaridade entre os chunks pré-processados e a embedding da pergunta
    const chunkSimilarities = allChunks.map(item => ({
      chunk: item.chunk,
      similarity: cosineSimilarity(questionEmbedding, item.embedding),
    }));
    // Selecionar os top 3 chunks com maior similaridade
    chunkSimilarities.sort((a, b) => b.similarity - a.similarity);
    const topChunks = chunkSimilarities.slice(0, 7);
    const contextText = topChunks.map(item => item.chunk).join("\n\n");

    // Compor o prompt final
    const prompt = `Você é um analista de dados especializado em restaurantes. Utilize as informações a seguir para 
                    responder à pergunta com insights precisos e recomendações práticas.

                    Informações relevantes:
                    ${contextText}

                    Pergunta: ${question}

                    Responda a pergunta com base nos dados fornecidos. Realize cálculos e enfatize os períodos (datas), mas sem mostrar, e retorne números relevantes para fortalecer os insight.
                    e pontos importantes. Apesar da resposta bem embasada e com justificativa correta (clara e conscisa), ela não pode ser
                    muito longa, sempre que possível seja direto ao ponto.
                    
                    Use como base esse exemplo de pergunta e resposta (inclusive a formatação MarkDown, deixei os títúlos em fonte maior na resposta): 
                    Qual produto poderia ser retirado do cardápio por baixo desempenho?
                    
                    ## Análise
                    ### Analisando os pedidos de *02/06/2025 até o momento*, a *Lasanha* poderia ser retirada do cardápio por baixo desempenho.
                    - A Lasanha foi vendida apenas 14 vezes, enquanto os demais produtos apresentaram uma média de cerca de 30 vendas.
                    - Além disso, geralmente ela não é acompanhada de bebidas ou outros itens em 65% dos pedidos, atraindo menos receita.

                    ## Solução Alternativa
                    Uma solução viável poderia ser a criação de promoções de combos com este produto e outros itens.
                 
`;

    // Iniciar a chamada com streaming, passando stream: true
    const streamResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é um analista de dados experiente." },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      stream: true,
    });

    // Criar um ReadableStream para iterar sobre os chunks da resposta
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Supondo que streamResponse seja um async iterable de tokens/chunks
        for await (const chunk of streamResponse) {
          // Cada chunk pode ter a estrutura: { choices: [ { delta: { content: string } } ] }
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