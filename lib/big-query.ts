import { BigQuery } from '@google-cloud/bigquery';
import { bucket } from "@/lib/google-cloud-storage";
import { processFile } from "@/lib/dataprep/sischef";
import { Parser as Json2CsvParser } from 'json2csv';
import fs from 'fs';
import path from 'path';
import os from 'os';

const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID!,
  credentials: {
    client_email: process.env.GBQ_CLIENT_EMAIL,
    private_key: process.env.GBQ_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

// Funções existentes (exemplos)
export async function saveEmbedding(
  fileId: string,
  restaurantId: string,
  text: string,
  embedding: number[],
  summary?: string
): Promise<void> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const datasetId = process.env.GOOGLE_DATASET_EMBEDDINGS!;
  const tableId = process.env.GOOGLE_TABLE_EMBEDDINGS!;
  const dataset = bigquery.dataset(datasetId, { projectId });
  const table = dataset.table(tableId);

  const row = {
    fileId,
    restaurantId,
    text,
    embedding,
    summary,
    createdAt: new Date().toISOString(),
  };

  try {
    await table.insert(row);
  } catch (err) {
    console.error("Erro ao inserir linha no BigQuery:", err);
    throw err;
  }
}

export async function saveEmbedding_tabular(
  fileId: string,
  restaurantId: string,
  text: string,
  embedding: number[]
): Promise<void> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const datasetId = process.env.GOOGLE_DATASET_EMBEDDINGS!;
  const tableId = process.env.GOOGLE_TABLE_EMBEDDINGS_TABULAR!;
  const dataset = bigquery.dataset(datasetId, { projectId });
  const table = dataset.table(tableId);

  const row = {
    fileId,
    restaurantId,
    text,
    embedding,
    createdAt: new Date().toISOString(),
  };

  try {
    await table.insert(row);
  } catch (err) {
    console.error("Erro ao inserir linha no BigQuery:", err);
    throw err;
  }
}

export async function saveCSVtoSQL(pathGCS: string, fileId: string) {
  const datasetId = process.env.GOOGLE_DATASET_SQL!;
  const tableId = fileId;
  const file = bucket.file(pathGCS);

  const metadata = {
    sourceFormat: 'CSV',
    skipLeadingRows: 1,
    autodetect: true,
  };

  try {
    const [job] = await bigquery.dataset(datasetId).table(tableId).load([file], metadata);
    if (job.status?.errors && job.status.errors.length > 0) {
      console.error('Erros no job:', job.status.errors);
      return;
    }
  } catch (error) {
    console.error('Erro ao criar a tabela:', error);
  }
}

export async function deleteFileEmbeddings(fileId: string, restaurantId: string): Promise<void> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const datasetId = process.env.GOOGLE_DATASET_EMBEDDINGS;
  const query_text = `
    DELETE FROM \`foodatlas-442513.b2b_embeddings.embeddings\`
    WHERE fileId = '${fileId}' AND restaurantId = '${restaurantId}'
  `;
  const query_tabular = `
    DELETE FROM \`foodatlas-442513.b2b_embeddings.embeddings_tabular\`
    WHERE fileId = '${fileId}' AND restaurantId = '${restaurantId}'
  `;

  try {
    await bigquery.query(query_text);
    await bigquery.query(query_tabular);
  } catch (err) {
    console.error("Erro ao deletar linha no BigQuery:", err);
    throw err;
  }
}

export async function deleteRestaurantEmbeddings(restaurantId: string): Promise<void> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const datasetId = process.env.GOOGLE_DATASET_EMBEDDINGS;
  const query_text = `
    DELETE FROM \`foodatlas-442513.b2b_embeddings.embeddings\`
    WHERE restaurantId = '${restaurantId}'
  `;
  const query_tabular = `
    DELETE FROM \`foodatlas-442513.b2b_embeddings.embeddings.tabular\`
    WHERE restaurantId = '${restaurantId}'
  `;

  try {
    await bigquery.query(query_text);
    await bigquery.query(query_tabular);
  } catch (err) {
    console.error("Erro ao deletar linha no BigQuery:", err);
    throw err;
  }
}

interface EmbeddingResult {
  fileId: string;
  restaurantId: string;
  text: string;
  summary?: string;
  distance: number;
}

export async function vector_search_text(
  embedding_input: number[],
  topK: number,
  restaurantId: string
): Promise<EmbeddingResult[]> {
  const vectorString = JSON.stringify(embedding_input);
  const query = `
  SELECT 
    base.fileId, 
    base.restaurantId, 
    base.text,
    base.summary,
    distance
  FROM VECTOR_SEARCH(
    (      
      SELECT fileId, restaurantId, text, summary, embedding
      FROM \`foodatlas-442513.b2b_embeddings.embeddings\`
      WHERE restaurantId = '${restaurantId}'
    ),
    'embedding',
    (
      SELECT * FROM UNNEST([
        STRUCT(
          "query_id" AS query_id,
          ${vectorString} AS embedding
        )
      ])
    ),
    'embedding',
    top_k => ${topK},
    distance_type => "COSINE"
  )  
  ORDER BY distance ASC
  `;

  try {
    const [rows] = await bigquery.query(query);
    return rows.map((row: any) => ({
      fileId: row.fileId,
      restaurantId: row.restaurantId,
      text: row.text,
      summary: row.summary,
      distance: row.distance,
    }));
  } catch (error) {
    console.error("Erro ao executar consulta de Vector Search:", error);
    throw error;
  }
}

export async function vector_search_tabular(
  embedding_input: number[],
  topK: number,
  restaurantId: string
): Promise<EmbeddingResult[]> {
  const vectorString = JSON.stringify(embedding_input);
  const query = `
  SELECT 
    base.fileId, 
    base.restaurantId, 
    base.text,
    distance
  FROM VECTOR_SEARCH(
    (      
      SELECT fileId, restaurantId, text, embedding
      FROM \`foodatlas-442513.b2b_embeddings.embeddings_tabular\`
      WHERE restaurantId = '${restaurantId}'
    ),
    'embedding',
    (
      SELECT * FROM UNNEST([
        STRUCT(
          "query_id" AS query_id,
          ${vectorString} AS embedding
        )
      ])
    ),
    'embedding',
    top_k => ${topK},
    distance_type => "COSINE"
  )  
  ORDER BY distance ASC
  `;

  try {
    const [rows] = await bigquery.query(query);
    return rows.map((row: any) => ({
      fileId: row.fileId,
      restaurantId: row.restaurantId,
      text: row.text,
      distance: row.distance,
    }));
  } catch (error) {
    console.error("Erro ao executar consulta de Vector Search:", error);
    throw error;
  }
}

/**
 * Integra o processamento do arquivo usando sischef.ts e salva o resultado processado no BigQuery.
 * Fluxo:
 * 1. Baixa o arquivo do Cloud Storage.
 * 2. Processa o arquivo via Python (usando sischef.ts).
 * 3. Converte o JSON processado para CSV.
 * 4. Carrega o CSV processado para o Storage.
 * 5. Chama saveCSVtoSQL para importar o CSV para o BigQuery.
 *
 * @param fileId Identificador do arquivo (usado como nome da tabela no BigQuery)
 * @param restaurantId Identificador do restaurante
 * @param gcsFilePath Caminho do arquivo original no Cloud Storage
 */
export async function processAndSaveFile(
  fileId: string,
  restaurantId: string,
  gcsFilePath: string
): Promise<void> {
  try {
    // 1. Baixa o arquivo do bucket do Google Cloud Storage
    const file = bucket.file(gcsFilePath);
    const [fileContent] = await file.download();

    // 2. Processa o arquivo utilizando o script Python via sischef.ts
    const processedData = await processFile(fileContent, path.basename(gcsFilePath));
    if (processedData.error) {
      throw new Error(processedData.error);
    }
    // processedData deve ser um array de objetos (JSON)

    // 3. Converte o JSON processado para CSV usando json2csv
    const json2csvParser = new Json2CsvParser();
    const csv = json2csvParser.parse(processedData);

    // 4. Salva o CSV processado em um arquivo temporário local
    const tempCsvPath = path.join(os.tmpdir(), `processed-${Date.now()}.csv`);
    fs.writeFileSync(tempCsvPath, csv);

    // 5. Carrega o CSV processado para o bucket (em um diretório específico)
    const processedGcsPath = `processed/${path.basename(tempCsvPath)}`;
    await bucket.upload(tempCsvPath, {
      destination: processedGcsPath,
    });
    console.log('Processed CSV uploaded to GCS:', processedGcsPath);

    // 6. Chama a função saveCSVtoSQL para importar o CSV processado no BigQuery
    await saveCSVtoSQL(processedGcsPath, fileId);

    // 7. Remove o arquivo CSV temporário local
    fs.unlinkSync(tempCsvPath);

    console.log('Processamento e salvamento concluídos com sucesso!');
  } catch (error) {
    console.error("Erro no processamento e salvamento do arquivo:", error);
    throw error;
  }
}
