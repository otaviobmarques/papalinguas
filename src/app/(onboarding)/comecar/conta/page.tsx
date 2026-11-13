"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import OnboardingShell from "@/components/OnboardingShell";
import { useOnboarding, vincularOnboarding } from "@/lib/client/onboarding";
import { supabaseBrowser } from "@/lib/supabase/client";

/** O5. Criar conta / Entrar — sem senha: Google, Apple ou código por e-mail */
function Conta() {
  const { estado, atualizar } = useOnboarding();
  const router = useRouter();
  const entrar = useSearchParams().get("entrar") === "1";
  const sb = supabaseBrowser();
  const [email, setEmail] = useState(estado.email ?? "");
  const [codigo, setCodigo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function concluir() {
    // Vincula o progresso salvo no aparelho à conta nova
    if (sb) await vincularOnboarding(estado);
    // Quem entra por "Já tenho conta" num aparelho novo (ex.: aluno cortesia) passa pelo cadastro e pelo aceite dos termos
    const destino = !estado.aceiteTermos ? "/comecar/idioma" : entrar && estado.assinante ? "/app" : "/comecar/nivel";
    atualizar({ contaCriada: true, email, passo: destino });
    router.push(destino);
  }

  async function social(provider: "google" | "apple") {
    if (!sb) return concluir();
    await sb.auth.signInWithOAuth({ provider, options: { redirectTo: `${location.origin}/auth/callback?next=/comecar/nivel` } });
  }

  async function enviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      if (sb) {
        const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
        if (error) throw error;
      }
      setEnviado(true);
    } catch {
      setErro("Não conseguimos enviar o código. Confira o e-mail e tente de novo.");
    } finally {
      setCarregando(false);
    }
  }

  async function verificar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      if (sb) {
        const { error } = await sb.auth.verifyOtp({ email, token: codigo, type: "email" });
        if (error) throw error;
      } else if (codigo.length !== 6) {
        throw new Error("codigo");
      }
      await concluir();
    } catch {
      setErro("Código errado ou expirado. Peça um novo código.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <OnboardingShell passo={entrar ? undefined : 4} voltar={entrar ? "/" : "/comecar/microfone"}>
      <h1 className="text-2xl font-extrabold">{entrar ? "Entrar" : "Crie sua conta"}</h1>
      <p className="mt-1 text-ink-soft">{entrar ? "Bem-vindo de volta!" : "Seu progresso até aqui fica salvo."}</p>

      <div className="mt-6 flex flex-col gap-3">
        <button className="btn-ghost" onClick={() => social("google")}><span aria-hidden className="font-black">G</span> Continuar com Google</button>
        <button className="btn-ghost" onClick={() => social("apple")}><span aria-hidden></span> Continuar com Apple</button>
      </div>

      <div className="my-6 flex items-center gap-3 text-sm text-ink-soft"><hr className="flex-1 border-line" />ou com e-mail<hr className="flex-1 border-line" /></div>

      {!enviado ? (
        <form onSubmit={enviarCodigo} className="flex flex-col gap-3">
          <label htmlFor="email" className="font-semibold">E-mail</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="min-h-12 rounded-2xl border border-line bg-surface px-4" placeholder="voce@exemplo.com" />
          <button className="btn-primary" disabled={carregando}>{carregando ? "Enviando…" : "Receber código"}</button>
        </form>
      ) : (
        <form onSubmit={verificar} className="flex flex-col gap-3">
          <label htmlFor="codigo" className="font-semibold">Digite o código de 6 dígitos enviado para {email}</label>
          <input id="codigo" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
            className="min-h-12 rounded-2xl border border-line bg-surface px-4 text-center text-2xl tracking-[0.5em]" />
          <button className="btn-primary" disabled={carregando || codigo.length !== 6}>{carregando ? "Verificando…" : "Entrar"}</button>
          <button type="button" className="text-sm font-semibold text-brand underline" onClick={() => { setEnviado(false); setCodigo(""); }}>Pedir um novo código</button>
        </form>
      )}
      {erro && <p role="alert" className="mt-3 text-sm font-semibold text-danger">{erro}</p>}
      {!sb && <p className="mt-4 rounded-2xl bg-surface-2 p-3 text-xs text-ink-soft">Modo demonstração: qualquer código de 6 dígitos funciona.</p>}

      <p className="mt-auto pt-8 text-center text-xs text-ink-soft">
        Ao continuar, você concorda com os <Link href="/legal/termos" className="underline">Termos de Uso</Link>.
      </p>
    </OnboardingShell>
  );
}

export default function Page() {
  return <Suspense><Conta /></Suspense>;
}
