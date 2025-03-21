// /app/api/restaurants/[id]/chat/route.ts
import { NextResponse } from "next/server";
import { generateEmbedding, generateResponse, IntentionClassifier } from "@/lib/services/openAI";
import { vector_search_tabular, vector_search_text } from "@/lib/services/big-query-operations";
import { AGENT_Text_to_SQL } from "@/lib/services/agents";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { question } = await req.json();
    if (!question) {
      return NextResponse.json({ error: "Pergunta é obrigatória." }, { status: 400 });
    }
  
    const restaurantId = params.id;

    const embedding_input = await generateEmbedding(question);

    const best_chunks = await vector_search_text(embedding_input, 5, restaurantId);
    let context_text;
    if(best_chunks.length === 0)
      context_text = best_chunks.map((result) => `Resumo do arquivo original: ${result.summary}\n Trecho relevante: "${result.text}" `).join("\n\n");      
    else
      context_text = "Sem trechos relevantes";

    const best_results = await vector_search_tabular(embedding_input, 1, restaurantId);
    const table_description = best_results[0].text;
    const table_name = best_results[0].fileId;
    let context_SQL;

    try {
      context_SQL = await AGENT_Text_to_SQL(question, table_description, table_name);      
    } catch (e) {
      context_SQL = "Sem dados no BigQuery";        
    }
   
       
    const prompt =`
    ## Você é um assistente de dados com vasta experiência no setor de restaurantes, devendo responder as perguntas do usuários
    da nossa plataforma (donos de restaurantes) da melhor forma possível, fornencendo insights e recomendações baseando-se exclusivamente no contexto e nas informações e dados fornecidos a seguir.

    ## A empresa onde você trabalha tem como missão oferecer os melhores insights e recomendações para restaurantes cadastrados na plataforma, utilizando dados internos para embasar as respostas.
    ### Seja direto e conciso, porém sua resposta estar correta e bem embasada, sendo provavelmente o insight/consulta/recomendação/resposta que o usuário esta precisando.
    

    ### O usuário, dono do restaurante em questão, fez a seguinte pergunta:
    ${question} 
    
    Além disso, o usuário forneceu dados/relatórios, que vieram de arquivos que ele anexou em nossa plataforma. Estes arquivos estão separados em duas categorias que podem lhe ajudar para responder
    a pergunta, são os "Trechos de arquivos relevantes" e "Consultas SQL".

    ### Baseado na pergunta do usuário mostrada acima, fizemos uma busca entre os arquivos do restaurante e encontramos os seguintes trechos abaixo. Você verá o trecho e o resumo do arquivo de onde
    foi retirado, para você ter contexto sobre o trecho:
    ${context_text}
    
    ### Baseado também na pergunta do usuário, realizamos consultas SQL direto de tabelas que o restaurante nos forneceu e obtemos as seguintes respostas abaixo, que serão também informações que deverão
    ser usadas para respondê-lo:
    ${JSON.stringify(context_SQL)}


    ## INSTRUÇÕES SOBRE OS TRECHOS RELEVANTES:
    - Se no lugar dos trechos relevantes estiver "Sem trechos relevantes", foque em responder com base nos resultados numéricos.
    - Para definir se alugum trecho é relevante ou não para responder a pergunta, tente analisar qualquer semelhança entre as palavras dos trechos com as palavras da pergunta do usuário que virá no final deste prompt.
    - Se dois trechos relevantes possuem o mesmo resumo de arquivo original, significam que eles vieram de um mesmo documento, logo, **você deve concatenar trechos relevantes para concluir sua resposta caso faça sentido**.
    - Para decidir se um trechho acima é relevante ou não, leve em consideração qualquer semelhança das palavras do trecho com as palavras do input do usuário.
    - Analise somente os trechos que foram disponibilizados neste prompt para gerar a resposta.     
    - Não invente ou “alucine” informações que não estejam contidas neste texto.       
    - Evite respostas longas e deixa-as bem organizadas (em tópicos, usando negrito, tamanhos diferentes de fontes, etc.).

    ## INSTRUÇÕES SOBRE AS CONSULTAS SQL    
    - Se no lugar dos resultados numéricos estiver "Sem dados no BigQuery", foque em responder com base nos resultados dos trechos relevantes.
    - Enfatize as datas para o usuário saber qual o período que estudamos para fornecer tal resposta para ele.    
    - Não invente ou "alucine" informações que não estejam contidas nestes dados numéricos.

    ## INSTRUÇÕES GERAIS
    - Na sua resposta mantenha alinhadas as informações oriundas dos trechos e das consultas SQL, caso for utilizar as duas categorias.
    - Caso julgue que alguma das categorias (trechos ou resultados numéricos) não sejam úteis para responder a pergunta, não a utilize.
    - Se acima não houver tido nenhuma informação relevante (isto é, Sem trechos relevantes ou Sem dados no BigQuery), 
      significa que o restaurante não forneceu dados suficientes para nossa base, logo, responda:
        "Infelizmente ainda não temos informações suficientes sobre o seu restaurante para responder essa pergunta,
         verifique no gerenciamento dos arquivos se informações semelhantes foram cadastradas. 
         Se achar conveniente, entre em contato com nosso suporte via [WhatsApp](https://wa.me/551150265550?text=Ola!%20Preciso%20de%20ajuda%20com%20a%20plataforma!)". 
    - Não use os termos "Trechos Relevantes ou Consultas SQL" ou semelhantes na sua resposta. Você deve agir como um assistente especializado no restaurante em questao,
      utilizando os dados/informações deste prompt para responder com naturalidade nosso usuário.
    ### Agora, tendo em mãos as informações do restaurante e o contexto da empresa, responda a pergunta do usuário.
    `;         

    const streamResponse = await generateResponse(prompt);

    console.log(context_SQL);
    console.log(context_text);
    
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