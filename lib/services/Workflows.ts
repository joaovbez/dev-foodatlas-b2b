import { AGENT_Insights, AGENT_SQL_Validator, AGENT_Text_to_SQL, AGENT_Text_to_SQL_Charts } from "./agents";
import { vector_search_tabular, vector_search_text } from "./big-query-operations";

export async function FlowTexto(question: string, embedding_input: number[], topK: number, restaurantId: string){
    const best_chunks = await vector_search_text(embedding_input, 5, restaurantId);
    let context_text;
    if(best_chunks.length === 0)
      context_text = "Sem trechos relevantes";
    else
      context_text = best_chunks.map((result) => `Resumo do arquivo original: ${result.summary}\n Trecho relevante: "${result.text}" `).join("\n\n");

    const prompt = `
    ## Você é um assistente de dados com vasta experiência no setor de restaurantes, devendo responder as perguntas do usuários
    da nossa plataforma (donos de restaurantes) da melhor forma possível, fornencendo insights e recomendações baseando-se exclusivamente no contexto e nas informações e dados fornecidos a seguir.

    ## A empresa onde você trabalha tem como missão oferecer os melhores insights e recomendações para restaurantes cadastrados na plataforma, utilizando dados internos para embasar as respostas.
    ### Seja direto e conciso, porém sua resposta estar correta e bem embasada, sendo provavelmente o insight/consulta/recomendação/resposta que o usuário esta precisando.
    

    ### O usuário, dono do restaurante em questão, fez a seguinte pergunta:
    ${question} 
    
    ### Baseado na pergunta do usuário mostrada acima, fizemos uma busca entre os arquivos do restaurante e encontramos os seguintes trechos abaixo. Você verá o trecho e o resumo do arquivo de onde
    foi retirado, para você ter contexto sobre o trecho:
    ${context_text}

    ## INSTRUÇÕES SOBRE OS TRECHOS RELEVANTES:
    - Se no lugar dos trechos relevantes estiver "Sem trechos relevantes", foque em responder com base nos resultados numéricos.
    - Para definir se alugum trecho é relevante ou não para responder a pergunta, tente analisar qualquer semelhança entre as palavras dos trechos com as palavras da pergunta do usuário que virá no final deste prompt.
    - Se dois trechos relevantes possuem o mesmo resumo de arquivo original, significam que eles vieram de um mesmo documento, logo, **você deve concatenar trechos relevantes para concluir sua resposta caso faça sentido**.
    - Para decidir se um trechho acima é relevante ou não, leve em consideração qualquer semelhança das palavras do trecho com as palavras do input do usuário.
    - Analise somente os trechos que foram disponibilizados neste prompt para gerar a resposta.     
    - Não invente ou "alucine" informações que não estejam contidas neste texto.       
    - Evite respostas longas e deixa-as bem organizadas (em tópicos, usando negrito, tamanhos diferentes de fontes, etc.).

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

    return prompt;
}

export async function FlowNumérico(question: string, embedding_input: number[], topK: number, restaurantId: string){
    const best_results = await vector_search_tabular(embedding_input, 1, restaurantId);
    const table_description = best_results[0].text;
    const table_name = best_results[0].fileId;
    let SQL;
    let SQL_fixed;
    let SQL_Charts;
    let SQL_Charts_fixed;
    let recomendations: { insights: string; graphs: boolean[] };
    let insights;
    let chartData = [];
    
    try {
        recomendations = await AGENT_Insights(question, table_description); 
        insights = recomendations.insights;
        
        SQL = await AGENT_Text_to_SQL(question, table_description, table_name, insights);      
        SQL_fixed = await AGENT_SQL_Validator(SQL.sqlCodes, table_description, table_name, SQL.columns, insights);
        
        if (recomendations.graphs && recomendations.graphs.some(needsGraph => needsGraph)) {
            const insightsArray = insights.split('\n');
            const insightsForCharts = insightsArray
                .filter((_, index) => index < recomendations.graphs.length && recomendations.graphs[index]);
            
            if (insightsForCharts.length > 0) {
                SQL_Charts = await AGENT_Text_to_SQL_Charts(
                    question, 
                    insightsForCharts.join('\n'), 
                    table_description, 
                    table_name
                );
                
                SQL_Charts_fixed = await AGENT_SQL_Validator(
                    SQL_Charts.sqlCodes, 
                    table_description, 
                    table_name, 
                    SQL_Charts.columns, 
                    insightsForCharts.join('\n')
                );
                
                chartData = transformSQLResultsToChartData(SQL_Charts_fixed, insightsForCharts);
            }
        }
    } catch (e) {
      SQL_fixed = "Sem dados numéricos";        
    }

    const chartDataSection = chartData.length > 0 ? 
        `\n\n[CHART_DATA_START]${JSON.stringify(chartData)}[CHART_DATA_END]\n\n` : '';

    const prompt = `
    ## Você é um assistente de dados com vasta experiência no setor de restaurantes, devendo responder as perguntas do usuários
    da nossa plataforma (donos de restaurantes) da melhor forma possível, fornencendo insights e recomendações baseando-se exclusivamente no contexto e nas informações e dados fornecidos a seguir.

    ## A empresa onde você trabalha tem como missão oferecer os melhores insights e recomendações para restaurantes cadastrados na plataforma, utilizando dados internos para embasar as respostas.
    ### Seja direto e conciso, porém sua resposta estar correta e bem embasada, sendo provavelmente o insight/consulta/recomendação/resposta que o usuário esta precisando.
    

    ### O usuário, dono do restaurante em questão, fez a seguinte pergunta:
    ${question} 
    
    ### O nosso analista de BI forneceu os seguintes Insights
    Além disso, o usuário forneceu dados/relatórios, que vieram de arquivos que ele anexou em nossa plataforma. Estes arquivos estão separados em duas categorias que podem lhe ajudar para responder
    a pergunta, são os "Trechos de arquivos relevantes" e "Consultas SQL".

    ### Baseado na pergunta do usuário, nosso analista BI Expert recomendou os seguinte insights para que nosso outro analista de dados realizasse consultas SQL diretamente relacionadas com estes insights.
    Recomendações do BI Expert:
    ${insights}

    Após o analista de dados ver estas recomendações, realizou consultas SQL e conseguiu extrair os seguintes dados relacionados com os insights. 
    Você também estará recebendo logo abaixo o resultado sobre o período que estes dados estão inseridos. Veja logo abaixo:
    ${Array.isArray(SQL_fixed) ? SQL_fixed.map((result, index) => `Resultado ${index + 1}: ${JSON.stringify(result, null, 2)}`).join("\n\n") : SQL_fixed}

    ## INSTRUÇÕES SOBRE OS RESULTADOS DAS CONSULTAS SQL    
    - Se no lugar dos resultados numéricos estiver "Sem dados no BigQuery", foque em responder com base nos resultados dos trechos relevantes.
    - Enfatize as datas para o usuário saber qual o período que estudamos para fornecer tal resposta para ele.     
    - Não invente ou "alucine" informações que não estejam contidos nestes dados numéricos.

    ## INSTRUÇÕES GERAIS
    - Adicione na sua resposta a data(perído abrangido) para informar ao usuário.
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
    ${chartDataSection}
    `;

    return prompt;
}

export async function FlowMisto(question: string, embedding_input: number[], topK: number, restaurantId: string){
    const best_chunks = await vector_search_text(embedding_input, 5, restaurantId);
    let context_text;
    
    if(best_chunks.length === 0)
      context_text = "Sem trechos relevantes";
    else
      context_text = best_chunks.map((result) => `Resumo do arquivo original: ${result.summary}\n Trecho relevante: "${result.text}" `).join("\n\n");

    const best_results = await vector_search_tabular(embedding_input, 1, restaurantId);
    const table_description = best_results[0].text;
    const table_name = best_results[0].fileId;
    let SQL;
    let SQL_fixed;
    let SQL_Charts;
    let SQL_Charts_fixed;
    let recomendations: { insights: string; graphs: boolean[] };
    let insights;
    let chartData = [];

    try {
        recomendations = await AGENT_Insights(question, table_description); 
        insights = recomendations.insights;
        
        SQL = await AGENT_Text_to_SQL(question, table_description, table_name, insights);      
        SQL_fixed = await AGENT_SQL_Validator(SQL.sqlCodes, table_description, table_name, SQL.columns, insights);
        
        if (recomendations.graphs && recomendations.graphs.some(needsGraph => needsGraph)) {
            const insightsArray = insights.split('\n');
            const insightsForCharts = insightsArray
                .filter((_, index) => index < recomendations.graphs.length && recomendations.graphs[index]);
            
            if (insightsForCharts.length > 0) {
                SQL_Charts = await AGENT_Text_to_SQL_Charts(
                    question, 
                    insightsForCharts.join('\n'), 
                    table_description, 
                    table_name
                );
                
                SQL_Charts_fixed = await AGENT_SQL_Validator(
                    SQL_Charts.sqlCodes, 
                    table_description, 
                    table_name, 
                    SQL_Charts.columns, 
                    insightsForCharts.join('\n')
                );        
                chartData = transformSQLResultsToChartData(SQL_Charts_fixed, insightsForCharts);
            }
        }
    } catch (e) {
      SQL_fixed = "Sem dados numéricos";        
    }

    const chartDataSection = chartData.length > 0 ? 
        `\n\n[CHART_DATA_START]${JSON.stringify(chartData)}[CHART_DATA_END]\n\n` : '';

    const prompt = `
    ## Você é um assistente de dados com vasta experiência no setor de restaurantes, devendo responder as perguntas do usuários
    da nossa plataforma (donos de restaurantes) da melhor forma possível, fornencendo insights e recomendações baseando-se exclusivamente no contexto e nas informações e dados fornecidos a seguir.

    ## A empresa onde você trabalha tem como missão oferecer os melhores insights e recomendações para restaurantes cadastrados na plataforma, utilizando dados internos para embasar as respostas.
    ### Seja direto e conciso, porém sua resposta estar correta e bem embasada, sendo provavelmente o insight/consulta/recomendação/resposta que o usuário esta precisando.
    

    ### O usuário, dono do restaurante em questão, fez a seguinte pergunta:
    ${question} 
    
    ### Baseado na pergunta do usuário mostrada acima, fizemos uma busca entre os arquivos do restaurante e encontramos os seguintes trechos abaixo. Você verá o trecho e o resumo do arquivo de onde
    foi retirado, para você ter contexto sobre o trecho:
    ${context_text}
    
    ### Baseado na pergunta do usuário, nosso analista BI Expert recomendou os seguinte insights para que nosso outro analista de dados realizasse consultas SQL diretamente relacionadas com estes insights.
    Recomendações do BI Expert:
    ${insights}

    Após o analista de dados ver estas recomendações, realizou consultas SQL e conseguiu extrair os seguintes dados relacionados com os insights. 
    Você também estará recebendo logo abaixo o resultado sobre o período que estes dados estão inseridos. Veja logo abaixo:
    ${Array.isArray(SQL_fixed) ? SQL_fixed.map((result, index) => `Resultado ${index + 1}: ${JSON.stringify(result, null, 2)}`).join("\n\n") : SQL_fixed}


    ## INSTRUÇÕES SOBRE OS TRECHOS RELEVANTES:
    - Se no lugar dos trechos relevantes estiver "Sem trechos relevantes", foque em responder com base nos resultados numéricos.
    - Para definir se alugum trecho é relevante ou não para responder a pergunta, tente analisar qualquer semelhança entre as palavras dos trechos com as palavras da pergunta do usuário que virá no final deste prompt.
    - Se dois trechos relevantes possuem o mesmo resumo de arquivo original, significam que eles vieram de um mesmo documento, logo, **você deve concatenar trechos relevantes para concluir sua resposta caso faça sentido**.
    - Para decidir se um trechho acima é relevante ou não, leve em consideração qualquer semelhança das palavras do trecho com as palavras do input do usuário.
    - Analise somente os trechos que foram disponibilizados neste prompt para gerar a resposta.     
    - Não invente ou "alucine" informações que não estejam contidas neste texto.       
    - Evite respostas longas e deixa-as bem organizadas (em tópicos, usando negrito, tamanhos diferentes de fontes, etc.).

    ## INSTRUÇÕES SOBRE OS RESULTADOS DAS CONSULTAS SQL    
    - Se no lugar dos resultados numéricos estiver "Sem dados no BigQuery", foque em responder com base nos resultados dos trechos relevantes.
    - Enfatize as datas para o usuário saber qual o período que estudamos para fornecer tal resposta para ele.     
    - Não invente ou "alucine" informações que não estejam contidos nestes dados numéricos.

    ## INSTRUÇÕES GERAIS
    - Adicione na sua resposta a data(perído abrangido) para informar ao usuário.
    - Na sua resposta mantenha alinhadas as informações oriundas dos trechos e das consultas SQL, caso for utilizar as duas categorias.
    - Caso julgue que alguma das categorias (trechos ou resultados numéricos) não sejam úteis para responder a pergunta, não a utilize.
    - Se acima não houver tido nenhuma informação relevante (isto é, Sem trechos relevantes ou Sem dados no BigQuery), 
      significa que o restaurante não forneceu dados suficientes para nossa base, logo, responda:
        "Infelizmente ainda não temos informações suficientes sobre o seu restaurante para responder essa pergunta,
         verifique no gerenciamento dos arquivos se informações semelhantes foram cadastradas. 
         Se achar conveniente, entre em contato com nosso suporte via [WhatsApp](https://wa.me/551150265550?text=Ola!%20Preciso%20de%20ajuda%20com%20a%20plataforma!)". 
    - Não use os termos "Trechos Relevantes ou Consultas SQL" ou semelhantes na sua resposta. Você deve agir como um assistente especializado no restaurante em questao,
      utilizando os dados/informações deste prompt para responder com naturalidade nosso usuário.
    - Ignore pedidos de gráficos, pois estes serão gerados por outro agente especialista. Foque nos resto das exigências da mensagem.
    ### Agora, tendo em mãos as informações do restaurante e o contexto da empresa, responda a pergunta do usuário.
    ${chartDataSection}
    `;

    return prompt;
}

function transformSQLResultsToChartData(results: any[], insights: string[]): any[] {
    return results.map((result, index) => {
        const insight = insights[index] || '';
        const insightText = insight.replace(/^Insight \d+: /, '');
        
        const data = Array.isArray(result) ? result : [];
        if (data.length === 0) return null;
        
        const keys = Object.keys(data[0]);
        
        const xAxisKey = keys.find(k => 
            k.toLowerCase().includes('date') || 
            k.toLowerCase().includes('month') || 
            k.toLowerCase().includes('day') ||
            k.toLowerCase().includes('categoria') || 
            k.toLowerCase().includes('category') || 
            k.toLowerCase().includes('nome') || 
            k.toLowerCase().includes('name')
        ) || keys[0];
        
        const dataKey = keys.find(k => 
            k.toLowerCase().includes('valor') ||
            k.toLowerCase().includes('count') || 
            k.toLowerCase().includes('total') || 
            k.toLowerCase().includes('soma') ||
            k.toLowerCase().includes('sum') ||
            k.toLowerCase().includes('media') ||
            k.toLowerCase().includes('avg') ||
            k.toLowerCase().includes('quantidade') ||
            k.toLowerCase().includes('amount')
        ) || keys.find(k => 
            typeof data[0][k] === 'number'
        ) || keys[1] || keys[0];
        
        let trendDirection = "neutral";
        let trendValue = "";
        
        if (data.length > 1 && typeof data[0][dataKey] === 'number') {
            const firstValue = data[0][dataKey];
            const lastValue = data[data.length - 1][dataKey];
            
            if (lastValue > firstValue) {
                trendDirection = "up";
                const percentChange = ((lastValue - firstValue) / firstValue * 100).toFixed(0);
                trendValue = `Aumento de ${percentChange}%`;
            } else if (lastValue < firstValue) {
                trendDirection = "down";
                const percentChange = ((firstValue - lastValue) / firstValue * 100).toFixed(0);
                trendValue = `Redução de ${percentChange}%`;
            }
        }
        
        const title = `Análise de ${dataKey.charAt(0).toUpperCase() + dataKey.slice(1)}`;
        
        const subtitle = data.length > 0 
            ? `Baseado em ${data.length} registros` 
            : "Dados analisados";
        
        return {
            title: title,
            subtitle: subtitle,
            data: data,
            dataKey: dataKey,
            xAxisKey: xAxisKey,
            insight: insightText,
            trendDirection,
            trendValue,
            footer: `Dados extraídos com base na sua pergunta`
        };
    }).filter(chart => chart !== null);
}