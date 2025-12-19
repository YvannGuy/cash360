/**
 * Script pour rafraîchir le cache PostgREST
 * 
 * Usage: 
 *   npm run refresh-cache
 *   ou
 *   node scripts/refresh-postgrest-cache.js
 * 
 * Ce script appelle l'API pour forcer le rafraîchissement du cache PostgREST
 */

// Charger les variables d'environnement depuis .env.local si disponible
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv n'est pas installé, les variables d'env seront chargées depuis l'environnement système
}

const https = require('https');
const http = require('http');

const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const API_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!API_URL || !API_KEY) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n💡 Assurez-vous que ces variables sont définies dans votre .env.local');
  process.exit(1);
}

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function refreshCache() {
  try {
    console.log('🔄 Tentative de rafraîchissement du cache PostgREST...\n');

    // Option 1: Utiliser la fonction SQL directement via Supabase REST API
    const supabaseUrl = new URL(API_URL);
    const functionUrl = `${supabaseUrl.origin}/rest/v1/rpc/refresh_postgrest_schema`;
    
    console.log('📡 Appel de la fonction refresh_postgrest_schema...');
    
    const response = await makeRequest(functionUrl, {
      method: 'POST',
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    });

    if (response.status === 200 || response.status === 204) {
      console.log('✅ Notification envoyée à PostgREST pour rafraîchir le cache.');
      console.log('⏳ Attendez 30 secondes à 2 minutes...\n');
      
      // Attendre un peu puis tester
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Tester si la table est maintenant accessible
      const testUrl = `${supabaseUrl.origin}/rest/v1/tracking_events?select=id&limit=1`;
      const testResponse = await makeRequest(testUrl, {
        method: 'GET',
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${API_KEY}`,
        }
      });
      
      if (testResponse.status === 200) {
        console.log('🎉 SUCCÈS ! Le cache a été rafraîchi et la table tracking_events est maintenant accessible !');
      } else if (testResponse.status === 404 || (testResponse.data && testResponse.data.code === 'PGRST205')) {
        console.log('⚠️ Le cache n\'est pas encore rafraîchi. Cela peut prendre 1-2 minutes.');
        console.log('\n💡 Solutions:');
        console.log('   1. Attendez encore 1-2 minutes et réessayez');
        console.log('   2. Redémarrez votre projet Supabase:');
        console.log('      - https://supabase.com/dashboard');
        console.log('      - Votre projet > Settings > General > Restart project');
      } else {
        console.log('⚠️ Statut:', testResponse.status);
        console.log('💡 Le cache devrait se rafraîchir dans quelques minutes.');
      }
    } else {
      console.error('❌ Erreur:', response.status);
      if (response.data) {
        console.error('   Détails:', JSON.stringify(response.data, null, 2));
      }
      console.log('\n💡 Solution alternative: Redémarrez votre projet Supabase depuis le dashboard.');
      console.log('   https://supabase.com/dashboard > Votre projet > Settings > General > Restart project');
    }
  } catch (error) {
    console.error('❌ Erreur lors du rafraîchissement:', error.message);
    console.log('\n💡 Solution: Redémarrez votre projet Supabase depuis le dashboard.');
    console.log('   https://supabase.com/dashboard > Votre projet > Settings > General > Restart project');
  }
}

refreshCache();
