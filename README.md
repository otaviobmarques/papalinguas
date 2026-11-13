# Papalinguas

Plataforma de idiomas com tutor de IA por voz (inglês, espanhol e português para estrangeiros).
Base: **Manual Técnico v2.2** e **Especificação de Telas v1.1** (13/11/2026). Em caso de conflito, vale o manual.

## Como rodar

```bash
npm install
npm run dev        # http://localhost:3000
```

Sem as variáveis do Supabase o app abre em **modo demonstração**: todo o fluxo O1 → O8 → A1 → A3 → A4
funciona com dados locais, o tutor segue um roteiro e usa a voz do navegador. Para o modo real, copie
`.env.example` para `.env.local` e preencha as chaves.

## Verificação

```bash
npm run lint && npm run typecheck && npm test   # lógica de domínio, Asaas, permissões, lip sync
npm run test:db                                 # migrações + seed + testes de RLS/cota num Postgres local
npm run build
```

`test:db` precisa de `psql`, `createdb` e `dropdb` apontando para um Postgres 15+ (variáveis `PG*`).
A CI (`.github/workflows/ci.yml`) roda tudo isso em cada pull request.

## Estrutura

| Caminho | O que é |
|---|---|
| `supabase/migrations/` | Schema (seção 6), RLS (seção 13), função atômica de consumo de cota |
| `supabase/seed.sql` | Planos, parâmetros (12.2), 8 tutores, conquistas, cenários de exemplo |
| `src/lib/domain/` | Regras puras e testadas: cota e bloqueios (8.1), planos e upgrade proporcional (8.4), revisão espaçada, CPF, lip sync, instruções do tutor |
| `src/lib/providers/` | Camada de fornecedores (seção 5): `VoiceProvider` (OpenAI Realtime, chave temporária), `PronunciationProvider` (Azure), `PaymentProvider` (Asaas) |
| `src/lib/services/billing.ts` | Tradução de eventos de pagamento em estado de assinatura e cota |
| `src/app/api/` | `POST /api/aulas`, `heartbeat`, `encerrar`, `onboarding`, `planos`, `webhooks/asaas` (idempotente) |
| `src/app/(onboarding)/comecar/` | O2–O8 e A10 |
| `src/app/app/` | A1–A9 com barra inferior |
| `src/components/LiveLesson.tsx` | A3 (e O6): WebRTC direto com a OpenAI, heartbeat de 30 s, estados de voz, legendas, missões |
| `src/components/TutorCharacter.tsx` | Personagem com 7 visemas, piscar e respirar. Substituto em SVG até a entrega dos arquivos Rive, com a mesma interface |
| `src/lib/admin/` | Perfis e matriz de permissões (11.2), acesso com 2FA (aal2), telas P1–P19 |
| `src/app/admin/` | Painel; P1 pronto em modo demonstração |

## Regras de ouro já aplicadas no código

- Nenhuma chave secreta no navegador: OpenAI e Azure só com credenciais temporárias emitidas por `/api/aulas` depois de checar conta, assinatura, cota, limite diário e kill switch.
- O plano só é liberado pelo webhook de pagamento confirmado, gravado antes em `webhook_events` (único por fornecedor + id).
- RLS em todas as tabelas; tabelas financeiras, de auditoria e de configuração só pelo servidor; `audit_log` é somente inclusão (trigger).
- O aluno não altera o próprio status, nível nem consentimentos pelo banco; o prompt-base dos tutores não é legível pelo app.
- Valores em centavos, datas em UTC.

## Status por sprint (Manual, seção 18)

- **Sprint 1, feito:** repositório, schema + RLS testado, login (Google, Apple, código por e-mail via Supabase Auth), cadastro inicial, layout do app e do admin.
- **Adiantado da sprint 2:** `POST /api/aulas`, heartbeat, encerramento, cotas e limite diário, cliente WebRTC, lip sync pelo áudio.
- **Adiantado da sprint 4:** camada Asaas (cliente, assinatura, Pix QR, reembolso, webhook) e processamento de eventos.

### Próximos passos

1. Sprint 2: personagem Rive real (`@rive-app/react-canvas`) no lugar do SVG; ler tutores e cenários do banco; nivelamento real (`/api/nivel/*`) com antiabuso (`abuse_markers`).
2. Sprint 3: pronúncia Azure no navegador, fila (pgmq) para relatório e cartões, revisão offline.
3. Sprint 4: `POST /api/assinaturas`, Pix Automático, NFS-e, garantia, pacote extra, cupons, e-mails (Resend).
4. Pendências do dono do produto: seção 20 do manual.
