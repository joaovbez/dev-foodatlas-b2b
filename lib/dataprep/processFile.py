import os
import sys
import json
import unicodedatapa
import re
from datetime import datetime, timezone
import dotenv
import pandas as pd
from google.cloud import bigquery
import traceback
from typing import Dict, List, Any, Optional
from tenacity import retry, stop_after_attempt, wait_exponential
import logging
from pathlib import Path

# Configuração de logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Carrega .env (opcionalmente de caminho customizado)
env_path = os.getenv("DOTENV_PATH")
if env_path:
    logger.info(f"Carregando .env do caminho customizado: {env_path}")
    dotenv.load_dotenv(env_path)
else:
    logger.info("Carregando .env do diretório padrão")
    dotenv.load_dotenv()

# https://cloud.google.com/docs/authentication/production
# Use Application Default Credentials:
# export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"

# Schema esperado para validação
EXPECTED_SCHEMA = {
    "restaurant_id": str,
    "created_at": str,
    "updated_at": str,
    "original_headers": str
}

def validate_file_path(path: str) -> None:
    """Valida se o arquivo existe e é acessível."""
    if not os.path.exists(path):
        raise FileNotFoundError(f"Arquivo não encontrado: {path}")
    if not os.access(path, os.R_OK):
        raise PermissionError(f"Sem permissão para ler o arquivo: {path}")

def validate_environment() -> None:
    """Valida se todas as variáveis de ambiente necessárias estão configuradas."""
    required_vars = [
        "GOOGLE_CLOUD_PROJECT_ID",
        "GOOGLE_CLOUD_DATASET_FINANCE",
        "GOOGLE_APPLICATION_CREDENTIALS"
    ]
    
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        raise EnvironmentError(f"Variáveis de ambiente obrigatórias não configuradas: {', '.join(missing_vars)}")

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def normalize_header(col: str) -> str:
    try:
        s = unicodedata.normalize("NFKD", col)
        s = s.encode("ascii", "ignore").decode("ascii")
        s = re.sub(r"[^\w\s]", "", s)
        s = re.sub(r"\s+", "_", s.strip())
        normalized = s.lower()
        return normalized
    except Exception as e:
        logger.error(f"Erro ao normalizar cabeçalho '{col}': {str(e)}")
        raise

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def read_csv(path: str) -> tuple[pd.DataFrame, Dict[str, str]]:
    df = pd.read_csv(path, dtype=str, keep_default_na=False)
    header_mapping = {col: normalize_header(col) for col in df.columns}
    df = df.rename(columns=header_mapping)
    return df, header_mapping

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def convert_columns(df: pd.DataFrame) -> pd.DataFrame:
    try:
        # Inteiros
        if "qtd_usada_unidades" in df.columns:
            df["qtd_usada_unidades"] = pd.to_numeric(
                df["qtd_usada_unidades"], errors="coerce"
            ).fillna(0).astype(int)
        
        # Floats
        if "custo_unitario_brl" in df.columns:
            df["custo_unitario_brl"] = pd.to_numeric(
                df["custo_unitario_brl"], errors="coerce"
            ).fillna(0.0)
        
        # Datas - convertendo para string ISO formatada
        if "data" in df.columns:
            df["data"] = pd.to_datetime(
                df["data"], errors="coerce"
            ).dt.strftime("%Y-%m-%d")

        return df
    except Exception as e:
        logger.error(f"Erro ao converter colunas: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

def validate_schema(df: pd.DataFrame) -> None:
    required_columns = set(EXPECTED_SCHEMA.keys())
    missing_columns = required_columns - set(df.columns)
    if missing_columns:
        raise ValueError(f"Colunas obrigatórias ausentes: {missing_columns}")

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def process_file(file_path: str, restaurant_id: str) -> Dict[str, Any]:
    try:
        df, header_mapping = read_csv(file_path)
        # Adiciona restaurant_id como primeira coluna
        df.insert(0, "restaurant_id", restaurant_id)
        df = convert_columns(df)
        now = datetime.now(timezone.utc).isoformat()
        df["created_at"] = now
        df["updated_at"] = now
        df["original_headers"] = json.dumps(header_mapping)
        records = df.where(pd.notnull(df), None).to_dict(orient="records")
        if not records:
            raise ValueError("Nenhum registro válido encontrado no CSV.")
        return {"records": records, "header_mapping": header_mapping}
    except Exception as e:
        return {"error": str(e)}

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def save_to_bigquery(data: Dict[str, Any], project_id: str, dataset_id: str) -> Dict[str, Any]:
    try:
        client = bigquery.Client(project=project_id)
        table_ref = f"{project_id}.{dataset_id}"

        # Configuração do job com schema explícito
        job_config = bigquery.LoadJobConfig(
            write_disposition="WRITE_APPEND",
            source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON
        )

        records = data.get("records", [])
        if not records:
            raise ValueError("Não há registros para inserir.")

        job = client.load_table_from_json(records, table_ref, job_config=job_config)
        job.result()
        return {"success": True}

    except Exception as e:
        logger.error(f"Falha em save_to_bigquery: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {"error": str(e)}

# CLI
if __name__ == "__main__":
    try:
        # Validação de argumentos
        if len(sys.argv) != 3:
            error_msg = "Uso: processFile.py <caminho_csv> <restaurant_id>"
            logger.error(error_msg)
            print(json.dumps({"error": error_msg}))
            sys.exit(1)

        csv_path, restaurant_id = sys.argv[1], sys.argv[2]

        # Validação de ambiente
        validate_environment()
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
        dataset_id = os.getenv("GOOGLE_CLOUD_DATASET_FINANCE")

        result = process_file(csv_path, restaurant_id)
        if "error" in result:
            logger.error(f"Erro no processamento: {result['error']}")
            print(json.dumps({"error": result["error"]}))
            sys.exit(1)

        result_bq = save_to_bigquery(result, project_id, dataset_id)
        if "error" in result_bq:
            logger.error(f"Erro no salvamento: {result_bq['error']}")
            print(json.dumps({"error": result_bq["error"]}))
            sys.exit(1)

        print(json.dumps({"success": True}))
        sys.exit(0)

    except Exception as e:
        logger.error(f"Erro fatal: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
