const https = require('https');
const fs = require('fs');

const envStr = fs.readFileSync('.env.local', 'utf8') || fs.readFileSync('.env', 'utf8');
const VITE_SUPABASE_URL = envStr.match(/VITE_SUPABASE_URL\s*=\s*(.*)/)[1].trim();
const VITE_SUPABASE_ANON_KEY = envStr.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.*)/)[1].trim();

const url = new URL(`${VITE_SUPABASE_URL}/rest/v1/inventario_stock_sistema?select=id,sku,stock_sistema,created_at,articulos(nombre)&limit=1`);

const options = {
  headers: {
    'apikey': VITE_SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${VITE_SUPABASE_ANON_KEY}`
  }
};

https.get(url, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
}).on('error', err => console.error(err));
