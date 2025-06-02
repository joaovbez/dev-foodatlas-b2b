import { bigquery} from '@/lib/google-big-query';
import { saveCSVtoSQL } from '@/lib/big-query/chat/saves';
import { bucket } from "@/lib/google-cloud-storage";
import { processFile } from "@/lib/dataprep/sischef";
import { Parser as Json2CsvParser } from 'json2csv';
import fs from 'fs';
import path from 'path';
import os from 'os';


export async function processAndSaveFile(
    fileId: string,
    restaurantId: string,
    gcsFilePath: string
  ): Promise<void> {
    try {
      const file = bucket.file(gcsFilePath);
      const [fileContent] = await file.download();
  
      const processedData = await processFile(fileContent, path.basename(gcsFilePath));
      if (processedData.error) {
        throw new Error(processedData.error);
      }
  
      const json2csvParser = new Json2CsvParser();
      const csv = json2csvParser.parse(processedData.records);
  
      const tempCsvPath = path.join(os.tmpdir(), `processed-${Date.now()}.csv`);
      fs.writeFileSync(tempCsvPath, csv);
  
      const processedGcsPath = `processed/${path.basename(tempCsvPath)}`;
      await bucket.upload(tempCsvPath, {
        destination: processedGcsPath,
      });
  
      await saveCSVtoSQL(processedGcsPath, restaurantId, path.basename(gcsFilePath));
  
      fs.unlinkSync(tempCsvPath);
  
    } catch (error) {
      console.error("Erro no processamento e salvamento do arquivo:", error);
      throw error;
    }
  }
  
  export async function saveCost(
    restaurantId: string,
    amount: number,
    type: 'FIXED' | 'VARIABLE',
    description: string,
    date: string
  ): Promise<void> {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const datasetId = process.env.GOOGLE_DATASET_FINANCE!;
    const tableId = process.env.GOOGLE_TABLE_COSTS!;
    const dataset = bigquery.dataset(datasetId, { projectId });
    const table = dataset.table(tableId);
  
    const row = {
      restaurant_id: restaurantId,
      amount,
      type,
      description,
      date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  
    try {
      await table.insert(row);
    } catch (err) {
      console.error("Erro ao inserir custo no BigQuery:", err);
      throw err;
    }
  }
  
  export async function saveRevenue(
    restaurantId: string,
    amount: number,
    description: string,
    date: string
  ): Promise<void> {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const datasetId = process.env.GOOGLE_CLOUD_DATASET_FINANCE!;
    const tableId = process.env.GOOGLE_TABLE_REVENUES!;
    const dataset = bigquery.dataset(datasetId, { projectId });
    const table = dataset.table(tableId);
  
    const row = {
      restaurant_id: restaurantId,
      amount,
      description,
      date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  
    try {
      await table.insert(row);
    } catch (err) {
      console.error("Erro ao inserir receita no BigQuery:", err);
      throw err;
    }
  }
  