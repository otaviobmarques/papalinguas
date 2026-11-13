import "server-only";

/** Variáveis do servidor (Manual 12.1). Nunca importar em componentes de cliente. */
function opt(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}
function req(name: string): string {
  const v = opt(name);
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

export const serverEnv = {
  appUrl: () => opt("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000",
  supabaseUrl: () => req("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => req("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => req("SUPABASE_SERVICE_ROLE_KEY"),
  openaiRealtimeModel: () => opt("OPENAI_REALTIME_MODEL") ?? "gpt-realtime-2.1-mini",
  openaiTextModel: () => opt("OPENAI_TEXT_MODEL") ?? "gpt-5-mini",
  azureSpeechKey: () => req("AZURE_SPEECH_KEY"),
  azureSpeechRegion: () => req("AZURE_SPEECH_REGION"),
  asaasKey: () => req("ASAAS_API_KEY"),
  asaasEnv: () => (opt("ASAAS_ENV") === "production" ? "production" : "sandbox") as "production" | "sandbox",
  asaasWebhookToken: () => req("ASAAS_WEBHOOK_TOKEN"),
  cronSecret: () => req("CRON_SECRET"),
};

export const isSupabaseConfigured = () =>
  Boolean(opt("NEXT_PUBLIC_SUPABASE_URL") && opt("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
