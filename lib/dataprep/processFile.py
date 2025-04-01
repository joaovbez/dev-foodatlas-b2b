import sys
import pandas as pd
import io
import json
import datetime

def process_file(file_path: str):
    # Exemplo simples: lê o arquivo Excel/CSV e retorna os dados processados.
    try:
        if file_path.lower().endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
    except Exception as e:
        return {"error": f"Erro ao ler o arquivo: {e}"}
    
    # Realize alguma limpeza simples – por exemplo, remover linhas completamente vazias
    df.dropna(axis=0, how="all", inplace=True)
    
    # Se houver datas, converte para string ISO
    df = df.where(pd.notnull(df), None)
    data = df.to_dict(orient="records")
    for record in data:
        for key, value in record.items():
            if isinstance(value, (datetime.datetime, datetime.date)):
                record[key] = value.isoformat()
    return data

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Arquivo não informado"}))
        sys.exit(1)
    file_path = sys.argv[1]
    resultado = process_file(file_path)
    print(json.dumps(resultado))
