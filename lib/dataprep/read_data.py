import pandas as pd
import os
from datetime import datetime
import json
from typing import Dict, List
from google.cloud import bigquery
from google.oauth2 import service_account

def load_schema(schema_path: str) -> Dict:
    """
    Carrega o schema do BigQuery
    """
    with open(schema_path, 'r') as f:
        return json.load(f)

def process_csv_files(dataset_path: str) -> Dict[str, List[Dict]]:
    """
    Processa arquivos CSV e retorna dados estruturados para BigQuery
    """
    csv_files = [f for f in os.listdir(dataset_path) if f.endswith('.csv')]
    processed_data = {
        'revenues': [],
        'costs': []
    }
    
    for file in csv_files:
        try:
            # Ler o arquivo CSV
            df = pd.read_csv(os.path.join(dataset_path, file))
            
            # Processar cada linha
            for _, row in df.iterrows():
                date = datetime.strptime(row['data'], '%Y-%m-%d')
                now = datetime.now()
                
                # Preparar dados de receita para BigQuery
                revenue_data = {
                    'restaurant_id': 'restaurante-italiano-id',
                    'date': date.date().isoformat(),
                    'amount': float(row['receita']),
                    'description': f"Receita do dia {date.strftime('%d/%m/%Y')}",
                    'created_at': now.isoformat(),
                    'updated_at': now.isoformat()
                }
                processed_data['revenues'].append(revenue_data)
                
                # Preparar dados de custo fixo para BigQuery
                fixed_cost_data = {
                    'restaurant_id': 'restaurante-italiano-id',
                    'date': date.date().isoformat(),
                    'amount': float(row['custo_fixo']),
                    'type': 'FIXED',
                    'description': f"Custo fixo do dia {date.strftime('%d/%m/%Y')}",
                    'created_at': now.isoformat(),
                    'updated_at': now.isoformat()
                }
                processed_data['costs'].append(fixed_cost_data)
                
                # Preparar dados de custo variável para BigQuery
                variable_cost_data = {
                    'restaurant_id': 'restaurante-italiano-id',
                    'date': date.date().isoformat(),
                    'amount': float(row['custo_variavel']),
                    'type': 'VARIABLE',
                    'description': f"Custo variável do dia {date.strftime('%d/%m/%Y')}",
                    'created_at': now.isoformat(),
                    'updated_at': now.isoformat()
                }
                processed_data['costs'].append(variable_cost_data)
                
        except Exception as e:
            print(f"Erro ao processar arquivo {file}: {str(e)}")
            continue
            
    return processed_data

def create_table_if_not_exists(client: bigquery.Client, project_id: str, dataset_id: str, table_name: str, schema: Dict):
    """
    Cria a tabela no BigQuery se ela não existir
    """
    table_id = f"{project_id}.{dataset_id}.{table_name}"
    
    try:
        client.get_table(table_id)
        print(f"Tabela {table_name} já existe")
    except Exception:
        # Converter schema JSON para schema do BigQuery
        bigquery_schema = []
        for field in schema['fields']:
            bigquery_schema.append(
                bigquery.SchemaField(
                    field['name'],
                    field['type'],
                    mode=field['mode'],
                    description=field['description']
                )
            )
        
        # Criar tabela
        table = bigquery.Table(table_id, schema=bigquery_schema)
        table = client.create_table(table)
        print(f"Tabela {table_name} criada com sucesso")

def upload_to_bigquery(data: Dict[str, List[Dict]], project_id: str, dataset_id: str, schema_path: str):
    """
    Faz upload dos dados para o BigQuery
    """
    # Configurar credenciais
    credentials = service_account.Credentials.from_service_account_file(
        'path/to/your/service-account-key.json'
    )
    
    # Inicializar cliente do BigQuery
    client = bigquery.Client(project=project_id, credentials=credentials)
    
    # Carregar schema
    schema = load_schema(schema_path)
    
    # Criar tabelas se não existirem
    create_table_if_not_exists(client, project_id, dataset_id, 'revenues', schema['revenues'])
    create_table_if_not_exists(client, project_id, dataset_id, 'costs', schema['costs'])
    
    # Upload dos dados
    try:
        # Upload de receitas
        job_config = bigquery.LoadJobConfig(
            schema=[bigquery.SchemaField.from_api_repr(field) for field in schema['revenues']['fields']],
            write_disposition=bigquery.WriteDisposition.WRITE_APPEND
        )
        job = client.load_table_from_json(
            data['revenues'],
            f"{project_id}.{dataset_id}.revenues",
            job_config=job_config
        )
        job.result()
        print(f"Upload de receitas concluído: {len(data['revenues'])} registros")
        
        # Upload de custos
        job_config = bigquery.LoadJobConfig(
            schema=[bigquery.SchemaField.from_api_repr(field) for field in schema['costs']['fields']],
            write_disposition=bigquery.WriteDisposition.WRITE_APPEND
        )
        job = client.load_table_from_json(
            data['costs'],
            f"{project_id}.{dataset_id}.costs",
            job_config=job_config
        )
        job.result()
        print(f"Upload de custos concluído: {len(data['costs'])} registros")
        
    except Exception as e:
        print(f"Erro ao fazer upload para BigQuery: {str(e)}")

def main():
    # Configurações
    dataset_path = "restaurante_italiano_dataset"
    project_id = "seu-projeto-id"
    dataset_id = "seu-dataset-id"
    schema_path = "lib/dataprep/bigquery_schema.json"
    
    # Processar arquivos
    processed_data = process_csv_files(dataset_path)
    
    # Fazer upload para BigQuery
    upload_to_bigquery(processed_data, project_id, dataset_id, schema_path)
    
    print("Processamento concluído!")

if __name__ == "__main__":
    main() 