const { BigQuery } = require('@google-cloud/bigquery');
import { generateEmbedding, generateIntention, generateResponseCSV, generateResponseFinal } from "./openAI";

const bigquery = new BigQuery({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: {
      client_email: process.env.GBQ_CLIENT_EMAIL,
      private_key: process.env.GBQ_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  });

export async function IntentionClassifier(user_input: string): Promise<string> {

const prompt_intention = ` 
# Vocês é um assistente especializado em classificação de intenção de textos no setor de negócios, principalmente no ramo alimentício (restaurantes).  
## Contexto: Queremos entender a melhor forma de responder os clientes, sejam com apenas respostas textuais, cálculos numéricos ou visualmente com gráficos.
## Tarefa: Classificar a intenção da pergunta do usuário (que está no final deste prompt) baseado nas categorias que serão fornecidas nas instruções a seguir.
  
### INSTRUÇÕES:  
- Você deve classificar a pergunta do usuário dentre apenas as 2 categorias abaixo:
    - texto: O usuário quer explicações descritivas ou conceituais, ou seja, podemos responder apenas consultando os arquivos textuais que ele nos forneceu.    
    - numérico: O usuário quer uma explicação que exigem essencialmente cálculos envolvendo números como lucro, vendas, custo, etc. Neste tipo de pergunta geralmente gráficos auxiliam na melhor resposta para o cliente.
    - misto: O usuário quer uma pergunta que vale a pena tanto consultas aos arquivos textuais quanto aos arquivos numéricos para responder melhor a pergunta dele.

- Os arquivos textuais que temos dos restaurantes também possuem dados numéricos, por isso é importante entender se a informação de cunho numérico que o usuário pode desejar exige algum cálculo ou pode apenas
  ser consultada em arquivos textuais.
- Você deve retornar apenas, e nada mais, uma das 3 categorias acima, sem outras informações adicional, sem adicionar qualquer outra coisa ao texto de resposta.
- Caso você não saiba decidir entre número e texto, retorne "misto".

### Exemplos de pergunta e resposta:
    Pergunta: "Qual a receita da nossa Lasanha a Bolonhesa?"
    Resposta: "texto"
  
    Pergunta: " Quais ingredientes fazem a nossa Carbonara?"
    Resposta: "texto"
  
    Pergunta: "Qual o melhor horário de vendas do meu restaurante em 2022?"
    Resposta: "numérico"
  
    Pergunta: "Qual a porcentagem de pagamentos recebidos por Cartão de Crédito em 2022?"
    Resposta: "numérico"
    
    Pergunta: "Qual o ticket médio do meu restaurante em 2022?"  
    Resposta: "numérico"
  
    Pergunta: "Qual o custo da minha Lasanha a Bolonhesa?"  
    Resposta: "texto"
  
    Pergunta: "Como posso otimizar minhas vendas no período noturno?"
    Resposta: "numérico": 
    
    Dadas essas instruções, faça a classificação da seguinte pergunta do usuário:
 ${user_input}`;

 const response = await generateIntention(prompt_intention);
 return response;
}
export async function AGENT_Insights(query: string, tableInfo: string) {
    console.log("Agente de Insights em ação");
    const prompt = `
    # Você é um especialista em Business Intelligence e Análise de Dados para os diversos setores de restaurantes.
    
    ## Seu perfil e habilidades são:
    - Analista sênior com profundo conhecimento do mercado de food service e restaurantes.
    - Expertise em KPIs do setor gastronômico, gestão de restaurantes e comportamento do consumidor.
    - Capacidade de identificar insights que não são óbvios e descobrir oportunidades de otimização.
    - Foco em análises que aumentam receita, reduzem custos e melhoram experiência do cliente.
    
    ## Tarefa 1: Construção de Insights
    Baseado na pergunta do usuário e na descrição da seguinte tabela (que está disponível para posterior análise), forneça de 3 insights valiosos e específicos para o contexto da pergunta do usuário.
    O Insight 1 deverá ser exatamente para responder a pergunta do usuário diretamente.
    A sua resposta será passada para um analista de dados que irá realizar consultas SQL com intuito de extrair/calcular os valores relacionados com os insights que você fornecer.
    Logo, procure em sua resposta fornecer os insights com instruções sobre como utilizar as colunas da tabela.
    
    ## Tarefa 2: Avaliar Necessidade de uma visualização de gráficos.
    Se o usuário incluir na pergunta que deseja ver um gráfico, escolha qual insight (no máximo 1) seria o melhor para fornecer os dados para o gráfico
    

    ### Informações da Tabela (resumo, descrição das colunas e linhas exemplares da tabela)    
    ${tableInfo}
    
    ### A pergunta do usuário é esta abaixo:
    "${query}"
    
    ## Você deve seguir as seguintes diretrizes para os Insights:
    - Seja específico e acionável: forneça insights que o gestor possa transformar em ações concretas.
    - Pense fora da caixa: vá além da análise superficial e ofereça observações não óbvias.
    - Considere diferentes áreas: vendas, estoque, funcionários, clientes, sazonalidade, tempo de espera, etc.
    - Conecte dados com estratégia: perceba como os padrões identificados impactam o negócio.
    - Baseie-se em práticas do setor: considere benchmarks e melhores práticas da indústria.
    - **NÃO FORNEÇA INSIGHTS ALEATÓRIOS, BUSQUE ESPECIFICAR NO CONTEXTO DA PERGUNTA DO USUÁRIO**.

    ## [Muito Importante] Você deve seguir as seguintes diretrizes para avaliar a necessidade de gráficos:    
    - A princípio, procure não indicar gráficos.**APENAS** se o usuário solicitar você irá indicar.
    - Caso o usuário solicite, obedecas estas regras:
        - Apenas 1 insight deverá conter conteúdo gráfico.
        - Escolha o insight que está mais diretamente ligado a pergunta do usuário.


    ## Áreas de Insights a Considerar:
    - Otimização de menu e precificação
    - Tendências de vendas e comportamento do consumidor
    - Eficiência operacional e gestão de tempo
    - Desempenho da equipe e alocação de pessoal
    - Gestão de estoque e redução de desperdício
    - Estratégias de marketing e fidelização
    - Análise de lucratividade por produto/categoria
    - Padrões de sazonalidade e momentos de pico
    
    ## Formato de Resposta
    Forneça exatamente o seguinte formato, sem texto introdutório ou conclusivo:
    
    {
        "insights": [
            {
                "content": "Insight 1: [Insight detalhado e acionável, com as colunas da tabela para o analista de dados conseguir consultar/calcular com SQL]",
                "needsGraph": true ou false
            },
            {
                "content": "Insight 2: [Insight detalhado e acionável, com as colunas da tabela para o analista de dados conseguir consultar/calcular com SQL]",
                "needsGraph": true ou false
            },
            {
                "content": "Insight 3: [Insight detalhado e acionável, com as colunas da tabela para o analista de dados conseguir consultar/calcular com SQL]",
                "needsGraph": true ou false
            }
        ]
    }
    `;
    
    interface InsightItem {
        content: string;
        needsGraph: boolean;
    }
    
    interface InsightResponse {
        insights: InsightItem[];
    }
    
    const responseText = await generateResponseCSV(prompt);
    
    try {
        // Parse the JSON response
        const parsedResponse = JSON.parse(responseText) as InsightResponse;
        const insightContents = parsedResponse.insights.map(insight => insight.content).join('\n');
        const graphs = parsedResponse.insights.map(insight => insight.needsGraph);
        
        return { insights: insightContents, graphs };
    } catch (error) {
        console.error("Failed to parse insights JSON:", error);
        // Fallback to returning raw text if parsing fails
        return { insights: responseText, graphs: [false, false, false] };
    }
}

export async function AGENT_Text_to_SQL(query: string, tableInfo: string, tableName: string, insights: string) {
    console.log("Agente de SQL padrão em ação.");
    const datasetId = process.env.GOOGLE_DATASET_SQL;       
    const tableId = tableName;
    const [tableMetadata] = await bigquery
      .dataset(datasetId)
      .table(tableId)
      .getMetadata();
    
    const columns = tableMetadata.schema.fields.map((column: { name: string; type: string }) => ({ name: column.name, type: column.type }));

    const prompt = `
    # Você é um especialista analista de dados para restaurantes de todos os tipos e com vasta experiência com todos dados comuns deste setor. 
    Você receberá a pergunta de um usuário, insights específicos sugeridos por um especialista e informações de uma tabela relevante.
    
    ## Tarefa
    Seu objetivo é construir consultas SQL que **explorem cada um dos insights** fornecidos pelo especialista em BI.
    
    
    ### Pergunta do usuário:
    "${query}"

    ### Informações da Tabela
    - Endereço no BigQuery: 'foodatlas-442513.foodatlas_bucket.${tableName}'
    ${tableInfo}
    - As colunas descritas e exemplificadas anteriormente possuem esses tipos:
    ${JSON.stringify(columns)}
    
    ### Insights Sugeridos [IMPORTANTE]
    Um especialista em BI sugeriu os seguintes insights que você DEVE EXPLORAR E VALIDAR NA SUA CONSULTA SQL:
    ${insights}
    
    ## Instruções OBRIGATÓRIAS para construir sua consulta SQL:    
    - Caso a coluna que você vá utilizar seja de um tipo não numérico, use a função CAST para transformá-la em numérico.
    - CONSTRUA SUA CONSULTA PARA VALIDAR ESPECIFICAMENTE OS INSIGHTS FORNECIDOS.
    - Analise as colunas mencionadas nos insights e utilize-as em sua consulta.
    - Use a sintaxe padrão e correta do SQL, sem absolutamente nenhum erro.
    - Para se referir aos nomes de todas as colunas no código SQL, use as crases da mesma forma que usa para se referir quando usa FROM.
    - Use funções de agregação quando necessário (COUNT, SUM, AVG, etc.) para quantificar cada insight.
    - Use GROUP BY e HAVING conforme apropriado para segmentar e filtrar conforme os insights.
    - Use ORDER e LIMIT 10 quando for consultas que retornem muitos valores, pois assim captamos apenas os mais importantes.
    - Certifique-se de que a consulta produza resultados que confirmem ou refutem diretamente os insights sugeridos.
    - Use LIMIT 10 sempre.
    - Não alucine ou invente informações.
    - Cuidado para não colocar aspas onde não deve, por exemplo após o uso de AS, não coloque aspas.    

    ## PERÍODO ESTUDADO
    Devemos fornecer o período estudao para obter estes dados e resultados das consultas SQL. Para isto, construa uma consulta SQL que busque em colunas envolvendo datas para coletar o período (meses ou ano)

    ## FORMATO DE RESPOSTA OBRIGATÓRIO
    Para cada insight, forneça o código SQL seguindo RIGOROSAMENTE este formato:
    
    [INICIO_INSIGHT_1]
    <código SQL completo para o insight 1>
    [FIM_INSIGHT_1]
    
    [INICIO_INSIGHT_2]
    <código SQL completo para o insight 2>
    [FIM_INSIGHT_2]
    
    [INICIO_INSIGHT_3]
    <código SQL completo para o insight 3>
    [FIM_INSIGHT_3]
    
    [INICIO_CONSULTA_PERIODO]
    <código SQL completo para obter o período estudado>
    [FIM_CONSULTA_PERIODO]
    
    Não inclua nenhum texto adicional nem explicações fora dos marcadores de início e fim.
    `;
    
    const fullText = await generateResponseCSV(prompt);        

    // Extrair códigos SQL usando expressões regulares com marcadores específicos
    const sqlCodes = fullText.match(/\[INICIO_INSIGHT_\d+\]([\s\S]*?)\[FIM_INSIGHT_\d+\]/g)?.map(match => match.replace(/\[INICIO_INSIGHT_\d+\]|\[FIM_INSIGHT_\d+\]/g, '').trim()) || [];
    
    const periodQueryMatch = fullText.match(/\[INICIO_CONSULTA_PERIODO\]([\s\S]*?)\[FIM_CONSULTA_PERIODO\]/);
    if (periodQueryMatch && periodQueryMatch[1]) {
        sqlCodes.push(periodQueryMatch[1].trim());
    }

    return { sqlCodes, columns };
}

export async function AGENT_Text_to_SQL_Charts(query: string, insights: string, tableInfo: string, tableName: string) {
  console.log("Agente de Gráfico em ação.");
  const datasetId = process.env.GOOGLE_DATASET_SQL;       
  const tableId = tableName;
  const [tableMetadata] = await bigquery
    .dataset(datasetId)
    .table(tableId)
    .getMetadata();
  
  const columns = tableMetadata.schema.fields.map((column: { name: string; type: string }) => ({ name: column.name, type: column.type }));

  const prompt = `
  # Você é um especialista analista de dados para restaurantes, com foco em visualização de dados.
  Você receberá a pergunta de um usuário, insights específicos que REQUEREM VISUALIZAÇÃO GRÁFICA, e informações de uma tabela relevante.
  
  ## Tarefa
  Seu objetivo é construir consultas SQL que gerem dados adequados para visualização em gráficos de barras explorando os insights fornecidos.
  
  ### Pergunta do usuário:
  "${query}"

  ### Informações da Tabela
  - Endereço no BigQuery: 'foodatlas-442513.foodatlas_bucket.${tableName}'
  ${tableInfo}
  - As colunas descritas e exemplificadas anteriormente possuem esses tipos:
  ${JSON.stringify(columns)}

  ### Insights que Precisam de Visualização
  ${insights}
  
  ## Instruções OBRIGATÓRIAS para construir sua consulta SQL:    
  - Não forneça consultas SQL que retornem valores únicos. Afinal, os gráficos servem para comparar diferentes categorias.
  - OTIMIZAÇÃO PARA VISUALIZAÇÃO: As consultas devem ser otimizadas para gerar dados que possam ser facilmente visualizados em gráficos.
  - ESTRUTURA DE DADOS: Os resultados devem ter uma coluna para o eixo X (geralmente categorias, datas, períodos) e outra para valores numéricos.
  - ORDENAÇÃO: Resultados devem usar ORDER BY para apresentar dados em ordem lógica para visualização.
  - LIMITAÇÃO: Use LIMIT quando apropriado para evitar gráficos sobrecarregados faça LIMIT 7.
  - NOMES CLAROS: Use aliases (AS) para dar nomes claros às colunas que serão usadas nos gráficos.
  - AGREGAÇÃO: Use funções de agregação quando apropriado (SUM, AVG, COUNT) para dados que façam sentido em gráficos.
  - Garanta que o resultado final será adequado para visualização em um gráfico de barras.
  - Use GROUP BY para categorizar dados adequadamente.
  - Caso a coluna seja de um tipo não numérico que precise ser exibida como valor, use CAST para transformá-la.
  - Use a sintaxe padrão e correta do SQL, sem absolutamente nenhum erro.
  - Para se referir aos nomes de todas as colunas no código SQL, use as craves.
  
  ## FORMATO DE RESPOSTA OBRIGATÓRIO
  Para cada insight, forneça o código SQL seguindo RIGOROSAMENTE este formato:
  
  [INICIO_CHART_SQL_1]
  <código SQL completo otimizado para visualização>
  [FIM_CHART_SQL_1]
  
  [INICIO_CHART_SQL_2]
  <código SQL completo otimizado para visualização>
  [FIM_CHART_SQL_2]
  
  [INICIO_CHART_SQL_3]
  <código SQL completo otimizado para visualização>
  [FIM_CHART_SQL_3]
  
  Não inclua nenhum texto adicional nem explicações fora dos marcadores de início e fim.
  `;
  
  const fullText = await generateResponseCSV(prompt);
  
  // Extrair códigos SQL usando expressões regulares com marcadores específicos
  const sqlCodes = fullText.match(/\[INICIO_CHART_SQL_\d+\]([\s\S]*?)\[FIM_CHART_SQL_\d+\]/g)?.map(match => 
    match.replace(/\[INICIO_CHART_SQL_\d+\]|\[FIM_CHART_SQL_\d+\]/g, '').trim()
  ) || [];
  console.log(sqlCodes);
  return { sqlCodes, columns };
}

export async function AGENT_SQL_Validator(sqlQueries: string[], tableInfo: string, tableName: string, columns: string, insights: string) {
    let results = [];
    console.log("Agente SQL_Validator em ação.");
    for (let sqlQuery of sqlQueries) {
        let attempt = 0; // Counter for attempts
        let rows;

        while (attempt < 2) { // Try to correct the query up to 2 times
            try {        
                [rows] = await bigquery.query(sqlQuery);        
                results.push(rows); // Add results to the array
                break; // Exit the loop if successful
            } catch (error) {
                // Se a consulta falhar, tenta corrigir
                const errorMessage = (error as Error).message;
                
                const fixPrompt = `
                Você é um especialista em depuração de SQL para BigQuery.
                
                # O objetivo original era extrair os seguinte insights:
                ${insights}
                
                # Informações da Tabela
                - Endereço no BigQuery: 'foodatlas-442513.foodatlas_bucket.${tableName}'
                - Descrição da tabela:
                ${tableInfo}

                # O SCHEMA da tabela é o seguinte: 
                ${columns}

                # Consulta Com Erro
                \`\`\`sql
                ${sqlQuery}
                \`\`\`

                # Erro Retornado
                \`\`\`
                ${errorMessage}
                \`\`\`
                
                # Tarefa
                Corrija a consulta SQL para resolver o erro. Analise cuidadosamente a mensagem de erro e ajuste a consulta.
                Retorne APENAS a consulta SQL corrigida sem explicações ou comentários adicionais.

                ## Erros comuns que podem ser consertados:
                - Tratar colunas STRING como numéricas: Use CAST para transformá-las em numéricas.
                - Caracteres Ilegais: Troque por outros caracteres que sejam compatíveis com o SQL. Por exemplo, o uso de "ç" gera este erro.                
                `;

                const fixedQuery = await generateResponseCSV(fixPrompt);
                console.log(errorMessage);
                sqlQuery = fixedQuery.replace(/```sql|```/g, ''); 
                attempt++; 
            }
        }
    }
    console.log(results);
    return results; // Return all results from the executed queries
}


