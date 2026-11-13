-- Papalinguas — schema base (Manual Técnico v2.2, seção 6)
-- Regras: ids uuid, created_at/updated_at, valores em centavos + moeda,
-- datas em UTC (timestamptz), RLS ligado em todas as tabelas.

create extension if not exists pgcrypto;
create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.lang_code as enum ('en', 'es', 'pt');
create type public.ui_locale as enum ('pt-BR', 'en', 'es');
create type public.cefr_level as enum ('A1', 'A2', 'B1', 'B2', 'C1');
create type public.user_status as enum ('ativo', 'suspenso', 'banido', 'em_exclusao', 'excluido');
create type public.content_status as enum ('rascunho', 'revisao', 'publicado');
create type public.subscription_status as enum ('pendente', 'em_garantia', 'ativa', 'inadimplente', 'cancelada', 'expirada');
create type public.payment_gateway as enum ('asaas', 'mercadopago', 'stripe');
create type public.payment_method as enum ('pix', 'pix_automatico', 'cartao', 'boleto');
create type public.payment_status as enum ('pendente', 'confirmado', 'falhou', 'reembolsado', 'contestado', 'cancelado');
create type public.currency_code as enum ('BRL', 'USD');
create type public.billing_period as enum ('mensal', 'anual');
create type public.lesson_status as enum ('abrindo', 'ao_vivo', 'encerrada', 'falhou');
create type public.report_status as enum ('gerando', 'pronto', 'falhou', 'sem_relatorio');
create type public.consent_type as enum ('termos', 'privacidade', 'voz', 'marketing', 'maioridade', 'cookies');
create type public.admin_role as enum ('super_admin', 'administrador', 'financeiro', 'suporte', 'conteudo', 'moderacao', 'leitura');

-- ---------------------------------------------------------------------------
-- Funções utilitárias
-- ---------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Contas e aprendizagem
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  ui_locale public.ui_locale not null default 'pt-BR',
  country text not null default 'BR',
  cpf text,
  terms_version text,
  terms_accepted_at timestamptz,
  adult_confirmed boolean not null default false,
  status public.user_status not null default 'ativo',
  suspended_until timestamptz,
  deletion_requested_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index users_email_idx on public.users (lower(email)) where deleted_at is null;

create table public.tutors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  language public.lang_code not null,
  accent text not null,
  gender text not null check (gender in ('feminino', 'masculino')),
  style text not null,
  bio text,
  rive_file_url text,
  rive_version int not null default 1,
  thumbnail_url text,
  openai_voice text not null,
  base_prompt text not null,
  base_prompt_version int not null default 1,
  plans_allowed text[] not null default array['essencial', 'fluente'],
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tutors_language_idx on public.tutors (language) where active;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  target_language public.lang_code not null,
  is_primary boolean not null default true,
  level public.cefr_level,
  level_confidence numeric(3, 2),
  level_tested_at timestamptz,
  goal text check (goal in ('carreira', 'viagem', 'prova', 'morar_fora', 'conversar')),
  interests text[] not null default '{}',
  daily_goal_minutes int not null default 10 check (daily_goal_minutes in (5, 10, 15, 20)),
  tutor_id uuid references public.tutors (id) on delete set null,
  tutor_speed numeric(3, 2) not null default 1.0,
  captions_default boolean not null default true,
  reminder_time time,
  acolher jsonb not null default '{"ativo": false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, target_language)
);
create index profiles_tutor_id_idx on public.profiles (tutor_id);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type public.consent_type not null,
  version text not null,
  granted boolean not null default true,
  ip inet,
  source text not null default 'app',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index consents_user_id_idx on public.consents (user_id, type);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  fingerprint text not null,
  platform text,
  push_endpoint text,
  push_keys jsonb,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index devices_user_id_idx on public.devices (user_id);
create index devices_fingerprint_idx on public.devices (fingerprint);

-- ---------------------------------------------------------------------------
-- Conteúdo
-- ---------------------------------------------------------------------------
create table public.units (
  id uuid primary key default gen_random_uuid(),
  language public.lang_code not null,
  level public.cefr_level not null,
  position int not null,
  title text not null,
  status public.content_status not null default 'rascunho',
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index units_lang_level_idx on public.units (language, level, position);

create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units (id) on delete cascade,
  slug text not null unique,
  title text not null,
  situation text not null,
  missions jsonb not null default '[]'::jsonb,
  vocabulary jsonb not null default '[]'::jsonb,
  tutor_script text not null default '',
  themes text[] not null default '{}',
  goals text[] not null default '{}',
  estimated_minutes int not null default 8,
  fluente_only boolean not null default false,
  status public.content_status not null default 'rascunho',
  version int not null default 1,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index scenarios_unit_id_idx on public.scenarios (unit_id);
create index scenarios_published_idx on public.scenarios (status) where status = 'publicado';

-- ---------------------------------------------------------------------------
-- Aulas, pronúncia, relatórios, revisão
-- ---------------------------------------------------------------------------
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  tutor_id uuid references public.tutors (id) on delete set null,
  scenario_id uuid references public.scenarios (id) on delete set null,
  language public.lang_code not null,
  kind text not null default 'aula' check (kind in ('aula', 'livre', 'nivelamento')),
  status public.lesson_status not null default 'abrindo',
  started_at timestamptz not null default now(),
  live_at timestamptz,
  last_heartbeat_at timestamptz,
  ended_at timestamptz,
  seconds_billed int not null default 0,
  voice_provider text,
  voice_model text,
  pronunciation_provider text,
  estimated_cost_usd_micros bigint not null default 0,
  end_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lessons_user_started_idx on public.lessons (user_id, started_at desc);
create index lessons_tutor_id_idx on public.lessons (tutor_id);
create index lessons_scenario_id_idx on public.lessons (scenario_id);

create table public.lesson_events (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  speaker text not null check (speaker in ('aluno', 'tutor', 'sistema')),
  text text,
  event_type text not null default 'fala',
  occurred_at timestamptz not null default now(),
  latency_ms int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lesson_events_lesson_idx on public.lesson_events (lesson_id, occurred_at);
create index lesson_events_user_id_idx on public.lesson_events (user_id);

create table public.pronunciation_scores (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  word text not null,
  accuracy numeric(5, 2) not null,
  phonemes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pronunciation_scores_lesson_idx on public.pronunciation_scores (lesson_id);
create index pronunciation_scores_user_idx on public.pronunciation_scores (user_id, created_at desc);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null unique references public.lessons (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  status public.report_status not null default 'gerando',
  overall_score int check (overall_score between 0 and 100),
  missions_done int not null default 0,
  words_spoken int not null default 0,
  grammar jsonb not null default '[]'::jsonb,
  vocabulary jsonb not null default '[]'::jsonb,
  pronunciation jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reports_user_id_idx on public.reports (user_id);

create table public.review_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  language public.lang_code not null,
  source_lesson_id uuid references public.lessons (id) on delete set null,
  front text not null,
  back text not null,
  audio_url text,
  half_life_hours numeric(10, 2) not null default 24,
  next_review_at timestamptz not null default now(),
  history jsonb not null default '[]'::jsonb,
  suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index review_items_user_next_idx on public.review_items (user_id, next_review_at) where not suspended;
create index review_items_lesson_idx on public.review_items (source_lesson_id);

create table public.progress_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  day date not null,
  seconds_spoken int not null default 0,
  lessons_count int not null default 0,
  reviews_count int not null default 0,
  goal_met boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  earned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);
create index user_achievements_achievement_idx on public.user_achievements (achievement_id);

create table public.memory_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  fact text not null,
  source_lesson_id uuid references public.lessons (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index memory_facts_user_idx on public.memory_facts (user_id);
create index memory_facts_lesson_idx on public.memory_facts (source_lesson_id);

-- ---------------------------------------------------------------------------
-- Planos, assinaturas, cotas, pagamentos
-- ---------------------------------------------------------------------------
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null,                     -- essencial | fluente | pacote_extra
  price_version int not null default 1,
  name text not null,
  kind text not null default 'assinatura' check (kind in ('assinatura', 'pacote')),
  period public.billing_period,
  price_brl_cents int not null check (price_brl_cents >= 0),
  price_usd_cents int check (price_usd_cents >= 0),
  minutes_per_cycle int not null check (minutes_per_cycle >= 0),
  daily_limit_minutes int,
  languages_allowed int not null default 1,
  validity_days int,                      -- pacotes: 90
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (code, period, price_version)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  plan_id uuid not null references public.plans (id),
  gateway public.payment_gateway not null,
  method public.payment_method,
  external_id text,
  external_customer_id text,
  status public.subscription_status not null default 'pendente',
  is_first_subscription boolean not null default true,
  started_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  pending_plan_id uuid references public.plans (id),
  past_due_since timestamptz,
  canceled_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions (user_id, created_at desc);
create index subscriptions_plan_idx on public.subscriptions (plan_id);
create index subscriptions_pending_plan_idx on public.subscriptions (pending_plan_id);
create unique index subscriptions_external_idx on public.subscriptions (gateway, external_id) where external_id is not null;

create table public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  cycle_start timestamptz not null,
  cycle_end timestamptz not null,
  cycle_seconds_quota int not null,
  cycle_seconds_used int not null default 0,
  bonus_seconds int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subscription_id, cycle_start)
);
create index usage_counters_user_idx on public.usage_counters (user_id, cycle_end desc);

-- Pacotes extras: saldo próprio com validade (60 min / 90 dias)
create table public.extra_packs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  plan_id uuid not null references public.plans (id),
  payment_id uuid,
  seconds_total int not null,
  seconds_used int not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index extra_packs_user_idx on public.extra_packs (user_id, expires_at);
create index extra_packs_plan_idx on public.extra_packs (plan_id);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  gateway public.payment_gateway not null,
  external_id text,
  number text,
  status text not null default 'agendada' check (status in ('agendada', 'emitida', 'cancelada', 'erro')),
  pdf_url text,
  xml_url text,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index invoices_user_idx on public.invoices (user_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  plan_id uuid references public.plans (id),
  gateway public.payment_gateway not null,
  external_id text not null,
  method public.payment_method not null,
  status public.payment_status not null default 'pendente',
  currency public.currency_code not null default 'BRL',
  amount_cents int not null check (amount_cents >= 0),
  fee_cents int,
  net_cents int,
  invoice_id uuid references public.invoices (id) on delete set null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index payments_external_idx on public.payments (gateway, external_id);
create index payments_user_idx on public.payments (user_id, created_at desc);
create index payments_subscription_idx on public.payments (subscription_id);
create index payments_plan_idx on public.payments (plan_id);
create index payments_invoice_idx on public.payments (invoice_id);

alter table public.extra_packs
  add constraint extra_packs_payment_fk foreign key (payment_id) references public.payments (id) on delete set null;
create index extra_packs_payment_idx on public.extra_packs (payment_id);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id),
  amount_cents int not null check (amount_cents > 0),
  reason text not null,
  kind text not null default 'manual' check (kind in ('arrependimento', 'manual')),
  approved_by uuid,
  status text not null default 'solicitado' check (status in ('solicitado', 'aprovado', 'recusado', 'concluido', 'falhou')),
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index refunds_payment_idx on public.refunds (payment_id);

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id),
  external_id text,
  respond_by timestamptz,
  evidence jsonb not null default '{}'::jsonb,
  result text check (result in ('aberta', 'ganha', 'perdida')) default 'aberta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index disputes_payment_idx on public.disputes (payment_id);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  discount_type text not null check (discount_type in ('percentual', 'valor')),
  discount_value int not null check (discount_value > 0), -- % ou centavos
  valid_from timestamptz,
  valid_until timestamptz,
  max_redemptions int,
  plan_codes text[] not null default '{}',
  first_cycle_only boolean not null default true,
  status text not null default 'ativo' check (status in ('ativo', 'pausado', 'encerrado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index coupons_code_idx on public.coupons (upper(code));

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons (id),
  user_id uuid not null references public.users (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coupon_id, user_id)
);
create index coupon_redemptions_user_idx on public.coupon_redemptions (user_id);
create index coupon_redemptions_sub_idx on public.coupon_redemptions (subscription_id);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.users (id) on delete cascade,
  referred_id uuid references public.users (id) on delete set null,
  reward jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index referrals_referrer_idx on public.referrals (referrer_id);
create index referrals_referred_idx on public.referrals (referred_id);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider public.payment_gateway not null,
  event_id text not null,
  event_type text not null,
  body jsonb not null,
  processed_at timestamptz,
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, event_id)
);
create index webhook_events_pending_idx on public.webhook_events (created_at) where processed_at is null;

-- Antiabuso: um nivelamento e uma garantia por CPF, e-mail, dispositivo e cartão
create table public.abuse_markers (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('nivelamento', 'garantia')),
  identifier_type text not null check (identifier_type in ('cpf', 'email', 'device', 'card')),
  identifier_hash text not null,
  user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, identifier_type, identifier_hash)
);
create index abuse_markers_user_idx on public.abuse_markers (user_id);

-- ---------------------------------------------------------------------------
-- Suporte, moderação, notificações
-- ---------------------------------------------------------------------------
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  subject text not null,
  status text not null default 'aberto' check (status in ('aberto', 'em_andamento', 'resolvido', 'fechado')),
  priority text not null default 'normal' check (priority in ('baixa', 'normal', 'alta', 'urgente')),
  assignee_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index support_tickets_user_idx on public.support_tickets (user_id);
create index support_tickets_queue_idx on public.support_tickets (status, priority);

create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  author_type text not null check (author_type in ('aluno', 'atendente')),
  author_id uuid,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ticket_messages_ticket_idx on public.ticket_messages (ticket_id, created_at);

create table public.moderation_flags (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons (id) on delete cascade,
  user_id uuid references public.users (id) on delete set null,
  excerpt text not null,
  reason text not null,
  origin text not null check (origin in ('filtro', 'aluno')),
  status text not null default 'aberta' check (status in ('aberta', 'resolvida', 'descartada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index moderation_flags_lesson_idx on public.moderation_flags (lesson_id);
create index moderation_flags_user_idx on public.moderation_flags (user_id);
create index moderation_flags_open_idx on public.moderation_flags (created_at) where status = 'aberta';

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  channel text not null check (channel in ('email', 'push')),
  template text not null,
  status text not null default 'pendente' check (status in ('pendente', 'enviado', 'falhou', 'aberto', 'clicado')),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Admin, auditoria, custos, configurações, privacidade
-- ---------------------------------------------------------------------------
create table public.admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null,
  role public.admin_role not null default 'leitura',
  totp_enabled boolean not null default false,
  failed_logins int not null default 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid references public.admin_users (id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  before jsonb,
  after jsonb,
  reason text,
  ip inet,
  created_at timestamptz not null default now()
);
create index audit_log_admin_idx on public.audit_log (admin_id, created_at desc);
create index audit_log_target_idx on public.audit_log (target_type, target_id);

-- Somente inclusão: bloqueia UPDATE/DELETE inclusive para o service role
create or replace function private.audit_log_immutable()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'audit_log é somente inclusão';
end;
$$;
create trigger audit_log_no_update before update or delete on public.audit_log
  for each row execute function private.audit_log_immutable();

create table public.provider_costs (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  provider text not null,
  user_id uuid references public.users (id) on delete set null,
  usd_micros bigint not null default 0,
  units numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index provider_costs_day_idx on public.provider_costs (day, provider);
create index provider_costs_user_idx on public.provider_costs (user_id, day);

create table public.settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.admin_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index settings_updated_by_idx on public.settings (updated_by);

create table public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  kind text not null check (kind in ('acesso', 'correcao', 'exclusao', 'portabilidade')),
  status text not null default 'aberto' check (status in ('aberto', 'em_andamento', 'respondido')),
  due_at timestamptz not null default (now() + interval '15 days'),
  response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index privacy_requests_user_idx on public.privacy_requests (user_id);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  for t in
    select c.table_name from information_schema.columns c
    where c.table_schema = 'public' and c.column_name = 'updated_at'
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function private.set_updated_at()',
      t || '_updated_at', t);
  end loop;
end $$;
