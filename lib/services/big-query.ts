// Import the Google Cloud client library using default credentials
const {BigQuery} = require('@google-cloud/bigquery');
const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});
export async function saveEmbedding({
  fileId,
  restaurantId,
  text,
  embedding,
}: {
  fileId: string;
  restaurantId: string;
  text: string;
  embedding: number[];
}): Promise<void>{
  // Queries the U.S. given names dataset for the state of Texas.
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const datasetId = process.env.GOOGLE_DATASET_EMBEDDINGS;
  const tableId = process.env.GOOGLE_TABLE_EMBEDDINGS;

  const dataset = bigquery.dataset(datasetId, {projectId});
  const table = dataset.table(tableId);

  // const tableExists = await table.exists();

  const schema = [
    { name: "fileId", type: "STRING", mode: "REQUIRED" },
    { name: "restaurantId", type: "STRING", mode: "REQUIRED" },
    { name: "text", type: "STRING", mode: "REQUIRED" },
    { name: "embedding", type: "FLOAT64", mode: "REPEATED" },
    { name: "createdAt", type: "TIMESTAMP", mode: "REQUIRED" },
  ]

  // if (!tableExists) {
  //   const table = bigquery.dataset(datasetId, {projectId}).createTable(tableId);       
  //   const [metadata] = await table.getMetadata();
  //   metadata.schema = schema;
  //   const [apiResponse] = await table.setMetadata(metadata);
  // }

  const [metadata] = await table.getMetadata();
  metadata.schema = schema;
  const [apiResponse] = await table.setMetadata(metadata);
  
  console.log(apiResponse)
  console.log("Schema atualizado com sucesso!");

  const row = {
    fileId,
    restaurantId,
    text,
    embedding,
    createdAt: new Date().toISOString(), // Gera o timestamp atual
  };

  // Insere a linha na tabela.
  try {
    console.log("ARMAZENAMENTO DO EMBEDDING INICIADO...");
    await table.insert(row);
    console.log("ARMAZENAMENTO DO EMBEDDING FINALIZADO");
  } catch (err) {
    console.error("Erro ao inserir linha no BigQuery:", err);
    throw err;
  }
}