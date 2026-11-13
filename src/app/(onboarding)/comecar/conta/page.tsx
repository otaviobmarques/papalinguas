"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import OnboardingShell from "@/components/OnboardingShell";
import { useOnboarding, vincularOnboarding } from "@/lib/client/onboarding";
import { supabaseBrowser } from "@/lib/supabase/client";

/** Logins sociais ligados no Supabase (ex.: "google,apple"); sem a variável, os botões ficam ocultos. */
const SOCIAL = (process.env.NEXT_PUBLIC_LOGIN_SOCIAL ?? "").split(",").map((x) => x.trim()).filter(Boolean);

/** O5. Criar conta / Entrar: Google, Apple, código por e-mail ou e-mail e senha (aluno cortesia recebe senha do admin) */
function Conta() {
  const { estado, atualizar } = useOnboarding();
  const router = useRouter();
  const params = useSearchParams();
  const entrar = params.get("entrar") === "1";
  const sb = supabaseBrowser();
  const [email, setEmail] = useState(params.get("email") ?? estado.email ?? "");
  const [modoSenha, setModoSenha] = useState(params.get("senha") === "1");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
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

  async function entrarComSenha(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      if (sb) {
        const { error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: senha });
        if (error) throw error;
      }
      await concluir();
    } catch {
      setErro("E-mail ou senha incorretos. Confira e tente de novo, ou entre com um código por e-mail.");
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
    <OnboardingShell passo={entrar ? undefined : 4} voltar={entrar ? "/comecar" : "/comecar/microfone"}>
      <h1 className="text-2xl font-extrabold">{entrar ? "Entrar" : "Crie sua conta"}</h1>
      <p className="mt-1 text-ink-soft">{entrar ? "Bem-vindo de volta!" : "Seu progresso até aqui fica salvo."}</p>

      {SOCIAL.length > 0 && (
        <>
          <div className="mt-6 flex flex-col gap-3">
            {SOCIAL.includes("google") && <button className="btn-ghost" onClick={() => social("google")}><span aria-hidden className="font-black">G</span> Continuar com Google</button>}
            {SOCIAL.includes("apple") && <button className="btn-ghost" onClick={() => social("apple")}><span aria-hidden></span> Continuar com Apple</button>}
          </div>
          <div className="my-6 flex items-center gap-3 text-sm text-ink-soft"><hr className="flex-1 border-line" />ou com e-mail<hr className="flex-1 border-line" /></div>
        </>
      )}
      {SOCIAL.length === 0 && <div className="mt-6" />}

      {modoSenha ? (
        <form onSubmit={entrarComSenha} className="flex flex-col gap-3">
          <label htmlFor="email-s" className="font-semibold">E-mail</label>
          <input id="email-s" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="min-h-12 rounded-2xl border border-line bg-surface px-4" placeholder="voce@exemplo.com" />
          <label htmlFor="senha" className="font-semibold">Senha</label>
          <div className="relative">
            <input id="senha" type={verSenha ? "text" : "password"} required autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)}
              className="min-h-12 w-full rounded-2xl border border-line bg-surface px-4 pr-24 font-mono" />
            <button type="button" className="absolute inset-y-0 right-2 my-auto h-9 rounded-xl px-3 text-sm font-semibold text-ink-soft hover:text-ink" onClick={() => setVerSenha(!verSenha)} aria-pressed={verSenha}>
              {verSenha ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          <button className="btn-primary" disabled={carregando || !senha}>{carregando ? "Entrando…" : "Entrar"}</button>
          <button type="button" className="text-sm font-semibold text-brand underline" onClick={() => { setModoSenha(false); setErro(null); }}>Esqueci a senha / entrar com código por e-mail</button>
        </form>
      ) : !enviado ? (
        <form onSubmit={enviarCodigo} className="flex flex-col gap-3">
          <label htmlFor="email" className="font-semibold">E-mail</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="min-h-12 rounded-2xl border border-line bg-surface px-4" placeholder="voce@exemplo.com" />
          <button className="btn-primary" disabled={carregando}>{carregando ? "Enviando…" : "Receber código"}</button>
          {entrar && <button type="button" className="text-sm font-semibold text-brand underline" onClick={() => { setModoSenha(true); setErro(null); }}>Tenho senha: entrar com e-mail e senha</button>}
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
