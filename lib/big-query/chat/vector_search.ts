import { bigquery } from '@/lib/google-big-query';

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
      const [rows] = await bigquery.query({ query });
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
      const [rows] = await bigquery.query({ query });
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
  