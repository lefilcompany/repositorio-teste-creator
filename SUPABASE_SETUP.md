# Configuração do Supabase para Notificações em Tempo Real

## 1. Configurar Supabase

### 1.1 Criar projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL e as chaves (anon key e service role key)

### 1.2 Executar script SQL
1. No dashboard do Supabase, vá para **SQL Editor**
2. Execute o script `supabase-setup.sql`
3. Vá para **Database → Replication → Supabase Realtime**
4. Adicione a tabela `public.notifications` ao Realtime

## 2. Configurar Variáveis de Ambiente

Adicione ao seu arquivo `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 3. Instalar Dependências

```bash
npm install @supabase/supabase-js
```

## 4. Como Funciona

### 4.1 Fluxo de Notificações
1. **Criação**: Notificação é criada no Prisma (banco principal)
2. **Sincronização**: Automaticamente sincronizada com Supabase
3. **Realtime**: Supabase envia atualização em tempo real para o cliente
4. **Interface**: Componente atualiza automaticamente sem F5

### 4.2 Benefícios
- ✅ **Tempo Real**: Notificações aparecem instantaneamente
- ✅ **Sem F5**: Interface atualiza automaticamente
- ✅ **Notificações Nativas**: Alertas do navegador
- ✅ **Banco Preservado**: Mantém Prisma como banco principal
- ✅ **Fallback**: Funciona mesmo se Supabase estiver indisponível

## 5. Testando

### 5.1 Teste Manual
1. Faça login no sistema
2. Abra o console do navegador
3. Execute: `fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: 'seu-user-id', title: 'Teste', body: 'Notificação de teste' }) })`
4. A notificação deve aparecer instantaneamente

### 5.2 Teste de Equipe
1. Crie uma solicitação de entrada na equipe
2. O admin deve receber notificação em tempo real
3. Aprove/rejeite a solicitação
4. O usuário deve receber notificação em tempo real

## 6. Troubleshooting

### 6.1 Notificações não aparecem
- Verifique se o Realtime está habilitado no Supabase
- Confirme se as variáveis de ambiente estão corretas
- Verifique o console do navegador para erros

### 6.2 Erro de conexão
- O sistema funciona em modo fallback (sem tempo real)
- Notificações ainda aparecem ao recarregar a página

### 6.3 Permissões de notificação
- O navegador pode bloquear notificações nativas
- Verifique as configurações do navegador

## 7. Monitoramento

### 7.1 Logs do Supabase
- Dashboard → Logs → Realtime
- Monitore conexões e eventos

### 7.2 Logs da Aplicação
- Console do navegador para erros de cliente
- Logs do servidor para erros de sincronização
