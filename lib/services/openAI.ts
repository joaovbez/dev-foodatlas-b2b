import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });



export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

export async function generateResponseFinal(prompt: string): Promise<any>{
  const streamResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Você é um assistente que deve responder baseando-se exclusivamente no contexto e nas informações e dados fornecidos." },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    stream: true,
  });
  return streamResponse;
}

export async function generateIntention(prompt: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: " Vocês é um assistente especializado em classificação de perguntas para análise de dados posterior." },
      { role: "user", content: prompt },
    ],
    temperature: 0,
  });
  return response.choices[0].message.content ?? '';
}

export async function generateSummary(text: string): Promise<string> {

  const prompt_summary = ` 
  # Você é um assistente especializado em análise de arquivos de texto.
  ## Tarefa: Ler todo o conteúdo do arquivo fornecido e produzir um resumo conciso (no máximo 2 frases não muito longas) que inclua:

  - O foco principal do arquivo (sobre o que ele trata).
  - O período ou intervalo de tempo que o arquivo cobre (caso seja mencionado).
  - Qualquer ponto relevante ou dado essencial (ex.: métricas, resultados, público-alvo etc.).
  
  ### INSTRUÇÕES:

  - Não inclua detalhes desnecessários ou que não estejam no arquivo.
  - Mantenha o resumo objetivo e claro.
  - Se informações como período ou público-alvo não forem encontradas, não as invente.
 
  ### Exemplo de Estrutura:
  “Este relatório abrange [período], detalha [foco/assunto principal] e destaca [ponto(s) relevante(s)].”
  
  Dito isto, forneça um resumo conciso para o arquivo a seguir:
  ${text}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Você é um assistente especializado em análise de arquivos de texto." },
      { role: "user", content: prompt_summary },
    ],
    temperature: 0,
    max_tokens: 120,
  });
  return response.choices[0].message.content ?? '';
}

export async function generateCSVFileDescription(rows: string[]): Promise<string> {
  const prompt = `
  # Vocês é um assistente especializado em análise de arquivos tabulares e com grande experiência no setor alimentício (restaurantes).
  ## Contexto: Análise de dados para insights e recomendações no setor de restaurantes, logo, os dados dos arquivos conterão informações relacionadas a refeições, vendas, lucro, etc.
  ## Tarefa: Você receberá neste prompt as primeiras 4 linhas do arquivo CSV em questão e deverá produzir um resumo conciso (não muito longo) que inclua:

  - O foco principal do arquivo (sobre o que ele trata).
  - O período ou intervalo de tempo que o arquivo cobre (caso seja mencionado).
  - Baseado nas colunas e nos conteúdos delas, quais informações ele pode fornecer.
  
  ### INSTRUÇÕES:

  - Mantenha o resumo objetivo e claro.
  - Não "alucine" ou invente informações. Só inclua na descrição do arquivo se ela realmente estiver presente nas primeiras 5 linhas.  
  - Se o arquivo for muito grande, não inclua detalhes desnecessários ou que não estejam no arquivo.

  ### Exemplo de como a linhas irão aparecer (nao leve em consideração o número de colunas, apenas o formato de como estarão no final do prompt):
      
    Coluna 1: conteúdo
    Coluna 2: conteúdo
    Coluna 3: conteúdo
    
  ### Exemplo de como deve ser sua resposta:
    
    Resumo do Arquivo: <seu resumo>

    As descrições das colunas do arquivo são: 
    - <nome da coluna 1>: <descrição_da_coluna_1>
    - <nome da coluna 2>: <descrição_da_coluna_2>
    - <nome da coluna 3>: <descrição_da_coluna_3>

  ### Dito isto, forneça um resumo conciso baseado nas 4 linhas a seguir:

  **Linha 1**:
  ${rows[0]}
  
  **Linha 2**:
  ${rows[1]}
  
  **Linha 3**:
  ${rows[2]}
  
  **Linha 4**:
  ${rows[3]}`;

  


  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: " Vocês é um assistente especializado em análise de arquivos CSV." },
      { role: "user", content: prompt },
    ],
    temperature: 0,
  });
  return response.choices[0].message.content ?? '';
}

export async function generateResponseCSV(prompt: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: " Vocês é um assistente especializado em análise de arquivos CSV." },
      { role: "user", content: prompt },
    ],
    temperature: 0,
  });
  return response.choices[0].message.content ?? '';
}