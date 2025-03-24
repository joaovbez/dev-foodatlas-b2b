const {BigQuery} = require('@google-cloud/bigquery');
import { bucket } from "@/lib/google-cloud-storage";

const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GBQ_CLIENT_EMAIL,
    private_key: process.env.GBQ_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

export async function saveEmbedding(fileId: string, restaurantId: string, 
                                    text: string, embedding: number[], summary?: string): Promise<void>{

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const datasetId = process.env.GOOGLE_DATASET_EMBEDDINGS;
  const tableId = process.env.GOOGLE_TABLE_EMBEDDINGS;

  const dataset = bigquery.dataset(datasetId, {projectId});
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

export async function saveEmbedding_tabular(fileId: string, restaurantId: string, 
  text: string, embedding: number[]): Promise<void>{

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const datasetId = process.env.GOOGLE_DATASET_EMBEDDINGS;
const tableId = process.env.GOOGLE_TABLE_EMBEDDINGS_TABULAR;

const dataset = bigquery.dataset(datasetId, {projectId});
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
  const datasetId = process.env.GOOGLE_DATASET_SQL;       
  const tableId = fileId;           
  const gcsUri = [pathGCS]; 
  
  const file = bucket.file(pathGCS);

  console.log(gcsUri);
  const metadata = {
    sourceFormat: 'CSV',
    skipLeadingRows: 1, 
    autodetect: true,
  };

  try {
    const [job] = await bigquery
      .dataset(datasetId)
      .table(tableId)
      .load([file], metadata);
      
    console.log(`Job ${job.id} concluído com sucesso.`);

    if (job.status.errors && job.status.errors.length > 0) {
      console.error('Erros no job:', job.status.errors);
      return;
    }
    console.log(`Tabela ${tableId} criada e carregada a partir de ${gcsUri}`);    
  } catch (error) {
    console.error('Erro ao criar a tabela:', error);
  }
}

export async function deleteFileEmbeddings(fileId: string, restaurantId: string): Promise<void>{

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const datasetId = process.env.GOOGLE_DATASET_EMBEDDINGS;
  const tableId = process.env.GOOGLE_TABLE_EMBEDDINGS;

  const dataset = bigquery.dataset(datasetId, {projectId});
  const table = dataset.table(tableId);

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

export async function deleteRestaurantEmbeddings(restaurantId: string): Promise<void>{

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const datasetId = process.env.GOOGLE_DATASET_EMBEDDINGS;  
  const tableId = process.env.GOOGLE_TABLE_EMBEDDINGS;

  const dataset = bigquery.dataset(datasetId, {projectId});
  const table = dataset.table(tableId);

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
  summary: string;
  distance: number;  
}

export async function vector_search_text(embedding_input: number[], topK: number, restaurantId: string) :Promise<EmbeddingResult[]>{
  
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
    
  try{
    const [rows] = await bigquery.query(query);
    return rows.map((row: any) => ({
      fileId: row.fileId,
      restaurantId: row.restaurantId,
      text: row.text,
      summary: row.summary,
      distance: row.distance,
    }));    
  } catch(error)  {
    console.error("Erro ao executar consulta de Vector Search:", error);
    throw error;
  }
}

export async function vector_search_tabular(embedding_input: number[], topK: number, restaurantId: string) :Promise<EmbeddingResult[]>{
  
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
    
  try{
    const [rows] = await bigquery.query(query);
    return rows.map((row: any) => ({
      fileId: row.fileId,
      restaurantId: row.restaurantId,
      text: row.text,      
      distance: row.distance,
    }));    
  } catch(error)  {
    console.error("Erro ao executar consulta de Vector Search:", error);
    throw error;
  }
}
