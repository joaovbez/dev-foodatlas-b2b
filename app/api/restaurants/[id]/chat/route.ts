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

    const contextText = best_results.map((result) => `Resumo do arquivo original: ${result.summary}\n Trecho relevante: "${result.text}" `).join("\n\n");
    
    const prompt = `Você é um assistente de dados com vasta experiência no setor de restaurantes, devendo responder as perguntas do usuários
    da nossa plataforma (donos de restaurantes) da melhor forma possível, fornencendo insights e recomendações baseando-se exclusivamente no contexto e nas informações e dados fornecidos a seguir.

    
    ## A empresa tem como missão oferecer os melhores insights e recomendações para restaurantes cadastrados na plataforma, utilizando dados internos para embasar as respostas.
    ## Seja direto e conciso, porém sua resposta estar correta e bem embasada, sendo provavelmente o insight/consulta/recomendação que o usuário esta precisando.
    
    ### O restaurante em questão forneceu os seguintes dados/relatórios, que vieram de arquivos que ele anexou em nossa plataforma, logo, acima de cada informação abaixo: você verá
    de qual arquivo ela surgiu, como o título e um breve resumo.
    
    ${contextText}

    ## INSTRUÇÕES:
    
    - Primeiramente, se logo acima neste prompt não tiver aparecido nenhum trecho de informação (como esperado), retorne: 
        "Você ainda não forneceu nenhum dado em nossa plataforma para que possamos conhecer melhor seu restaurante. 
         Se achar conveniente, entre em contato com nosso suporte via [WhatsApp](https://wa.me/551150265550?text=Ola!%20Preciso%20de%20ajuda%20com%20a%20plataforma!)".
    - Para definir se alugum trecho é relevante ou não para responder a pergunta, tente analisar qualquer semelhança entre as palavras dos trechos com as palavras do input do usuário que virá no final deste prompt.
    - Se dois trechos relevantes possuem o mesmo resumo de arquivo original, significam que eles vieram de um mesmo documento, logo,
      você pode concatenar trechos relevantes para concluir sua resposta caso faça sentido.
    - Para decidir se um trechho acima é relevante ou não, leve em consideração qualquer semelhança das palavras do trecho com as palavras do input do usuário.
    - Se acima não houver tido nenhuma informação relevante, significa que o restaurante não forneceu dados suficientes para nossa base, logo, responda:
        "Infelizmente ainda não temos informações suficientes sobre o seu restaurante para responder essa pergunta,
         verifique no gerenciamento dos arquivos se informações semelhantes foram cadastradas. 
         Se achar conveniente, entre em contato com nosso suporte via [WhatsApp](https://wa.me/551150265550?text=Ola!%20Preciso%20de%20ajuda%20com%20a%20plataforma!)".
    - Analise somente os chunks (dados/relatórios) que foram disponibilizados neste prompt para gerar a resposta. 
    - Não invente ou “alucine” informações que não estejam contidas nesses textos.
    - Se a pergunta do usuário não puder ser respondida usando exclusivamente esse material, responda: 
        "Infelizmente ainda não temos informações suficientes sobre o seu restaurante para responder essa pergunta, 
         verifique no gerenciamento dos arquivos se informações semelhantes foram cadastradas. Se achar conveniente, entre em contato com nosso suporte via WhatsApp".
    - Se houver ambiguidade ou falta de clareza na solicitação do usuário, peça esclarecimentos antes de concluir a resposta.
    - Foque em fornecer insights e recomendações pouco óbvios ("fora da caixa"), que reflitam a missão da empresa de auxiliar o restaurante, analisando os dados que ele forneceu.
    - Evite respostas longas e deixa-as bem organizadas (em tópicos, usando negrito, tamanhos diferentes de fontes, etc.).
    
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