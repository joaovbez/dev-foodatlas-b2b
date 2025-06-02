import { bigquery, dataset } from '@/lib/google-big-query';


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
      await bigquery.query({ query: query_text });
      await bigquery.query({ query: query_tabular });
    } catch (err) {
      console.error("[ERROR] Erro ao deletar embeddings no BigQuery:", err);
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
      await bigquery.query({ query: query_text });
      await bigquery.query({ query: query_tabular });
    } catch (err) {
      console.error("[ERROR] Erro ao deletar embeddings do restaurante no BigQuery:", err);
      throw err;
    }
  }
  