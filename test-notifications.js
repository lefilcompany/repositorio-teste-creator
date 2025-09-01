// Script de teste para verificar notificações
// Execute no console do navegador após fazer login

console.log('🧪 Testando sistema de notificações...');

// 1. Verificar se o Supabase está configurado
if (typeof window !== 'undefined') {
  console.log('✅ Browser environment detectado');
  
  // 2. Verificar variáveis de ambiente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseKey) {
    console.log('✅ Variáveis do Supabase configuradas');
  } else {
    console.log('❌ Variáveis do Supabase não encontradas');
    console.log('Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  
  // 3. Verificar token de autenticação
  const token = localStorage.getItem('authToken');
  if (token) {
    console.log('✅ Token de autenticação encontrado');
  } else {
    console.log('❌ Token de autenticação não encontrado');
    console.log('Faça login primeiro');
  }
  
  // 4. Testar API de notificações
  async function testNotificationsAPI() {
    try {
      const response = await fetch('/api/notifications?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API de notificações funcionando');
        console.log('📊 Notificações encontradas:', data.notifications?.length || 0);
      } else {
        console.log('❌ Erro na API de notificações:', response.status);
      }
    } catch (error) {
      console.log('❌ Erro ao testar API:', error);
    }
  }
  
  // 5. Testar criação de notificação
  async function testCreateNotification() {
    try {
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'test-user-id',
          title: 'Teste de Notificação',
          body: 'Esta é uma notificação de teste!',
          type: 'TEST'
        })
      });
      
      if (response.ok) {
        console.log('✅ Criação de notificação funcionando');
      } else {
        console.log('❌ Erro ao criar notificação:', response.status);
      }
    } catch (error) {
      console.log('❌ Erro ao testar criação:', error);
    }
  }
  
  // Executar testes
  if (token) {
    testNotificationsAPI();
    testCreateNotification();
  }
}

// 6. Verificar permissões de notificação
if ('Notification' in window) {
  console.log('✅ Notificações nativas suportadas');
  console.log('📱 Status da permissão:', Notification.permission);
  
  if (Notification.permission === 'default') {
    console.log('💡 Execute Notification.requestPermission() para habilitar');
  }
} else {
  console.log('❌ Notificações nativas não suportadas');
}

console.log('🎯 Para testar notificações em tempo real:');
console.log('1. Configure o Supabase com o script supabase-setup.sql');
console.log('2. Adicione as variáveis de ambiente');
console.log('3. Habilite o Realtime no dashboard do Supabase');
console.log('4. Execute: fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: "seu-user-id", title: "Teste", body: "Notificação de teste" }) })');
