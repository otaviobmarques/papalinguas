-- Consumo de cota (Manual 8.1 e 9.6): minutos do ciclo + bônus primeiro,
-- depois pacotes extras (o que vence antes primeiro). Atômico, chamado só pelo servidor.

create or replace function public.consume_lesson_seconds(p_lesson_id uuid, p_seconds int)
returns table (cycle_left int, extra_left int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_counter public.usage_counters%rowtype;
  v_remaining int := p_seconds;
  v_take int;
  v_pack record;
begin
  if p_seconds <= 0 then
    raise exception 'p_seconds deve ser positivo';
  end if;

  select l.user_id into v_user from public.lessons l
   where l.id = p_lesson_id and l.status in ('abrindo', 'ao_vivo')
   for update;
  if v_user is null then
    raise exception 'aula inexistente ou encerrada';
  end if;

  update public.lessons set seconds_billed = seconds_billed + p_seconds,
                            last_heartbeat_at = now()
   where id = p_lesson_id;

  select * into v_counter from public.usage_counters
   where user_id = v_user and now() >= cycle_start and now() < cycle_end
   order by cycle_end desc limit 1
   for update;

  if found then
    v_take := least(v_remaining,
      greatest(0, v_counter.cycle_seconds_quota + v_counter.bonus_seconds - v_counter.cycle_seconds_used));
    update public.usage_counters set cycle_seconds_used = cycle_seconds_used + v_take
     where id = v_counter.id;
    v_remaining := v_remaining - v_take;
  end if;

  for v_pack in
    select id, seconds_total - seconds_used as left_s from public.extra_packs
     where user_id = v_user and expires_at > now() and seconds_used < seconds_total
     order by expires_at
     for update
  loop
    exit when v_remaining <= 0;
    v_take := least(v_remaining, v_pack.left_s);
    update public.extra_packs set seconds_used = seconds_used + v_take where id = v_pack.id;
    v_remaining := v_remaining - v_take;
  end loop;

  -- Progresso do dia (fuso do aluno é aplicado na exibição; aqui UTC)
  insert into public.progress_daily (user_id, day, seconds_spoken)
  values (v_user, (now() at time zone 'utc')::date, p_seconds)
  on conflict (user_id, day) do update
    set seconds_spoken = public.progress_daily.seconds_spoken + excluded.seconds_spoken;

  return query
    select
      coalesce((select greatest(0, c.cycle_seconds_quota + c.bonus_seconds - c.cycle_seconds_used)
                  from public.usage_counters c
                 where c.user_id = v_user and now() >= c.cycle_start and now() < c.cycle_end
                 order by c.cycle_end desc limit 1), 0)::int,
      coalesce((select sum(p.seconds_total - p.seconds_used)
                  from public.extra_packs p
                 where p.user_id = v_user and p.expires_at > now()), 0)::int;
end;
$$;

revoke execute on function public.consume_lesson_seconds(uuid, int) from public, anon, authenticated;
grant execute on function public.consume_lesson_seconds(uuid, int) to service_role;
