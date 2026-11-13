-- Testes de RLS e de consumo de cota. Rodar com: npm run test:db
\set ON_ERROR_STOP on
insert into auth.users values ('00000000-0000-0000-0000-00000000000a','a@x.com'),('00000000-0000-0000-0000-00000000000b','b@x.com');
insert into public.users (id, email) values ('00000000-0000-0000-0000-00000000000a','a@x.com'),('00000000-0000-0000-0000-00000000000b','b@x.com');
insert into public.lessons (id, user_id, language) values
  ('10000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000a','en'),
  ('10000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-00000000000b','en');
insert into public.subscriptions (id, user_id, plan_id, gateway, status)
  select '20000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000a', id, 'asaas', 'ativa'
  from public.plans where code='essencial' and period='mensal';
insert into public.usage_counters (user_id, subscription_id, cycle_start, cycle_end, cycle_seconds_quota, cycle_seconds_used)
  values ('00000000-0000-0000-0000-00000000000a','20000000-0000-0000-0000-00000000000a', now()-interval '1 day', now()+interval '29 days', 9000, 8970);
insert into public.extra_packs (user_id, plan_id, seconds_total, expires_at)
  select '00000000-0000-0000-0000-00000000000a', id, 3600, now()+interval '90 days' from public.plans where code='pacote_extra';

-- Aluno A não vê dados de B
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a', false);
do $$ begin
  assert (select count(*) from public.users) = 1, 'users: deveria ver só a própria linha';
  assert (select count(*) from public.lessons) = 1, 'lessons: deveria ver só a própria aula';
  assert (select count(*) from public.settings) = 0, 'settings: aluno não deve ler';
  assert (select count(*) from public.webhook_events) = 0, 'webhook_events: aluno não deve ler';
  assert (select count(*) from public.tutors) = 16, 'tutors: catálogo visível (8 + 8 dos novos idiomas)';
end $$;
-- Aluno não pode mudar o próprio status nem ler o prompt do tutor
do $$ begin
  begin update public.users set status='ativo'; raise exception 'deveria falhar';
  exception when insufficient_privilege then null; end;
  begin perform base_prompt from public.tutors limit 1; raise exception 'deveria falhar';
  exception when insufficient_privilege then null; end;
  begin perform public.consume_lesson_seconds('10000000-0000-0000-0000-00000000000a', 30); raise exception 'deveria falhar';
  exception when insufficient_privilege then null; end;
end $$;
update public.users set name='Ana';  -- permitido
reset role;

-- Cota: 30 s restantes no ciclo, depois pacote extra
set role service_role;
do $$ declare r record; begin
  select * into r from public.consume_lesson_seconds('10000000-0000-0000-0000-00000000000a', 60);
  assert r.cycle_left = 0, 'ciclo deveria zerar';
  assert r.extra_left = 3570, format('pacote deveria ter 3570, tem %s', r.extra_left);
end $$;
do $$ begin
  begin delete from public.audit_log; insert into public.audit_log(action) values ('x'); update public.audit_log set action='y'; raise exception 'deveria falhar';
  exception when raise_exception then
    if sqlerrm <> 'audit_log é somente inclusão' then raise; end if;
  end;
end $$;
reset role;
\echo 'RLS e cota: OK'
