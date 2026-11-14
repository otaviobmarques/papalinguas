-- Novos idiomas: francês, italiano, alemão e japonês.
-- (valor novo de enum só pode ser usado depois desta migração: os tutores vêm na 000008)
alter type public.lang_code add value if not exists 'fr';
alter type public.lang_code add value if not exists 'it';
alter type public.lang_code add value if not exists 'de';
alter type public.lang_code add value if not exists 'ja';
