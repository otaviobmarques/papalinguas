-- RLS (Manual Técnico v2.2, seções 6 e 13)
-- O aluno só lê e escreve as próprias linhas. Tabelas financeiras, de auditoria
-- e de configuração não têm política: só o servidor (service_role) acessa.
-- Escritas sensíveis (aulas, cota, revisão, consentimentos) passam pela API.

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- users: lê a própria linha; só pode alterar nome e idioma da interface
create policy users_select_own on public.users for select to authenticated
  using ((select auth.uid()) = id);
create policy users_update_own on public.users for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
revoke update on public.users from authenticated, anon;
grant update (name, ui_locale) on public.users to authenticated;

-- profiles: aluno edita preferências de aprendizagem (nível vem do servidor)
create policy profiles_select_own on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke update on public.profiles from authenticated, anon;
grant update (goal, interests, daily_goal_minutes, tutor_id, tutor_speed, captions_default,
              reminder_time, acolher, is_primary) on public.profiles to authenticated;

-- Leitura das próprias linhas
create policy consents_select_own on public.consents for select to authenticated
  using ((select auth.uid()) = user_id);
create policy devices_select_own on public.devices for select to authenticated
  using ((select auth.uid()) = user_id);
create policy lessons_select_own on public.lessons for select to authenticated
  using ((select auth.uid()) = user_id);
create policy lesson_events_select_own on public.lesson_events for select to authenticated
  using ((select auth.uid()) = user_id);
create policy pronunciation_select_own on public.pronunciation_scores for select to authenticated
  using ((select auth.uid()) = user_id);
create policy reports_select_own on public.reports for select to authenticated
  using ((select auth.uid()) = user_id);
create policy review_items_select_own on public.review_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy progress_select_own on public.progress_daily for select to authenticated
  using ((select auth.uid()) = user_id);
create policy user_achievements_select_own on public.user_achievements for select to authenticated
  using ((select auth.uid()) = user_id);
create policy subscriptions_select_own on public.subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy usage_select_own on public.usage_counters for select to authenticated
  using ((select auth.uid()) = user_id);
create policy extra_packs_select_own on public.extra_packs for select to authenticated
  using ((select auth.uid()) = user_id);
create policy payments_select_own on public.payments for select to authenticated
  using ((select auth.uid()) = user_id);
create policy invoices_select_own on public.invoices for select to authenticated
  using ((select auth.uid()) = user_id);
create policy privacy_requests_select_own on public.privacy_requests for select to authenticated
  using ((select auth.uid()) = user_id);

-- Memória do tutor: aluno pode ver e apagar
create policy memory_select_own on public.memory_facts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy memory_delete_own on public.memory_facts for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Suporte: aluno vê e abre os próprios chamados
create policy tickets_select_own on public.support_tickets for select to authenticated
  using ((select auth.uid()) = user_id);
create policy tickets_insert_own on public.support_tickets for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy ticket_messages_select_own on public.ticket_messages for select to authenticated
  using (exists (select 1 from public.support_tickets t
                 where t.id = ticket_id and t.user_id = (select auth.uid())));
create policy ticket_messages_insert_own on public.ticket_messages for insert to authenticated
  with check (author_type = 'aluno' and author_id = (select auth.uid())
              and exists (select 1 from public.support_tickets t
                          where t.id = ticket_id and t.user_id = (select auth.uid())));

-- Catálogos públicos (somente leitura)
create policy tutors_read on public.tutors for select to anon, authenticated using (active);
create policy plans_read on public.plans for select to anon, authenticated using (active);
create policy achievements_read on public.achievements for select to anon, authenticated using (true);
create policy units_read on public.units for select to authenticated using (status = 'publicado');
create policy scenarios_read on public.scenarios for select to authenticated using (status = 'publicado');

-- Sem política (somente service_role): refunds, disputes, coupons, coupon_redemptions,
-- referrals, webhook_events, abuse_markers, moderation_flags, notifications,
-- admin_users, audit_log, provider_costs, settings, feature_flags.
-- O prompt-base dos tutores não deve sair para o navegador:
-- (revogar uma coluna não funciona com grant na tabela inteira; por isso a lista explícita)
revoke select on public.tutors from anon, authenticated;
grant select (id, slug, name, language, accent, gender, style, bio, rive_file_url, rive_version,
              thumbnail_url, openai_voice, plans_allowed, active, created_at, updated_at)
  on public.tutors to anon, authenticated;
