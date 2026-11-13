-- Dados iniciais (Manual 12.2 e 17.1; Telas O7)

insert into public.plans (code, name, kind, period, price_brl_cents, price_usd_cents, minutes_per_cycle, daily_limit_minutes, languages_allowed, validity_days, features) values
  ('essencial', 'Essencial', 'assinatura', 'mensal', 4990,  null, 150, 30, 1, null, '["Todos os tutores do idioma","Relatório pós-aula","Revisão espaçada","Modo Acolher"]'),
  ('essencial', 'Essencial', 'assinatura', 'anual',  44990, null, 150, 30, 1, null, '["Todos os tutores do idioma","Relatório pós-aula","Revisão espaçada","Modo Acolher"]'),
  ('fluente',   'Fluente',   'assinatura', 'mensal', 8990,  null, 300, 60, 3, null, '["Tudo do Essencial","3 idiomas","Trilhas especiais","Relatório detalhado de pronúncia","Prioridade no suporte"]'),
  ('fluente',   'Fluente',   'assinatura', 'anual',  79990, null, 300, 60, 3, null, '["Tudo do Essencial","3 idiomas","Trilhas especiais","Relatório detalhado de pronúncia","Prioridade no suporte"]'),
  ('pacote_extra', 'Pacote extra 60 min', 'pacote', null, 2990, null, 60, null, 1, 90, '[]');

insert into public.settings (key, value, description) values
  ('nivelamento_minutos',        '3',      'Nivelamento antes do pagamento (min); 0 desliga'),
  ('nivelamento_ativo',          'true',   'Liga/desliga o nivelamento antes do pagamento'),
  ('garantia_dias',              '7',      'Reembolso integral na primeira assinatura'),
  ('aula_duracao_max_min',       '20',     'Duração máxima de uma aula'),
  ('aulas_por_dia_max',          '10',     'Antiabuso'),
  ('aviso_cota_min',             '2',      'Aviso antes de a cota acabar'),
  ('retencao_audio_dias',        '30',     'LGPD'),
  ('correcoes_por_fala',         '1',      'Metodologias'),
  ('correcoes_por_relatorio',    '5',      'Metodologias'),
  ('modelo_voz_padrao',          '"gpt-realtime-2.1-mini"', 'Por idioma e por plano'),
  ('teto_diario_ia_usd',         '25',     'Mínimo; regra: 2x média de 7 dias'),
  ('tolerancia_inadimplencia_dias', '3',   ''),
  ('regua_recobranca_dias',      '[1,3,5]', ''),
  ('exclusao_logica_dias',       '30',     ''),
  ('roteamento_gateway',         '{"BR":"asaas","default":"stripe"}', 'Gateway por país'),
  ('kill_switch',                '{"modo":"desligado"}', 'desligado | reduzir_limite | modelo_barato | pausar_aulas'),
  ('manutencao',                 '{"ativo":false,"mensagem":""}', 'Modo manutenção'),
  ('termos_versao',              '"2026-11-13"', 'Versão vigente dos Termos e da Política');

insert into public.feature_flags (key, enabled) values
  ('mercadopago', false), ('stripe', false), ('indicacao', false), ('pt_para_estrangeiros', true);

insert into public.tutors (slug, name, language, accent, gender, style, bio, openai_voice, base_prompt) values
  ('maya',    'Maya',    'en', 'americano',  'feminino',  'animada e paciente',     'Ama tecnologia e viagens de mochila.', 'marin',  'You are Maya, a warm and upbeat English tutor.'),
  ('oliver',  'Oliver',  'en', 'britânico',  'masculino', 'calmo e detalhista',     'Fã de futebol e de chá preto.',        'cedar',  'You are Oliver, a calm and precise English tutor.'),
  ('grace',   'Grace',   'en', 'americano',  'feminino',  'focada em carreira',     'Ex-recrutadora, adora simular entrevistas.', 'coral', 'You are Grace, a career-focused English tutor.'),
  ('lucia',   'Lucía',   'es', 'mexicano',   'feminino',  'divertida e acolhedora', 'Cozinheira de mão cheia e fã de música.', 'shimmer', 'Eres Lucía, una tutora de español cálida y divertida.'),
  ('mateo',   'Mateo',   'es', 'espanhol',   'masculino', 'direto e encorajador',   'Ciclista e leitor de quadrinhos.',     'ash',    'Eres Mateo, un tutor de español directo y alentador.'),
  ('bia',     'Bia',     'pt', 'paulista',   'feminino',  'alegre e paciente',      'Adora séries e feiras de rua.',        'sage',   'Você é a Bia, tutora de português para estrangeiros.'),
  ('caio',    'Caio',    'pt', 'carioca',    'masculino', 'descontraído',           'Surfista e fã de samba.',              'verse',  'Você é o Caio, tutor de português para estrangeiros.'),
  ('helena',  'Helena',  'pt', 'mineiro',    'feminino',  'calma e didática',       'Professora de história, ama café.',    'ballad', 'Você é a Helena, tutora de português para estrangeiros.');

insert into public.achievements (code, title, description) values
  ('sequencia_7',  '7 dias seguidos', 'Praticou 7 dias sem parar'),
  ('minutos_100',  '100 minutos',     'Falou 100 minutos com seu tutor'),
  ('primeira_entrevista', 'Primeira entrevista simulada', 'Concluiu um cenário de entrevista'),
  ('primeira_aula', 'Primeira conversa', 'Concluiu a primeira aula');

with u as (
  insert into public.units (language, level, position, title, status)
  values ('en', 'B1', 4, 'Unidade 4: no trabalho', 'publicado')
  returning id
)
insert into public.scenarios (unit_id, slug, title, situation, missions, vocabulary, tutor_script, themes, goals, estimated_minutes, status)
select u.id, s.slug, s.title, s.situation, s.missions::jsonb, s.vocabulary::jsonb, s.script, s.themes, s.goals, s.mins, 'publicado'
from u, (values
  ('en-b1-pedir-aumento', 'Pedir um aumento', 'Você vai pedir um aumento ao seu gerente.',
   '["Cumprimentar e pedir um momento","Citar duas conquistas","Propor um valor"]',
   '[{"termo":"raise","traducao":"aumento"},{"termo":"achievement","traducao":"conquista"},{"termo":"deserve","traducao":"merecer"},{"termo":"budget","traducao":"orçamento"},{"termo":"review","traducao":"avaliação"}]',
   'Play the manager. Be friendly but ask for evidence.', array['negocios'], array['carreira'], 8),
  ('en-b1-entrevista', 'Entrevista de emprego', 'Você está numa entrevista para desenvolvedor.',
   '["Apresentar-se","Falar de um projeto","Fazer uma pergunta à empresa"]',
   '[{"termo":"strength","traducao":"ponto forte"},{"termo":"deadline","traducao":"prazo"},{"termo":"team player","traducao":"bom colega de equipe"},{"termo":"challenge","traducao":"desafio"},{"termo":"hire","traducao":"contratar"}]',
   'Play the interviewer for a tech company.', array['tecnologia','negocios'], array['carreira'], 10),
  ('en-b1-reuniao', 'Reunião rápida', 'Você vai dar uma atualização de status na reunião diária.',
   '["Dizer o que fez ontem","Dizer o que fará hoje","Citar um bloqueio"]',
   '[{"termo":"blocker","traducao":"impedimento"},{"termo":"update","traducao":"atualização"},{"termo":"on track","traducao":"no prazo"},{"termo":"follow up","traducao":"acompanhar"},{"termo":"wrap up","traducao":"finalizar"}]',
   'Play a friendly team lead running a stand-up.', array['negocios','tecnologia'], array['carreira','conversar'], 6)
) as s(slug, title, situation, missions, vocabulary, script, themes, goals, mins);
