import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { Document } from "@langchain/core/documents";
import { generateCSVFileDescription } from "./openAI";

const loadCSVFile = async (filePath: string): Promise<string[]> => {
  try {
    // Certifique-se de usar o loader correto e passar hasHeader se necessário
    const loader = new CSVLoader(filePath);
    const docs: Document[] = await loader.load();
    const allRows = docs.map(doc => doc.pageContent.trim());
    
    // Pega até as 2 primeiras e 2 últimas linhas, se existirem
    const firstRows = allRows.slice(0, 2);
    const lastRows  = allRows.length > 2 ? allRows.slice(-2) : [];
    return [...firstRows, ...lastRows];
  } catch (error: any) {
    console.error("Erro ao carregar o arquivo CSV:", error.message ?? error);
    throw error;
  }
};

export async function processCSVFile(filePath: string): Promise<string> {
  try {
    const rows = await loadCSVFile(filePath);
    const summary = await generateCSVFileDescription(rows);

    // Formata a descrição com exemplo da primeira linha disponível
    const exampleLine = rows.length > 0 ? rows[0] : "(arquivo vazio)";
    return `
## Descrição do Arquivo e suas Colunas
${summary}

## Exemplo de Linha no Arquivo
${exampleLine}
`.trim();
  } catch (error: any) {
    console.error("Erro ao processar CSV:", error.message ?? error);
    throw error;
  }
}
