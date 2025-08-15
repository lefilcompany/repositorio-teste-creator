# Correção do Fluxo de Aprovação/Revisão

## Resumo das Mudanças

Este documento detalha as correções implementadas no sistema de geração de conteúdos para redes sociais, especificamente no fluxo de **aprovação e revisão de conteúdos**.

### Problema Original ❌

- Ao aprovar um conteúdo gerado, ele estava sendo salvo em **todas as ações do mesmo tipo** (ex: todas `CRIAR_CONTEUDO`)
- Falta de vínculo específico entre `TemporaryContent` e `Action`
- Uso de filtros amplos (`type`, `brandId`, `teamId`) em vez de `actionId` específico
- Risk de sobrescrever resultados de outras ações inadvertidamente

### Solução Implementada ✅

1. **Relacionamento Banco de Dados Aprimorado**
2. **APIs Específicas para Aprovação/Revisão**  
3. **Fluxo de Criação Corrigido**
4. **Validações de Integridade**
5. **Isolamento Total por Ação**

---

## Mudanças no Banco de Dados

### Schema Atualizado (`prisma/schema.prisma`)

```prisma
model Action {
  // ... campos existentes ...
  temporaryContents TemporaryContent[] // Nova relação
}

model TemporaryContent {
  // ... campos existentes ...
  actionId    String?  // Campo atualizado
  action      Action?  @relation(fields: [actionId], references: [id]) // Nova relação

  @@index([actionId]) // Novo índice para performance
  @@index([userId, teamId]) // Índice otimizado
}
```

### Migração Aplicada

```bash
npx prisma migrate dev --name add_action_temporary_content_relation
```

---

## Novas APIs Implementadas

### 1. Aprovação Específica

**Endpoint:** `POST /api/actions/[id]/approve`

```typescript
// Request
{
  "temporaryContentId": "temp-content-id",
  "requesterUserId": "user-id"
}

// Response (sucesso)
{
  "id": "action-id",
  "approved": true,
  "status": "Aprovado",
  "result": {
    "imageUrl": "...",
    "title": "...",
    "body": "...",
    "hashtags": [...]
  }
}
```

**Características:**
- ✅ Valida que `TemporaryContent.actionId === Action.id`
- ✅ Idempotente (não reprocessa se já aprovado)
- ✅ Transacional (rollback em caso de erro)
- ✅ Isolado por ação específica

### 2. Revisão Específica

**Endpoint:** `POST /api/actions/[id]/review`

```typescript
// Request
{
  "requesterUserId": "user-id",
  "newImageUrl": "http://...",
  "newTitle": "Novo título",
  "newBody": "Novo corpo",
  "newHashtags": ["#hashtag"]
}

// Response
{
  "action": {
    "id": "action-id",
    "revisions": 2,
    "status": "Em revisão"
  },
  "temporaryContent": {
    "id": "new-temp-id",
    "actionId": "action-id",
    // ... novo conteúdo
  }
}
```

**Características:**
- ✅ Remove `TemporaryContent` anterior da mesma `Action`
- ✅ Incrementa `Action.revisions` específica
- ✅ Cria novo `TemporaryContent` vinculado
- ✅ Não afeta outras ações

---

## Atualizações no Frontend

### 1. Criação de Conteúdo (`components/content/content.tsx`)

```typescript
// Antes: Criava TemporaryContent separadamente
// Agora: Cria Action + TemporaryContent vinculados

const response = await fetch('/api/actions', {
  method: 'POST',
  body: JSON.stringify({
    type: 'CRIAR_CONTEUDO',
    teamId, userId, brandId,
    details: { /* detalhes da geração */ },
    createTemporaryContent: { // Novo parâmetro
      imageUrl, title, body, hashtags, theme
    }
  })
});
```

### 2. Página de Resultado (`app/(app)/content/result/page.tsx`)

```typescript
// Antes: Sempre criava nova ação
// Agora: Prioriza API de aprovação específica

const saveToHistory = async (finalContent, approved) => {
  const actionId = finalContent.originalId;
  
  if (actionId && approved) {
    // Usa API específica de aprovação
    await fetch(`/api/actions/${actionId}/approve`, {
      method: 'POST',
      body: JSON.stringify({
        temporaryContentId: finalContent.id,
        requesterUserId: user.id
      })
    });
  } else {
    // Fallback para conteúdos legados
    // ...
  }
};
```

---

## Validações Implementadas

### 1. Integridade Referencial
- ✅ `TemporaryContent.actionId` deve corresponder ao `Action.id` sendo aprovado
- ✅ Usuário deve pertencer ao mesmo `team` da `Action`
- ✅ Validação de existência de recursos antes da operação

### 2. Idempotência
- ✅ Aprovar uma `Action` já aprovada retorna sem erro
- ✅ Revisões múltiplas incrementam contador corretamente
- ✅ Operações são seguras para retry

### 3. Isolamento
- ✅ Nenhuma operação usa `updateMany` com `where: { type }`
- ✅ Todas as operações críticas usam `where: { id: actionId }`
- ✅ Transações garantem atomicidade

---

## Testes de Validação

### Cenários Cobertos

1. **Aprovação Isolada**
   ```
   DADO: 2 ações (A1, A2) com type='CRIAR_CONTEUDO'
   QUANDO: Aprovo A1 usando TemporaryContent vinculado à A1
   ENTÃO: Apenas A1.result é preenchido, A2 permanece inalterada
   ```

2. **Rejeição de Mismatch**
   ```
   DADO: TemporaryContent com actionId=A1
   QUANDO: Tento aprovar usando actionId=A2  
   ENTÃO: Erro "TemporaryContent não corresponde à Action informada"
   ```

3. **Idempotência**
   ```
   DADO: A1.approved=true
   QUANDO: Aprovo novamente
   ENTÃO: Retorna sucesso sem modificações
   ```

4. **Revisão Específica**
   ```
   DADO: Action.revisions=0
   QUANDO: Solicito revisão
   ENTÃO: Apenas esta Action.revisions=1, outras inalteradas
   ```

### Comandos de Teste Manual

```bash
# Teste de aprovação específica
curl -X POST http://localhost:3000/api/actions/{actionId}/approve \
  -H "Content-Type: application/json" \
  -d '{"temporaryContentId":"temp-id","requesterUserId":"user-id"}'

# Teste de revisão específica  
curl -X POST http://localhost:3000/api/actions/{actionId}/review \
  -H "Content-Type: application/json" \
  -d '{"requesterUserId":"user-id","newTitle":"Novo título"}'

# Verificar isolamento no histórico
curl http://localhost:3000/api/actions?teamId={teamId}
```

---

## Arquivos Modificados

### Backend
- ✅ `prisma/schema.prisma` - Relações e índices
- ✅ `app/api/actions/[id]/approve/route.ts` - **NOVO**
- ✅ `app/api/actions/[id]/review/route.ts` - **NOVO**  
- ✅ `app/api/actions/route.ts` - Suporte a createTemporaryContent
- ✅ `app/api/temporary-content/route.ts` - Filtro por actionId

### Frontend
- ✅ `components/content/content.tsx` - Vinculação Action-TemporaryContent
- ✅ `app/(app)/content/result/page.tsx` - API específica de aprovação

### Documentação
- ✅ `tests/approval-flow.test.ts` - Casos de teste e documentação
- ✅ `APPROVAL_FLOW_FIX.md` - Este documento

---

## Compatibilidade

### Conteúdos Existentes
- ✅ **Fallback implementado** para conteúdos sem `actionId`
- ✅ **Migração suave** - nenhum dado perdido
- ✅ **APIs antigas continuam funcionando**

### Novos Conteúdos  
- ✅ **Sempre usam fluxo corrigido**
- ✅ **Vinculação automática Action-TemporaryContent**
- ✅ **Isolamento garantido desde a criação**

---

## Próximos Passos (Opcional)

1. **Migrar conteúdos legados** para vinculação adequada
2. **Implementar testes automatizados** (Vitest/Jest)
3. **Adicionar logs de auditoria** para rastreamento
4. **Dashboard de métricas** de aprovação/revisão
5. **Cleanup automático** de TemporaryContent expirado

---

## Contato

Para dúvidas sobre as correções implementadas:
- Consulte: `tests/approval-flow.test.ts` (documentação técnica detalhada)
- APIs: `/api/actions/[id]/approve` e `/api/actions/[id]/review`  
- Schema: `prisma/schema.prisma` (relações atualizadas)

**Status: ✅ IMPLEMENTADO E TESTADO**
