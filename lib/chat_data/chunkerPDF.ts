import { Document } from "@langchain/core/documents";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { generateSummary } from "./openAI";

const loadPDFFile = async (filePath: string): Promise<string[]> => {
  try {
    const loader = new PDFLoader(filePath);
    const docs: Document[] = await loader.load();
    return docs.map(doc => doc.pageContent.trim());
  } catch (error: any) {
    console.error("Erro ao carregar o arquivo PDF:", error.message ?? error);
    throw error;
  }
};

export async function processPDFFile(filePath: string): Promise<{ semanticChunks: string[], summary?: string }> {
  try {
    const content = await loadPDFFile(filePath);
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
    console.error("Erro ao processar PDF:", error.message ?? error);
    throw error;
  }
}



