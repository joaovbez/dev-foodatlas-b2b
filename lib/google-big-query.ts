import { BigQuery } from '@google-cloud/bigquery';

export const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GBQ_PRIVATE_KEY
  }
});
const datasetId = process.env.BIGQUERY_DATASET;
if (!datasetId) {
    console.error("[ERROR] BIGQUERY_DATASET não está definido nas variáveis de ambiente");
    throw new Error('BIGQUERY_DATASET não está definido nas variáveis de ambiente');
}

export const dataset = bigquery.dataset(datasetId);