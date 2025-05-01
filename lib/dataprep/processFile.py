import os
import sys
import json
import unicodedata
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
    """Normaliza cabeçalhos para snake_case ASCII com retry mechanism."""
    logger.debug(f"Normalizando cabeçalho: {col}")
    try:
        s = unicodedata.normalize("NFKD", col)
        s = s.encode("ascii", "ignore").decode("ascii")
        s = re.sub(r"[^\w\s]", "", s)
        s = re.sub(r"\s+", "_", s.strip())
        normalized = s.lower()
        logger.debug(f"Cabeçalho normalizado: {normalized}")
        return normalized
    except Exception as e:
        logger.error(f"Erro ao normalizar cabeçalho '{col}': {str(e)}")
        raise

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def read_csv(path: str) -> tuple[pd.DataFrame, Dict[str, str]]:
    """Lê arquivo CSV e mostra o conteúdo lido para debug."""
    print(f"[DEBUG] Lendo arquivo CSV: {path}")
    df = pd.read_csv(path, dtype=str, keep_default_na=False)
    print(f"[DEBUG] Primeiras linhas lidas do CSV:\n{df.head(10).to_string(index=False)}")
    header_mapping = {col: normalize_header(col) for col in df.columns}
    df = df.rename(columns=header_mapping)
    return df, header_mapping

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def convert_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Converte tipos de colunas com validações e retry mechanism."""
    logger.info("Iniciando conversão de colunas")
    logger.debug(f"Colunas antes da conversão: {df.columns.tolist()}")
    logger.debug(f"Tipos antes da conversão:\n{df.dtypes}")

    try:
        # Inteiros
        if "qtd_usada_unidades" in df.columns:
            logger.info("Convertendo coluna qtd_usada_unidades para inteiro")
            df["qtd_usada_unidades"] = pd.to_numeric(
                df["qtd_usada_unidades"], errors="coerce"
            ).fillna(0).astype(int)
        
        # Floats
        if "custo_unitario_brl" in df.columns:
            logger.info("Convertendo coluna custo_unitario_brl para float")
            df["custo_unitario_brl"] = pd.to_numeric(
                df["custo_unitario_brl"], errors="coerce"
            ).fillna(0.0)
        
        # Datas - convertendo para string ISO formatada
        if "data" in df.columns:
            logger.info("Convertendo coluna data para string ISO formatada")
            df["data"] = pd.to_datetime(
                df["data"], errors="coerce"
            ).dt.strftime("%Y-%m-%d")

        logger.debug(f"Tipos após conversão:\n{df.dtypes}")
        return df
    except Exception as e:
        logger.error(f"Erro ao converter colunas: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

def validate_schema(df: pd.DataFrame) -> None:
    """Valida se o DataFrame contém todas as colunas necessárias."""
    required_columns = set(EXPECTED_SCHEMA.keys())
    missing_columns = required_columns - set(df.columns)
    if missing_columns:
        raise ValueError(f"Colunas obrigatórias ausentes: {missing_columns}")

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def process_file(file_path: str, restaurant_id: str) -> Dict[str, Any]:
    try:
        print(f"[DEBUG] Iniciando processamento do arquivo: {file_path}")
        df, header_mapping = read_csv(file_path)
        # Adiciona restaurant_id como primeira coluna
        df.insert(0, "restaurant_id", restaurant_id)
        print(f"[DEBUG] Colunas após adicionar restaurant_id: {df.columns.tolist()}")
        df = convert_columns(df)
        print(f"[DEBUG] Colunas após convert_columns: {df.columns.tolist()}")
        now = datetime.now(timezone.utc).isoformat()
        df["created_at"] = now
        df["updated_at"] = now
        df["original_headers"] = json.dumps(header_mapping)
        print(f"[DEBUG] Colunas antes do to_dict: {df.columns.tolist()}")
        records = df.where(pd.notnull(df), None).to_dict(orient="records")
        if not records:
            raise ValueError("Nenhum registro válido encontrado no CSV.")
        print(f"[DEBUG] Primeira linha dos registros retornados pelo Python:\n{json.dumps(records[0], ensure_ascii=False, indent=2)}")
        print(f"[DEBUG] Registros prontos para salvar (primeiros 5):\n{json.dumps(records[:5], ensure_ascii=False, indent=2)}")
        return {"records": records, "header_mapping": header_mapping}
    except Exception as e:
        print(f"[ERROR] Falha em process_file: {str(e)}")
        return {"error": str(e)}

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def save_to_bigquery(data: Dict[str, Any], project_id: str, dataset_id: str) -> Dict[str, Any]:
    """Salva dados no BigQuery com validações e retry mechanism."""
    try:
        logger.info(f"Iniciando salvamento no BigQuery")
        logger.info(f"Projeto: {project_id}")
        logger.info(f"Dataset: {dataset_id}")
        
        logger.info("Criando cliente BigQuery")
        client = bigquery.Client(project=project_id)
        table_ref = f"{project_id}.{dataset_id}"
        logger.info(f"Referência da tabela: {table_ref}")

        # Configuração do job com schema explícito
        logger.info("Configurando job de carga")
        job_config = bigquery.LoadJobConfig(
            write_disposition="WRITE_APPEND",
            source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON
        )

        records = data.get("records", [])
        if not records:
            raise ValueError("Não há registros para inserir.")

        logger.info(f"Preparando carga de {len(records)} registros")
        logger.info("Iniciando carga no BigQuery")
        job = client.load_table_from_json(records, table_ref, job_config=job_config)
        logger.info("Aguardando conclusão do job")
        job.result()
        logger.info("Carga concluída com sucesso")
        return {"success": True}

    except Exception as e:
        logger.error(f"Falha em save_to_bigquery: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {"error": str(e)}

# CLI
if __name__ == "__main__":
    try:
        logger.info("Iniciando execução do script")
        
        # Validação de argumentos
        if len(sys.argv) != 3:
            error_msg = "Uso: processFile.py <caminho_csv> <restaurant_id>"
            logger.error(error_msg)
            print(json.dumps({"error": error_msg}))
            sys.exit(1)

        csv_path, restaurant_id = sys.argv[1], sys.argv[2]
        logger.info(f"Argumentos recebidos:")
        logger.info(f"CSV Path: {csv_path}")
        logger.info(f"Restaurant ID: {restaurant_id}")

        # Validação de ambiente
        validate_environment()
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
        dataset_id = os.getenv("GOOGLE_CLOUD_DATASET_FINANCE")

        logger.info("Iniciando processamento do arquivo")
        result = process_file(csv_path, restaurant_id)
        if "error" in result:
            logger.error(f"Erro no processamento: {result['error']}")
            print(json.dumps({"error": result["error"]}))
            sys.exit(1)

        logger.info("Iniciando salvamento no BigQuery")
        result_bq = save_to_bigquery(result, project_id, dataset_id)
        if "error" in result_bq:
            logger.error(f"Erro no salvamento: {result_bq['error']}")
            print(json.dumps({"error": result_bq["error"]}))
            sys.exit(1)

        logger.info("Processamento concluído com sucesso")
        print(json.dumps({"success": True}))
        sys.exit(0)

    except Exception as e:
        logger.error(f"Erro fatal: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
