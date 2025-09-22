// scripts/test-api.js
const fetch = require('node-fetch');

async function testSubscriptionAPI() {
  try {
    // Simular um token JWT válido
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZ2MWF1ZjMwMDAwb3M5NHF1b2RnMGtkIiwiaWF0IjoxNzI3MDk0MDAwLCJleHAiOjE3MjcwOTc2MDB9.fake'; // Token fake para teste

    console.log('🔍 Testando API /api/teams/subscription-status...');
    
    const response = await fetch('http://localhost:3000/api/teams/subscription-status', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status da resposta:', response.status);
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.text();
    console.log('📝 Resposta bruta:', data);
    
    try {
      const jsonData = JSON.parse(data);
      console.log('🎯 Dados JSON:', JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('❌ Não é JSON válido');
    }

  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  }
}

testSubscriptionAPI();