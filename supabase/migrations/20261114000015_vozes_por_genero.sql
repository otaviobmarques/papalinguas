-- Helena (português) estava com "ballad", uma voz masculina da OpenAI. Passa para "shimmer" (feminina e suave).
update public.tutors set openai_voice = 'shimmer' where slug = 'helena';

-- Trava: tutora sempre com voz feminina, tutor sempre com voz masculina.
-- Femininas: coral, marin, sage, shimmer · Masculinas: ash, ballad, cedar, echo, verse
alter table public.tutors drop constraint if exists tutors_voz_combina_genero;
alter table public.tutors add constraint tutors_voz_combina_genero check (
  (gender = 'feminino'  and openai_voice in ('coral', 'marin', 'sage', 'shimmer'))
  or (gender = 'masculino' and openai_voice in ('ash', 'ballad', 'cedar', 'echo', 'verse'))
  or gender not in ('feminino', 'masculino')
);
