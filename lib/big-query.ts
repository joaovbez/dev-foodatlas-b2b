import { BigQuery } from '@google-cloud/bigquery';
import { bucket } from "@/lib/google-cloud-storage";
import { Readable } from 'stream';
import { processFile } from "@/lib/dataprep/sischef";
import { Parser as Json2CsvParser } from 'json2csv';
import fs from 'fs';
import path from 'path';
import os from 'os';

console.log("[DEBUG] Inicializando cliente BigQuery");
const bigquery = new BigQuery();

const datasetId = process.env.BIGQUERY_DATASET;
if (!datasetId) {
    console.error("[ERROR] BIGQUERY_DATASET não está definido nas variáveis de ambiente");
    throw new Error('BIGQUERY_DATASET não está definido nas variáveis de ambiente');
}
console.log(`[DEBUG] Dataset ID configurado: ${datasetId}`);

export const dataset = bigquery.dataset(datasetId);

// Funções existentes (exemplos)
export async function saveEmbedding(
  fileId: string,
  restaurantId: string,
  text: string,
  embedding: number[],
  summary?: string
): Promise<void> {
  console.log("[DEBUG] Iniciando saveEmbedding");
  console.log(`[DEBUG] File ID: ${fileId}`);
  console.log(`[DEBUG] Restaurant ID: ${restaurantId}`);
  console.log(`[DEBUG] Tamanho do embedding: ${embedding.length}`);

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const datasetId = process.env.GOOGLE_DATASET_EMBEDDINGS!;
  const tableId = process.env.GOOGLE_TABLE_EMBEDDINGS!;
  console.log(`[DEBUG] Configuração BigQuery: projeto=${projectId}, dataset=${datasetId}, tabela=${tableId}`);

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
    console.log("[DEBUG] Inserindo embedding no BigQuery");
    await table.insert(row);
    console.log("[DEBUG] Embedding inserido com sucesso");
  } catch (err) {
    console.error("[ERROR] Erro ao inserir embedding no BigQuery:", err);
    throw err;
  }
}

export async function saveEmbedding_tabular(
  fileId: string,
  restaurantId: string,
  text: string,
  embedding: number[]
): Promise<void> {
  console.log("[DEBUG] Iniciando saveEmbedding_tabular");
  console.log(`[DEBUG] File ID: ${fileId}`);
  console.log(`[DEBUG] Restaurant ID: ${restaurantId}`);
  console.log(`[DEBUG] Tamanho do embedding: ${embedding.length}`);

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const datasetId = process.env.GOOGLE_DATASET_EMBEDDINGS!;
  const tableId = process.env.GOOGLE_TABLE_EMBEDDINGS_TABULAR!;
  console.log(`[DEBUG] Configuração BigQuery: projeto=${projectId}, dataset=${datasetId}, tabela=${tableId}`);

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
    console.log("[DEBUG] Inserindo embedding tabular no BigQuery");
    await table.insert(row);
    console.log("[DEBUG] Embedding tabular inserido com sucesso");
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

export async function deleteFileEmbeddings(fileId: string, restaurantId: string): Promise<void> {
  console.log("[DEBUG] Iniciando deleteFileEmbeddings");
  console.log(`[DEBUG] File ID: ${fileId}`);
  console.log(`[DEBUG] Restaurant ID: ${restaurantId}`);

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const datasetId = process.env.GOOGLE_DATASET_EMBEDDINGS;
  console.log(`[DEBUG] Configuração BigQuery: projeto=${projectId}, dataset=${datasetId}`);

  const query_text = `
    DELETE FROM \`foodatlas-442513.b2b_embeddings.embeddings\`
    WHERE fileId = '${fileId}' AND restaurantId = '${restaurantId}'
  `;
  const query_tabular = `
    DELETE FROM \`foodatlas-442513.b2b_embeddings.embeddings_tabular\`
    WHERE fileId = '${fileId}' AND restaurantId = '${restaurantId}'
  `;

  try {
    console.log("[DEBUG] Executando queries de deleção");
    await bigquery.query({ query: query_text });
    await bigquery.query({ query: query_tabular });
    console.log("[DEBUG] Embeddings deletados com sucesso");
  } catch (err) {
    console.error("[ERROR] Erro ao deletar embeddings no BigQuery:", err);
    throw err;
  }
}

export async function deleteRestaurantEmbeddings(restaurantId: string): Promise<void> {
  console.log("[DEBUG] Iniciando deleteRestaurantEmbeddings");
  console.log(`[DEBUG] Restaurant ID: ${restaurantId}`);

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const datasetId = process.env.GOOGLE_DATASET_EMBEDDINGS;
  console.log(`[DEBUG] Configuração BigQuery: projeto=${projectId}, dataset=${datasetId}`);

  const query_text = `
    DELETE FROM \`foodatlas-442513.b2b_embeddings.embeddings\`
    WHERE restaurantId = '${restaurantId}'
  `;
  const query_tabular = `
    DELETE FROM \`foodatlas-442513.b2b_embeddings.embeddings.tabular\`
    WHERE restaurantId = '${restaurantId}'
  `;

  try {
    console.log("[DEBUG] Executando queries de deleção");
    await bigquery.query({ query: query_text });
    await bigquery.query({ query: query_tabular });
    console.log("[DEBUG] Embeddings do restaurante deletados com sucesso");
  } catch (err) {
    console.error("[ERROR] Erro ao deletar embeddings do restaurante no BigQuery:", err);
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
  console.log("[DEBUG] Iniciando vector_search_text");
  console.log(`[DEBUG] Tamanho do embedding: ${embedding_input.length}`);
  console.log(`[DEBUG] Top K: ${topK}`);
  console.log(`[DEBUG] Restaurant ID: ${restaurantId}`);

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
    console.log("[DEBUG] Executando query de vector search");
    const [rows] = await bigquery.query({ query });
    console.log(`[DEBUG] ${rows.length} resultados encontrados`);
    return rows.map((row: any) => ({
      fileId: row.fileId,
      restaurantId: row.restaurantId,
      text: row.text,
      summary: row.summary,
      distance: row.distance,
    }));
  } catch (error) {
    console.error("[ERROR] Erro ao executar vector search:", error);
    throw error;
  }
}

export async function vector_search_tabular(
  embedding_input: number[],
  topK: number,
  restaurantId: string
): Promise<EmbeddingResult[]> {
  console.log("[DEBUG] Iniciando vector_search_tabular");
  console.log(`[DEBUG] Tamanho do embedding: ${embedding_input.length}`);
  console.log(`[DEBUG] Top K: ${topK}`);
  console.log(`[DEBUG] Restaurant ID: ${restaurantId}`);

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
    console.log("[DEBUG] Executando query de vector search tabular");
    const [rows] = await bigquery.query({ query });
    console.log(`[DEBUG] ${rows.length} resultados encontrados`);
    return rows.map((row: any) => ({
      fileId: row.fileId,
      restaurantId: row.restaurantId,
      text: row.text,
      distance: row.distance,
    }));
  } catch (error) {
    console.error("[ERROR] Erro ao executar vector search tabular:", error);
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

    // 2. Processa o arquivo utilizando o script Python 
    const processedData = await processFile(fileContent, path.basename(gcsFilePath));
    if (processedData.error) {
      throw new Error(processedData.error);
    }
    // processedData deve ser um array de objetos (JSON)

    // 3. Converte o JSON processado para CSV usando json2csv
    const json2csvParser = new Json2CsvParser();
    console.log('[DEBUG] Colunas do CSV:', Object.keys(processedData.records[0] || {}));
    console.log('[DEBUG] Primeira linha do CSV:', processedData.records[0]);
    const csv = json2csvParser.parse(processedData.records);

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
    await saveCSVtoSQL(processedGcsPath, restaurantId, path.basename(gcsFilePath));

    // 7. Remove o arquivo CSV temporário local
    fs.unlinkSync(tempCsvPath);

    console.log('Processamento e salvamento concluídos com sucesso!');
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

export async function getBreakEvenData(
  restaurantId: string,
  startDate: string,   // ex: "2024-06-01"
  endDate: string      // ex: "2024-06-30"
): Promise<any[]> {
  const projectId  = process.env.GOOGLE_CLOUD_PROJECT_ID!;
  const datasetId  = process.env.BIGQUERY_DATASET!;
  const stockTable = process.env.BIGQUERY_TABLE_STOCK_CONTROL!;
  const integTable = process.env.BIGQUERY_TABLE_INTEGRATED_REPORT!;
  const delivTable = process.env.BIGQUERY_TABLE_DELIVERY_REPORT!;

  const query = `
    WITH
      stock_usage AS (
        SELECT
          DATE_TRUNC(data, MONTH) AS month,
          SUM(qtd_usada_unidades * custo_unitario_brl) AS stock_cost
        FROM \`${projectId}.${datasetId}.${stockTable}\`
        WHERE restaurant_id = @restaurantId
          AND data BETWEEN
            PARSE_DATE('%Y-%m-%d', @startDate)
            AND PARSE_DATE('%Y-%m-%d', @endDate)
        GROUP BY month
      ),
      integrated AS (
        SELECT
          DATE_TRUNC(data, MONTH) AS month,
          SUM(vendas_brutas_brl)       AS gross_sales,
          SUM(custo_alimentos_brl)     AS food_cost,
          SUM(custo_mao_obra_brl)      AS labor_cost,
          SUM(despesa_promocional_brl) AS promo_cost
        FROM \`${projectId}.${datasetId}.${integTable}\`
        WHERE restaurant_id = @restaurantId
          AND data BETWEEN
            PARSE_DATE('%Y-%m-%d', @startDate)
            AND PARSE_DATE('%Y-%m-%d', @endDate)
        GROUP BY month
      ),
      delivery AS (
        SELECT
          DATE_TRUNC(data, MONTH) AS month,
          SUM(total_brl) AS delivery_revenue
        FROM \`${projectId}.${datasetId}.${delivTable}\`
        WHERE restaurant_id = @restaurantId
          AND data BETWEEN
            PARSE_DATE('%Y-%m-%d', @startDate)
            AND PARSE_DATE('%Y-%m-%d', @endDate)
        GROUP BY month
      ),
      monthly_data AS (
        SELECT
          COALESCE(i.month, d.month, s.month) AS month,
          COALESCE(i.gross_sales,    0) AS gross_sales,
          COALESCE(d.delivery_revenue,0) AS delivery_revenue,
          COALESCE(s.stock_cost,     0) AS stock_cost,
          COALESCE(i.food_cost,      0) AS food_cost,
          COALESCE(i.labor_cost,     0) AS labor_cost,
          COALESCE(i.promo_cost,     0) AS promo_cost
        FROM integrated i
        FULL OUTER JOIN delivery d ON i.month = d.month
        FULL OUTER JOIN stock_usage s ON i.month = s.month
      )
    SELECT
      month,
      gross_sales,
      delivery_revenue,
      (gross_sales + delivery_revenue) AS total_revenue,
      (food_cost + stock_cost)         AS variable_costs,
      (labor_cost + promo_cost)        AS fixed_costs,
      (labor_cost + promo_cost)
        / NULLIF((gross_sales + delivery_revenue) - (food_cost + stock_cost), 0)
        AS contribution_margin_ratio,
      (labor_cost + promo_cost)
        / NULLIF(
            1
            - ((food_cost + stock_cost)
               / NULLIF(gross_sales + delivery_revenue, 0)
              ),
            0
          ) AS break_even_revenue
    FROM monthly_data
    ORDER BY month DESC;
  `;

  const options = {
    query,
    params: { restaurantId, startDate, endDate }
  };

  try {
    const [rows] = await bigquery.query(options);
    return rows as any[];
  } catch (err) {
    console.error("Erro ao buscar dados de break-even:", err);
    throw err;
  }
}

/**
 * Busca transações para análise de dados como média de ticket e contagem de clientes
 * @param restaurantId ID do restaurante
 * @param startDate Data inicial formato "YYYY-MM-DD"
 * @param endDate Data final formato "YYYY-MM-DD"
 * @returns Lista de transações
 */
export async function getTransactionsData(
  restaurantId: string,
  startDate: string,
  endDate: string
): Promise<any[]> {
  console.log(`[GET_TRANSACTIONS] Buscando transações para ${restaurantId} entre ${startDate} e ${endDate}`);
  
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID!;
  const dataset = process.env.GOOGLE_DATASET_SQL || "foodatlas_bucket";
  
  // Usar as tabelas definidas no .env
  const stockTable = process.env.BIGQUERY_TABLE_STOCK_CONTROL!;
  const integTable = process.env.BIGQUERY_TABLE_INTEGRATED_REPORT!;
  const delivTable = process.env.BIGQUERY_TABLE_DELIVERY_REPORT!;
  
  // Consulta adaptada para usar as três tabelas e simular transações
  const query = `
    WITH
      integrated AS (
        SELECT
          CONCAT('INT_', CAST(RAND() * 1000000 AS INT64)) AS transaction_id,
          restaurant_id,
          CONCAT('CLIENT_', CAST(RAND() * 10000 AS INT64)) AS client_id,
          data AS date,
          vendas_brutas_brl AS amount,
          'RECEITA' AS transaction_type
        FROM
          \`${projectId}.${dataset}.${integTable}\`
        WHERE
          restaurant_id = @restaurantId
          AND data BETWEEN DATE(@startDate) AND DATE(@endDate)
      ),
      delivery AS (
        SELECT
          CONCAT('DEL_', CAST(RAND() * 1000000 AS INT64)) AS transaction_id,
          restaurant_id,
          CONCAT('CLIENT_', CAST(RAND() * 10000 AS INT64)) AS client_id,
          data AS date,
          total_brl AS amount,
          'RECEITA' AS transaction_type
        FROM
          \`${projectId}.${dataset}.${delivTable}\`
        WHERE
          restaurant_id = @restaurantId
          AND data BETWEEN DATE(@startDate) AND DATE(@endDate)
      )
    SELECT * FROM integrated
    UNION ALL
    SELECT * FROM delivery
    ORDER BY date DESC
  `;
  
  const options = {
    query,
    params: { restaurantId, startDate, endDate }
  };
  
  try {
    const [rows] = await bigquery.query(options);
    console.log(`[GET_TRANSACTIONS] Recuperadas ${rows.length} transações`);
    return rows as any[];
  } catch (err) {
    console.error("[GET_TRANSACTIONS] Erro ao buscar transações:", err);
    throw err;
  }
}
