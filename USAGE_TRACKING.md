# Sistema de Tracking de Tempo de Uso

Este documento descreve o sistema implementado para rastrear o tempo que os usuários passam na plataforma.

## Como Funciona

### 1. Banco de Dados
Foi criado um novo modelo `UsageSession` no Prisma schema com os seguintes campos:
- `id`: Identificador único da sessão
- `userId`: ID do usuário (referência para User)
- `loginTime`: Timestamp de quando o usuário fez login
- `logoutTime`: Timestamp de quando o usuário fez logout (null se ainda ativo)
- `duration`: Duração da sessão em segundos
- `date`: Data da sessão (para facilitar consultas por período)
- `active`: Boolean indicando se a sessão está ativa

### 2. APIs Criadas

#### `/api/usage-session/start` (POST)
- Inicia uma nova sessão de uso quando o usuário faz login
- Verifica se já existe uma sessão ativa e retorna ela se existir
- Requer token JWT no header Authorization

#### `/api/usage-session/end` (POST)
- Finaliza a sessão ativa do usuário
- Calcula a duração da sessão
- Requer token JWT no header Authorization

#### `/api/usage-session/heartbeat` (POST)
- Mantém a sessão viva atualizando o timestamp
- Chamado automaticamente a cada 30 segundos pelo frontend
- Requer token JWT no header Authorization

#### `/api/usage-session/cleanup` (POST)
- Finaliza sessões órfãs (ativas há mais de 2 horas)
- Pode ser chamado periodicamente por um cron job
- Útil para casos onde o usuário fechou o navegador sem fazer logout

#### `/api/usage-session/stats` (GET)
- Retorna estatísticas de uso (apenas para administradores)
- Parâmetros opcionais: userId, startDate, endDate
- Retorna estatísticas por usuário, por dia, e resumo geral

### 3. Frontend

#### Hook `useUsageTracking`
- Gerencia automaticamente o tracking baseado no status de autenticação
- Inicia tracking quando usuário faz login
- Finaliza tracking quando usuário faz logout
- Envia heartbeat a cada 30 segundos para manter sessão viva
- Detecta quando aba fica inativa/ativa
- Tenta finalizar sessão quando navegador é fechado

#### Componente `UsageTracker`
- Componente invisível que utiliza o hook `useUsageTracking`
- Adicionado no layout principal da aplicação

### 4. Integração com Sistema de Auth

#### Login (`/api/auth/login`)
- Automaticamente fecha sessões abertas anteriores
- Cria nova sessão de uso ao fazer login bem-sucedido

#### Complete Login (`/api/auth/complete-login`)
- Também inicia sessão para usuários que completam login após escolher equipe

#### Logout (`/api/auth/logout`)
- Automaticamente finaliza todas as sessões ativas do usuário
- Calcula duração correta das sessões

### 5. Funcionamento Detalhado

1. **Login**: Usuário faz login → Sistema cria nova sessão no banco
2. **Uso Ativo**: A cada 30 segundos, frontend envia heartbeat para manter sessão viva
3. **Detecção de Inatividade**: Se aba fica inativa, heartbeat para, mas sessão não é finalizada
4. **Logout Manual**: Usuário clica em logout → Sistema finaliza sessão e calcula duração
5. **Fechamento Abrupto**: Sistema detecta fechamento de navegador e tenta finalizar sessão
6. **Cleanup**: Sessões órfãs (>2h ativas) são automaticamente finalizadas

### 6. Tratamento de Casos Especiais

- **Múltiplas Abas**: Apenas uma sessão ativa por usuário (nova sessão fecha as anteriores)
- **Sessões Órfãs**: Limpeza automática de sessões abandonadas
- **Reconexão**: Se usuário já tem sessão ativa, retorna a existente
- **Erros de Rede**: Heartbeat falha silenciosamente, não afeta experiência do usuário

### 7. Privacidade e Segurança

- Dados ficam apenas no banco, não são exibidos para usuários
- Apenas administradores podem acessar estatísticas (API stats)
- Token JWT necessário para todas as operações
- Dados são agregados e anonimizados nas estatísticas

### 8. Manutenção

Para manter o sistema funcionando corretamente:

1. **Cleanup Regular**: Execute `/api/usage-session/cleanup` periodicamente
2. **Monitoramento**: Verifique se não há acúmulo de sessões órfãs
3. **Performance**: Considere arquivar sessões antigas se necessário

## Exemplo de Uso das Estatísticas

```javascript
// Para administradores - buscar estatísticas dos últimos 30 dias
const response = await fetch('/api/usage-session/stats?startDate=2024-01-01&endDate=2024-01-31', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const stats = await response.json();
console.log('Total de sessões:', stats.totalSessions);
console.log('Tempo total:', stats.totalTimeFormatted);
console.log('Tempo médio por sessão:', stats.averageSessionTimeFormatted);
```

## Considerações Técnicas

- O sistema é resiliente a falhas de rede
- Não impacta a performance da aplicação
- Funciona offline (sincroniza quando reconecta)
- Compatível com diferentes navegadores
- Preparado para escalar com o crescimento da plataforma
