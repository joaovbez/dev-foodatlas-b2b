import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

export async function generateResponse(prompt: string): Promise<any>{
  const streamResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Você é um analista de dados experiente." },
      { role: "user", content: prompt },
    ],
    temperature: 0,
    stream: true,
  });
  return streamResponse;
}

export async function generateSummary(text: string): Promise<string> {

  const prompt_summary = ` 
  # Você é um assistente especializado em análise de arquivos de texto.
  ## Tarefa: Ler todo o conteúdo do arquivo fornecido e produzir um resumo conciso (idealmente 2 a 3 frases) que inclua:

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
    max_tokens: 80,
  });
  return response.choices[0].message.content ?? '';
}