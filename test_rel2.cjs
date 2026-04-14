const https = require('https');

const VITE_SUPABASE_URL = 'https://evnyafuyhipkbdjknyax.supabase.co';
const VITE_SUPABASE_ANON_KEY = 'sb_publishable_i5Gdg-e2Xy4TzRI7Pf4nxA_Xz5A6Xqh';

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
