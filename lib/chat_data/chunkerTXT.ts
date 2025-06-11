import { Document } from "@langchain/core/documents";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { generateSummary } from "./openAI";

const loadTXTFile = async (filePath: string): Promise<string[]> => {
  try {
    const loader = new TextLoader(filePath);
    const docs: Document[] = await loader.load();
    return docs.map(doc => doc.pageContent.trim());
  } catch (error: any) {
    console.error("Erro ao carregar o arquivo TXT:", error.message ?? error);
    throw error;
  }
};

export async function processTXTFile(filePath: string): Promise<{ semanticChunks: string[], summary?: string }> {
  try {
    const content = await loadTXTFile(filePath);
    const summary = await generateSummary(content.join("\n"));
    
    // Divide o conteúdo em chunks menores para processamento
    const chunks: string[] = [];
    const chunkSize = 1000; // Tamanho aproximado de cada chunk
    
    for (const text of content) {
      if (text.length > chunkSize) {
        // Divide o texto em chunks menores
        for (let i = 0; i < text.length; i += chunkSize) {
          chunks.push(text.slice(i, i + chunkSize));
        }
      } else {
        chunks.push(text);
      }
    }
    
    return {
      semanticChunks: chunks,
      summary
    };
  } catch (error: any) {
    console.error("Erro ao processar TXT:", error.message ?? error);
    throw error;
  }
}



