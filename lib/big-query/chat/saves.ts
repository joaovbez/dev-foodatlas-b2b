import { bigquery, dataset } from '@/lib/google-big-query';
import { bucket } from "@/lib/google-cloud-storage";
import fs from 'fs';
import path from 'path';
import os from 'os';

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
      console.error("[ERROR] Erro ao inserir embedding tabular no BigQuery:", err);
      throw err;
    }
  }
  
  export async function saveCSVtoSQL(pathGCS: string, restaurantId: string, documentType: string) {
    console.log("[DEBUG] Iniciando saveCSVtoSQL");
  
    // 1) Download do CSV
    const file = bucket.file(pathGCS);
    const [csvBuffer] = await file.download();
    const csv = csvBuffer.toString('utf-8');
  
    // 2) Pré-processamento: adiciona restaurant_id
    const lines = csv
      .split('\n')
      .filter(line => line.trim() !== '');
    if (lines.length < 2) {
      throw new Error("CSV sem dados suficientes");
    }
  
    // Novo cabeçalho e linhas de dados prefixadas
    const header = lines[0];
    const dataLines = lines.slice(1);
    const newCsv = [
      `restaurant_id,${header}`,
      ...dataLines.map(l => `${restaurantId},${l}`)
    ].join('\n');
  
    console.log("[DEBUG] Novo CSV (primeiras 5 linhas):\n" +
      newCsv.split('\n').slice(0,5).join('\n'));
  
    // 3) Salva o novo CSV em um arquivo temporário local
    const tempCsvPath = path.join(os.tmpdir(), `csv-upload-${Date.now()}.csv`);
    fs.writeFileSync(tempCsvPath, newCsv);
  
    // 4) Carregamento no BigQuery usando o caminho do arquivo
    const datasetId = process.env.GOOGLE_DATASET_SQL!;
    const tableId   = documentType
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  
    const metadata = {
      sourceFormat: 'CSV',
      skipLeadingRows: 1,    // porque o novo CSV já tem cabeçalho
      autodetect: true
    };
  
    console.log(`[DEBUG] Carregando em ${datasetId}.${tableId}...`);
  
    try {
      const [job] = await bigquery
        .dataset(datasetId)
        .table(tableId)
        .load(tempCsvPath, metadata);
  
      if (job.status?.errors?.length) {
        console.error('[ERROR] Erros no job:', job.status.errors);
        throw new Error("Erro no load job");
      }
  
      console.log("[DEBUG] CSV carregado com sucesso no BigQuery");
    } catch (err) {
      console.error('[ERROR] Falha ao carregar CSV no BigQuery:', err);
      throw err;
    } finally {
      // (Depois, remova o arquivo temporário)
      fs.unlinkSync(tempCsvPath);
    }
  }
  