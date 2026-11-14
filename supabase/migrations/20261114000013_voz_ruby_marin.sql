-- Ruby: a voz "sage" pedindo fala suave saiu baixa e com muito grave, e a boca não acompanhava bem.
-- A "marin" também é suave e feminina, com volume e equilíbrio iguais aos das vozes calibradas.
update public.tutors set openai_voice = 'marin' where slug = 'ruby';
