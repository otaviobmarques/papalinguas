-- Assinatura cortesia concedida pelo painel (sem cobrança): novo "gateway" para distinguir nos relatórios.
alter type public.payment_gateway add value if not exists 'cortesia';
