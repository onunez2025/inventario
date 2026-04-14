import pandas as pd
import requests
import json
import time

# Configuración
SUPABASE_URL = 'https://evnyafuyhipkbdjknyax.supabase.co'
SUPABASE_KEY = 'sb_publishable_i5Gdg-e2Xy4TzRI7Pf4nxA_Xz5A6Xqh'
TABLE_URL = f"{SUPABASE_URL}/rest/v1/articulos"

# Headers para Supabase
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

def clean_ean(val):
    val = str(val).strip()
    if val.endswith('.0'):
        return val[:-2]
    return val

def run_import():
    print("Iniciando importación robusta...")
    
    # 1. Leer y limpiar datos
    try:
        df = pd.read_csv('DATA MAESTRO ODOO 6.04.2026 (1).csv', sep=';', encoding='latin-1')
    except Exception as e:
        print(f"Error al leer CSV: {e}")
        return

    df['Costo'] = pd.to_numeric(df['Costo'], errors='coerce').fillna(0)
    df['EAN'] = df['EAN'].apply(clean_ean)
    df = df[~df['EAN'].isin(['nan', 'None', '', '0', '0.0'])]
    df = df.dropna(subset=['EAN'])
    df = df.drop_duplicates(subset=['EAN'], keep='first')
    
    total_rows = len(df)
    print(f"Total filas a procesar (deduplicadas): {total_rows}")

    # 2. Preparar registros
    records = []
    for _, row in df.iterrows():
        records.append({
            "sku": str(row['EAN']),
            "nombre": str(row['Nombre']),
            "costo_unitario": float(row['Costo']),
            "categoria": str(row['Categoria']),
            "marca": str(row['Marca']),
            "stock_sistema": 0
        })

    # 3. Subir en lotes
    batch_size = 100
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        try:
            # Supabase POST con on_conflict=sku y Prefer=resolution=merge-duplicates hace un upsert
            response = requests.post(
                f"{TABLE_URL}?on_conflict=sku",
                headers=HEADERS,
                data=json.dumps(batch)
            )
            
            if response.status_code in [200, 201]:
                print(f"Procesado lote {i//batch_size + 1}: {i + len(batch)} / {total_rows}")
            else:
                print(f"Error en lote {i//batch_size + 1}: {response.status_code} - {response.text}")
                # Reintentar una vez si es error de conexión
                time.sleep(1)
        except Exception as e:
            print(f"Excepción en lote {i//batch_size + 1}: {e}")
            time.sleep(2)

    print("¡Importación completada!")

if __name__ == "__main__":
    run_import()
