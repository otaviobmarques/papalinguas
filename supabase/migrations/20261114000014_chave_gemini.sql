-- Cofre de chaves: aceita a chave do Google Gemini (geração dos vídeos dos tutores com o Veo).
alter table public.integration_keys drop constraint if exists integration_keys_provider_check;
alter table public.integration_keys add constraint integration_keys_provider_check
  check (provider in ('openai', 'anthropic', 'azure_speech', 'asaas', 'resend', 'google_gemini'));
