import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { generateCSVFileDescription } from "./openAI";

// Função para carregar o arquivo CSV
const loadCSVFile = async (filePath: string) => {
  try {
    const loader = new CSVLoader(filePath);
    const docs = await loader.load();
    const allRows = docs.map(doc => doc.pageContent);
    const firstRows = allRows.slice(0, 2);
    const lastRows = allRows.slice(-2);
    const rows = [...firstRows, ...lastRows];
    return rows;
  } catch (error) {
    console.error("Erro ao carregar o arquivo CSV:", error);
    throw error;
  }
};

export async function processCSVFile(filepath: string) {
    const rows = await loadCSVFile(filepath);
    const summary = await generateCSVFileDescription(rows);
    const file_description = 
    `## Descrição do Arquivo e suas colunas: 
        ${summary}     
     ## Exemplo de Linha contida no arquivo:
        ${rows[0]}`    
    return file_description;
}



