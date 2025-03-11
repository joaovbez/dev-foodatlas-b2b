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