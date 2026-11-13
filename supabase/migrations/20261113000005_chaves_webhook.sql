-- Cofre de chaves: vaga "webhook" para o token que o Asaas envia em cada aviso de pagamento.
alter table public.integration_keys drop constraint integration_keys_slot_check;
alter table public.integration_keys add constraint integration_keys_slot_check
  check (slot in ('principal', 'backup', 'webhook'));
-- Id do webhook registrado no gateway (para atualizar em vez de duplicar)
alter table public.integration_keys add column if not exists external_ref text;
