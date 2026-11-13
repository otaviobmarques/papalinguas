-- Login próprio do painel (usuário + senha com hash scrypt) e cofre de chaves de integração.
-- Senhas e chaves nunca são guardadas em texto: senha só como hash; chave cifrada (AES-256-GCM)
-- com a chave mestra KEYS_ENCRYPTION_KEY, que fica só nas variáveis de ambiente do servidor.

alter table public.admin_users drop constraint if exists admin_users_id_fkey;
alter table public.admin_users alter column id set default gen_random_uuid();
alter table public.admin_users add column if not exists username text;
alter table public.admin_users add column if not exists password_hash text;
create unique index if not exists admin_users_username_idx on public.admin_users (lower(username));

create table public.integration_keys (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('openai', 'anthropic', 'azure_speech', 'asaas', 'resend')),
  slot text not null default 'principal' check (slot in ('principal', 'backup')),
  ciphertext text not null,          -- base64(iv | tag | dados)
  last4 text not null,
  status text not null default 'nao_validada' check (status in ('valida', 'invalida', 'nao_validada')),
  validated_at timestamptz,
  updated_by uuid references public.admin_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, slot)
);
create index integration_keys_updated_by_idx on public.integration_keys (updated_by);
create trigger integration_keys_updated_at before update on public.integration_keys
  for each row execute function private.set_updated_at();

-- Sem políticas: só o servidor (service_role) lê e escreve.
alter table public.integration_keys enable row level security;
revoke all on public.integration_keys from anon, authenticated;
