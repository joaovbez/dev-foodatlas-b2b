const { BigQuery } = require('@google-cloud/bigquery');
const { HarmBlockThreshold, HarmCategory, VertexAI } = require('@google-cloud/vertexai');
import { AGENTES_CORPUS } from "./openAI";

const bigquery = new BigQuery({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: {
      client_email: process.env.GBQ_CLIENT_EMAIL,
      private_key: process.env.GBQ_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  });

/**
 * Constrói uma consulta SQL com base na entrada do usuário e informações da tabela
 */
export async function AGENT_Text_to_SQL(query: string, tableInfo: string, table_name: string) {
    const prompt = `
    # Você é um especialista analista de dados para restaurantes de todos os tipos e com vasta experiência com todos dados comuns deste setor. 
    ## Tarefa
    Sua tarefa principal consiste em fornecer consultas em SQL para o BigQuery das tabelas do restaurante de um usuário baseadas exclusivamente na solicitação do usuário e nas informações da tabela.
    Logo abaixo você verá as informações da tabela e no final deste texto você verá a pergunta do usuário.

    ### Informações da Tabela
    - Endereço no BigQuery: 'foodatlas-442513.foodatlas_bucket.${table_name}'
    ${tableInfo}

    
    
    ## Instruções para construir sua consulta SQL:
    - Use a sintaxe padrão e correta do SQL, sem absolutamente nenhum erro.
    - Para se referir aos nomes da colunas no código SQL, use as crases da mesma forma que usa para se referir quando usa FROM.       
    - Inclua apenas as colunas relevantes para a pergunta (a data é importante sempre que estiver disponível). Use os nomes de colunas citados nas informações da tabela.
      e use suas descrições para saber qual utilizar.
    - Use funções de agregação quando necessário (COUNT, SUM, AVG, etc.) para além de responder o usuário, fornecer insights valiosos para seu restaurante.
    - Apenas caso não exista nenhuma coluna que mencione datas na tabela, não invente nem inclua datas na consulta. 
    - Use GROUP BY e HAVING conforme apropriado.    
    - Certifique-se de que a consulta seja eficiente e sejá útil para o usuário. Além de responder de forma direta a pergunta do usuário, busque insights em outras colunas.
    - Não alucine ou invente informações.
    - Cuidado para não colocar aspas onde não deve, por exemplo após o uso de AS, não coloque aspas.    

    ## **Retorne APENAS a consulta SQL sem nenhuma instrução, explicações ou comentários adicionais.**

    Agora com estas instruções fornecidas, gere uma consulta SQL que retorne valores úteis para a seguinte exigência do usuário:
    "${query}"
    `;
    
    const fullText = await AGENTES_CORPUS(prompt);        

    const regex = /```sql\s*([\s\S]*?)\s*```/;
    const match = fullText.match(regex);
    const sqlCode = match ? match[1].trim() : fullText;
    console.log("codigo sql abaixo:");
    console.log(sqlCode);
    const [rows] = await bigquery.query(sqlCode);
    return rows;
}

/**
 * Valida e refina a consulta SQL
 */
// export async function AGENT_SQL_Validator(sqlQuery: string, tableInfo: string) {
//     try {
//         console.log("Consulta Iniciada");
//         const [rows] = await bigquery.query(sqlQuery);
//         console.log("Consulta Realizada");
//         const results = rows; // Retornar todos os resultados da consulta SQL gerada
        

//         const optimizationPrompt = `
//         Você é um especialista analista de dados para restaurantes de todos os tipos e com vasta experiência com todos dados comuns deste setor. 
//         Sua tarefa principal é analisar e otimizar consultas SQL que foram geradas por outro agente, para ver se ela é eficiente e responde adequadamente à necessidade do usuário.

//         # Consulta Original
//         \`\`\`sql
//         ${sqlQuery}
//         \`\`\`

//         # Resultados Obtidos (primeiras linhas)
//         \`\`\`
//         ${JSON.stringify(results.slice(0, 5), null, 2)}
//         \`\`\`

//         # Tarefa
//         Avalie se esta consulta é eficiente e responde adequadamente à necessidade. Se necessário, otimize a consulta.

//         Critérios de avaliação:
//         1. A consulta seleciona apenas as colunas necessárias?
//         2. Os filtros estão aplicados corretamente?
//         3. As junções (se houver) são eficientes?
//         4. A ordem/agrupamento é apropriado?
//         5. Há possibilidade de simplificação?

//         Responda em formato JSON com as seguintes propriedades:
//         - optimizedQuery: Uma string com a consulta otimizada (ou a consulta original se já estiver boa)
//         - explanation: Breve explicação das mudanças feitas ou porque nenhuma mudança foi necessária
//         - performanceRating: Um número de 1-10 indicando eficiência da consulta original
//         `;

//         const optimizationRequest = {
//             contents: [{role: 'user', parts: [{text: optimizationPrompt}]}],
//         };
        
//         const optimizationResult = await generativeModel.generateContent(optimizationRequest);
//         const optimizationResponse = JSON.parse(optimizationResult.response.candidates[0].content.parts[0].text);
        
//         // Executa a consulta otimizada se for diferente da original
//         let finalResults = results;
//         let finalQuery = sqlQuery;
        
//         if (optimizationResponse.optimizedQuery && optimizationResponse.optimizedQuery !== sqlQuery) {
//             try {
//                 const [newRows] = await bigquery.query(optimizationResponse.optimizedQuery);
//                 finalResults = newRows.slice(0, 100);
//                 finalQuery = optimizationResponse.optimizedQuery;
//             } catch (error) {
//                 // Se falhar a otimizada, mantém a original
//                 console.error("Erro na consulta otimizada:", error);
//             }
//         }
        
//         // Gera descrições dos resultados
//         const descriptionPrompt = `
//         Você é um analista de dados especializado em explicar resultados SQL.

//         # Consulta SQL
//         \`\`\`sql
//         ${finalQuery}
//         \`\`\`

//         # Resultados (amostra)
//         \`\`\`
//         ${JSON.stringify(finalResults.slice(0, 10), null, 2)}
//         \`\`\`

//         # Tarefa
//         Forneça uma descrição clara e concisa dos resultados obtidos. Explique:
//         1. O que os dados representam
//         2. Insights principais que podem ser extraídos
//         3. Limitações destes resultados
//         4. Qualquer padrão ou anomalia notável

//         Seja preciso e objetivo, use linguagem acessível para não-técnicos.
//         `;

//         const descriptionRequest = {
//             contents: [{role: 'user', parts: [{text: descriptionPrompt}]}],
//         };
        
//         const descriptionResult = await generativeModel.generateContent(descriptionRequest);
//         const description = descriptionResult.content.parts[0].text;
        
//         return {
//             success: true,
//             query: finalQuery,
//             results: finalResults,
//             description: description,
//             explanation: optimizationResponse.explanation
//         };
//     } catch (error) {
//         // Se a consulta falhar, tenta corrigir
//         const errorMessage = (error as Error).message;
        
//         const fixPrompt = `
//         Você é um especialista em depuração de SQL para BigQuery.

//         # Consulta Com Erro
//         \`\`\`sql
//         ${sqlQuery}
//         \`\`\`

//         # Erro Retornado
//         \`\`\`
//         ${errorMessage}
//         \`\`\`

//         # Informações da Tabela
//         ${tableInfo}

//         # Tarefa
//         Corrija a consulta SQL para resolver o erro. Analise cuidadosamente a mensagem de erro e ajuste a consulta.
//         Retorne APENAS a consulta SQL corrigida sem explicações ou comentários adicionais.
//         `;

//         const fixRequest = {
//             contents: [{role: 'user', parts: [{text: fixPrompt}]}],
//         };
        
//         const fixResult = await generativeModel.generateContent(fixRequest);
//         const fixedQuery = fixResult.response.candidates[0].content.parts[0].text.trim();
        
//         // Tenta executar a consulta corrigida
//         try {
//             const [rows] = await bigquery.query({
//                 query: fixedQuery,
//                 location: 'US',
//             });
            
//             const results = rows.slice(0, 100);
            
//             // Gera descrições dos resultados
//             const descriptionPrompt = `
//             Você é um analista de dados especializado em explicar resultados SQL.

//             # Consulta SQL (corrigida após erro)
//             \`\`\`sql
//             ${fixedQuery}
//             \`\`\`

//             # Resultados (amostra)
//             \`\`\`
//             ${JSON.stringify(results.slice(0, 10), null, 2)}
//             \`\`\`

//             # Tarefa
//             Forneça uma descrição clara e concisa dos resultados obtidos. Explique:
//             1. O que os dados representam
//             2. Insights principais que podem ser extraídos
//             3. Limitações destes resultados
//             4. Qualquer padrão ou anomalia notável

//             Seja preciso e objetivo, use linguagem acessível para não-técnicos.
//             `;

//             const descriptionRequest = {
//                 contents: [{role: 'user', parts: [{text: descriptionPrompt}]}],
//             };
            
//             const descriptionResult = await generativeModel.generateContent(descriptionRequest);
//             const description = descriptionResult.content.parts[0].text;
            
//             return {
//                 success: true,
//                 query: fixedQuery,
//                 results: results,
//                 description: description,
//                 wasFixed: true,
//                 originalError: errorMessage
//             };
//         } catch (secondError) {
//             return {
//                 success: false,
//                 originalQuery: sqlQuery,
//                 attemptedFix: fixedQuery,
//                 originalError: errorMessage,
//                 secondError: (secondError instanceof Error) ? secondError.message : String(secondError)
//             };
//         }
//     }
// }

// /**
//  * Analisa os dados e recomenda visualizações apropriadas
//  */
// export async function AGENT_BI_Expert(query: string, sqlResults: any[], sqlQuery: string) {
//     const prompt = `
// Você é um especialista em visualização de dados e Business Intelligence.

// # Consulta do Usuário
// "${query}"

// # Consulta SQL
// \`\`\`sql
// ${sqlQuery}
// \`\`\`

// # Resultados da Consulta (amostra)
// \`\`\`
// ${JSON.stringify(sqlResults.slice(0, 10), null, 2)}
// \`\`\`

// # Tarefa
// Analise os dados e determine a melhor forma de visualização para responder à consulta do usuário.

// Considere:
// 1. A natureza dos dados (categóricos, temporais, numéricos)
// 2. O número de dimensões e métricas
// 3. A questão que o usuário está tentando responder
// 4. A facilidade de interpretação da visualização

// Responda em formato JSON com as seguintes propriedades:
// - needsChart: boolean (true se uma visualização é apropriada, false caso contrário)
// - chartType: string (um dos seguintes: "bar", "line", "pie", "scatter", "area", "radial", "heatmap", "table", null)
// - chartConfig: objeto com configuração para o gráfico que inclui:
//   - title: string (título do gráfico)
//   - xAxis: string (coluna para eixo X ou null)
//   - yAxis: string ou array (coluna(s) para eixo Y ou null)
//   - series: array de colunas para séries, se aplicável
//   - aggregation: tipo de agregação recomendada ("sum", "avg", "count", etc.) se aplicável
//   - colorScheme: string (esquema de cores recomendado)
//   - description: string (breve descrição da visualização recomendada)
//   - dataTransformation: string (descrição de qualquer transformação necessária nos dados)
// `;

//     const request = {
//         contents: [{role: 'user', parts: [{text: prompt}]}],
//     };
    
//     const result = await generativeModel.generateContent(request);
//     return JSON.parse(result.content.parts[0].text);
// }

// /**
//  * Gera código para visualização usando ShadCn
//  */
// export async function AGENT_Chart_Generator(biRecommendation: any, sqlResults: any[]) {
//     if (!biRecommendation.needsChart) {
//         return {
//             chartCode: null,
//             explanation: "Nenhum gráfico necessário para esta consulta"
//         };
//     }
    
//     const prompt = `
// Você é um desenvolvedor front-end especializado em visualizações de dados usando a biblioteca ShadCn UI com Recharts.

// # Recomendação de Visualização
// \`\`\`json
// ${JSON.stringify(biRecommendation, null, 2)}
// \`\`\`

// # Dados para Visualização
// \`\`\`json
// ${JSON.stringify(sqlResults.slice(0, 50), null, 2)}
// \`\`\`

// # Tarefa
// Gere um componente React TypeScript completo que implemente a visualização recomendada usando os componentes de gráficos da biblioteca ShadCn UI.

// Requisitos:
// 1. Use o formato de Card da ShadCn com CardHeader, CardContent e CardFooter apropriados
// 2. Implemente o tipo de gráfico recomendado (${biRecommendation.chartType})
// 3. Formate os dados conforme necessário
// 4. Aplique estilos adequados para legibilidade
// 5. Inclua títulos e legendas informativos
// 6. Garanta que a visualização seja responsiva
// 7. Use cores acessíveis e estilização consistente com ShadCn
// 8. Adicione qualquer transformação de dados necessária

// Utilize como referência o formato do componente BarChartMock.tsx:
// \`\`\`typescript
// "use client";
// import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   ChartConfig,
//   ChartContainer,
//   ChartTooltip,
//   ChartTooltipContent,
// } from "@/components/ui/chart";

// const chartData = [
//   { month: "Janeiro", vendas: 323 },
//   { month: "Fevereiro", vendas: 295 },
//   // ...
// ];

// const chartConfig = {
//   vendas: {
//     label: "Vendas",    
//     color: "#C9E543",
//   },
// } satisfies ChartConfig;

// export function BarChartMock() {
//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Quantidade de Vendas Mensal</CardTitle>
//         <CardDescription>Janeiro - Junho</CardDescription>
//       </CardHeader>
//       <CardContent>
//         <ChartContainer config={chartConfig}>
//           <BarChart
//             accessibilityLayer
//             data={chartData}
//             margin={{
//               top: 20,
//             }}
//           >
//             <CartesianGrid vertical={false} />
//             <XAxis
//               dataKey="month"
//               tickLine={false}
//               tickMargin={10}
//               axisLine={false}
//               tickFormatter={(value) => value.slice(0, 3)}
//             />
//             <ChartTooltip
//               cursor={false}
//               content={<ChartTooltipContent hideLabel />}
//             />
//             <Bar dataKey="vendas" fill="var(--color-vendas)" radius={8}>
//               <LabelList
//                 position="top"
//                 offset={12}
//                 className="fill-foreground"
//                 fontSize={12}
//               />
//             </Bar>
//           </BarChart>
//         </ChartContainer>
//       </CardContent>
//       <CardFooter className="flex-col items-start gap-2 text-sm">
//         <div className="flex gap-2 font-medium leading-none">
//           Aumento de 21% após a última promoção!
//         </div>
//         <div className="leading-none text-muted-foreground">
//           Mostrando o total de vendas nos meses selecionados
//         </div>
//       </CardFooter>
//     </Card>
//   );
// }
// \`\`\`

// Retorne o componente React completo como uma string bem formatada, garantindo que seja funcional e pronto para uso.
// `;

//     const request = {
//         contents: [{role: 'user', parts: [{text: prompt}]}],
//         generationConfig: {maxOutputTokens: 2048}
//     };
    
//     const result = await generativeModel.generateContent(request);
    
//     // Extrair apenas o código do componente (assumindo que está entre tags de código)
//     const fullResponse = result.content.parts[0].text;
//     const codeRegex = /```(?:typescript|tsx|javascript|jsx)?\s*([\s\S]*?)```/;
//     const match = fullResponse.match(codeRegex);
    
//     const chartCode = match ? match[1].trim() : fullResponse;
    
//     return {
//         chartCode,
//         explanation: "Componente de gráfico gerado com base nas recomendações"
//     };
// }

/**
 * Gera a resposta final para o usuário
 */
// export async function AGENT_Final_Response_Generator(
//     userQuery: string,
//     sqlValidatorResult: any,
//     biExpertResult: any,
//     hasChart: boolean
// ) {
//     const prompt = `
// Você é um assistente especializado em análise de dados para restaurantes, fornecendo insights valiosos baseados em consultas SQL.

// # Pergunta Original do Usuário
// "${userQuery}"

// # Resultados da Análise SQL
// - Consulta SQL: ${sqlValidatorResult.query}
// - Descrição dos resultados: ${sqlValidatorResult.description}
// - Explicação técnica: ${sqlValidatorResult.explanation || 'N/A'}

// # Informações de Visualização
// ${hasChart ? 'Um gráfico foi criado para visualizar estes dados.' : 'Não foi necessário gerar um gráfico para esta consulta.'}
// ${biExpertResult ? `Tipo de gráfico: ${biExpertResult.chartType}` : ''}
// ${biExpertResult ? `Descrição da visualização: ${biExpertResult.chartConfig?.description || 'N/A'}` : ''}

// # Tarefa
// Gere uma resposta completa e informativa para o usuário que:
// 1. Responda diretamente à pergunta original
// 2. Explique os principais insights encontrados nos dados
// 3. Destaque qualquer tendência ou padrão importante
// 4. Ofereça recomendações práticas baseadas na análise (quando apropriado)
// 5. Mencione brevemente a visualização criada (se aplicável)
// 6. Use linguagem amigável e não técnica

// A resposta deve ser bem formatada, usando Markdown para melhorar a legibilidade:
// - Título destacado
// - Subseções com ## quando apropriado
// - Listas com marcadores para pontos importantes
// - Texto em negrito para destacar insights cruciais
// - Tabelas quando útil para organizar informações
// `;

//     const request = {
//         contents: [{role: 'user', parts: [{text: prompt}]}],
//         generationConfig: {maxOutputTokens: 1024}
//     };
    
//     const result = await generativeModel.generateContent(request);
//     return result.content.parts[0].text;
// }

// /**
//  * Função que recupera informações de uma tabela BigQuery
//  */
// export async function getTableInfo(fileId: string) {
//     try {
//         // Obter metadata da tabela
//         const [metadata] = await bigquery
//             .dataset(process.env.GOOGLE_DATASET_SQL)
//             .table(fileId)
//             .getMetadata();
            
//         const schema = metadata.schema.fields.map(field => ({
//             name: field.name,
//             type: field.type,
//             description: field.description || null
//         }));
        
//         // Obter amostra de dados
//         const query = `
//             SELECT * 
//             FROM \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${process.env.GOOGLE_DATASET_SQL}.${fileId}\`
//             LIMIT 5
//         `;
        
//         const [rows] = await bigquery.query(query);
        
//         // Gerar resumo da tabela usando Gemini
//         const summaryPrompt = `
//             Você é um analista de dados especializado em resumir conjuntos de dados.
            
//             # Tabela: ${fileId}
//             # Esquema:
//             ${JSON.stringify(schema, null, 2)}
            
//             # Amostra de dados:
//             ${JSON.stringify(rows, null, 2)}
            
//             # Tarefa
//             Forneça um resumo conciso desta tabela em até 3 frases:
//             1. Que tipo de dados ela contém
//             2. Principais campos/colunas e seu significado
//             3. Possíveis usos analíticos destes dados
            
//             Seja breve e direto, sem introduções ou conclusões desnecessárias.
//         `;
        
//         const summaryRequest = {
//             contents: [{role: 'user', parts: [{text: summaryPrompt}]}],
//         };
        
//         const summaryResult = await generativeModel.generateContent(summaryRequest);
//         const summary = summaryResult.content.parts[0].text;
        
//         return {
//             fileId,
//             summary,
//             columns: schema,
//             sampleData: rows,
//             rowCount: metadata.numRows
//         };
//     } catch (error) {
//         console.error("Erro ao obter informações da tabela:", error);
//         throw error;
//     }
// }