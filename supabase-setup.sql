-- Configuração do Supabase para notificações em tempo real
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Criar tabela de notificações (se não existir)
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  message    text not null,
  type       text not null,
  read_at    timestamptz,
  created_at timestamptz not null default now(),
  team_name  text,
  metadata   jsonb
);

-- 2. Habilitar Row Level Security
alter table public.notifications enable row level security;

-- 3. Políticas de segurança
-- Usuários podem ler apenas suas próprias notificações
create policy "users can read own notifications"
on public.notifications
for select
using (auth.uid()::text = user_id::text);

-- Apenas o sistema pode inserir notificações (via service role)
create policy "system can insert notifications"
on public.notifications
for insert
with check (true);

-- Usuários podem atualizar apenas suas próprias notificações
create policy "users can update own notifications"
on public.notifications
for update
using (auth.uid()::text = user_id::text)
with check (auth.uid()::text = user_id::text);

-- 4. Habilitar Realtime para a tabela
alter publication supabase_realtime add table public.notifications;

-- 5. Criar índices para performance
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);
create index if not exists idx_notifications_read_at on public.notifications(read_at);

-- 6. Função para limpar notificações antigas (opcional)
create or replace function cleanup_old_notifications()
returns void
language plpgsql
security definer
as $$
begin
  -- Deletar notificações lidas com mais de 30 dias
  delete from public.notifications 
  where read_at is not null 
    and read_at < now() - interval '30 days';
  
  -- Deletar notificações não lidas com mais de 90 dias
  delete from public.notifications 
  where read_at is null 
    and created_at < now() - interval '90 days';
end;
$$;

-- 7. Agendar limpeza automática (opcional)
-- select cron.schedule('cleanup-notifications', '0 2 * * *', 'select cleanup_old_notifications();');
