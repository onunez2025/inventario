import pandas as pd
import json

# Leer el CSV con el delimitador correcto y encoding compatible con caracteres españoles
df = pd.read_csv('DATA MAESTRO ODOO 6.04.2026 (1).csv', sep=';', encoding='latin-1')

# Limpiar datos
df['Costo'] = pd.to_numeric(df['Costo'], errors='coerce').fillna(0)
# Asegurar que EAN sea tratado de forma uniforme (quitar .0 si es float)
def clean_ean(val):
    val = str(val).strip()
    if val.endswith('.0'):
        return val[:-2]
    return val

df['EAN'] = df['EAN'].apply(clean_ean)
df = df[~df['EAN'].isin(['nan', 'None', '', '0', '0.0'])]
df = df.dropna(subset=['EAN'])

# Eliminar duplicados de EAN (SKU)
df = df.drop_duplicates(subset=['EAN'], keep='first')

# Eliminar duplicados de EAN (SKU) - Asegurar que sea lowercase para la comparación si es necesario, 
# aunque EAN suelen ser números.
df['EAN'] = df['EAN'].astype(str).str.strip()
df = df.drop_duplicates(subset=['EAN'], keep='first')

# Resumen de limpieza
print(f"Total filas después de deduplicar: {len(df)}")

# Generar bloques de SQL
batch_size = 300 # Reducimos un poco el tamaño para evitar problemas de timeout
total_rows = len(df)

for i in range(0, total_rows, batch_size):
    batch = df.iloc[i:i+batch_size]
    values = []
    for _, row in batch.iterrows():
        # Escapar comillas simples en el nombre y descripcion
        nombre = str(row['Nombre']).replace("'", "''")
        ean = str(row['EAN']).replace("'", "''")
        marca = str(row['Marca']).replace("'", "''")
        cat = str(row['Categoria']).replace("'", "''")
        costo = float(row['Costo'])
        
        values.append(f"('{ean}', '{nombre}', {costo}, '{cat}', '{marca}', 0)")
    
    sql = f"""
    INSERT INTO public.articulos (sku, nombre, costo_unitario, categoria, marca, stock_sistema)
    VALUES {', '.join(values)}
    ON CONFLICT (sku) DO UPDATE 
    SET nombre = EXCLUDED.nombre,
        costo_unitario = EXCLUDED.costo_unitario,
        categoria = EXCLUDED.categoria,
        marca = EXCLUDED.marca;
    """
    
    # Guardar en archivos temporales para ejecutar uno por uno
    with open(f'scripts/batch_{i//batch_size}.sql', 'w', encoding='utf-8') as f:
        f.write(sql)

print(f"Generados { (total_rows // batch_size) + 1 } lotes de SQL.")
