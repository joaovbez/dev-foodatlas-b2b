// /app/api/restaurants/[id]/chat/route.ts
import { NextResponse } from "next/server";
import { generateEmbedding, generateResponse } from "@/lib/services/openAI";
import { vector_search } from "@/lib/services/big-query";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { question } = await req.json();
    if (!question) {
      return NextResponse.json({ error: "Pergunta é obrigatória." }, { status: 400 });
    }
    const restaurantId = params.id;

    const embedding_input = await generateEmbedding(question);

    console.log("Começando Busca semantica");
    const best_results = await vector_search(embedding_input, 5, restaurantId);
    console.log('Busca semantica concluida');

    const contextText = best_results.map((result) => `Resumo do arquivo: ${result.summary}\n\n${result.text}`).join("\n\n");
    const summarys = best_results.map((result) => result.summary);
    console.log(summarys);
    const prompt = `Você é um assistente que deve responder baseando-se exclusivamente no contexto e nas informações e dados fornecidos a seguir.

    ## A empresa tem como missão oferecer os melhores insights e recomendações para restaurantes cadastrados na plataforma, utilizando dados internos para embasar as respostas.
    
    ### O restaurante em questão forneceu os seguintes dados/relatórios, que vieram de arquivos que ele anexou em nossa plataforma, logo, acima de cada informação abaixo: você verá
    de qual arquivo ela surgiu, como o título e um breve resumo.
    
    ${contextText}

    ## INSTRUÇÕES:
    
    - Se acima não houver tido nenhuma informação relevante, significa que o restaurante não forneceu dados suficientes para nossa base, logo, responda:
        "Infelizmente ainda não temos informações suficientes sobre o seu restaurante para responder essa pergunta, 
         verifique no gerenciamento dos arquivos se informações semelhantes foram cadastradas. Se achar conveniente, entre em contato com nosso suporte via WhatsApp".

    - Analise somente os chunks (dados/relatórios) que foram disponibilizados neste prompt para gerar a resposta. 

    - Não invente ou “alucine” informações que não estejam contidas nesses textos.

    - Se a pergunta do usuário não puder ser respondida usando exclusivamente esse material, responda: 
        "Infelizmente ainda não temos informações suficientes sobre o seu restaurante para responder essa pergunta, 
         verifique no gerenciamento dos arquivos se informações semelhantes foram cadastradas. Se achar conveniente, entre em contato com nosso suporte via WhatsApp".

    - Se houver ambiguidade ou falta de clareza na solicitação do usuário, peça esclarecimentos antes de concluir a resposta.

    - Foque em fornecer insights e recomendações que reflitam a missão da empresa de auxiliar o restaurante, analisando os dados que ele forneceu.
    
    ### Agora, tendo em mãos as informações do restaurante e o contexto da empresa, responda à seguinte pergunta:
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