"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import TutorCharacter, { type EstadoVoz, type Expressao } from "@/components/TutorCharacter";
import { conectarRealtime, pedidoTexto, type ConexaoRealtime, type EventoRealtime } from "@/lib/client/realtime";
import { useLipSync, useNivelMicrofone, visemaDeLetra } from "@/lib/client/useLipSync";
import type { Visema } from "@/lib/domain/lipsync";
import type { CenarioDemo, TutorDemo } from "@/lib/demo/data";
import { roteiroDemo } from "@/lib/demo/roteiro";
import { idDispositivo } from "@/lib/client/onboarding";

/**
 * A3. Aula ao vivo (e O6 em versão simplificada).
 * Modo real: WebRTC direto com a OpenAI via POST /api/aulas.
 * Modo demonstração (sem backend): roteiro local com voz do navegador.
 */
export interface ResumoAula {
  aulaId?: string | null;
  segundos: number;
  missoesFeitas: number;
  falas: { quem: "aluno" | "tutor"; texto: string }[];
}

interface Props {
  tutor: TutorDemo;
  modo: "aula" | "livre" | "nivelamento";
  cenario?: CenarioDemo | null;
  /** Modo livre: intensidade da correção escolhida pelo aluno */
  correcao?: "leve" | "detalhada";
  segundosLimite: number;
  cotaRestanteSeg?: number;
  onEncerrar: (r: ResumoAula) => void;
  /** Servidor recusou abrir (ex.: teste de nível já usado). Sem isso, mostra o erro na tela. */
  onRecusa?: (d: { erro: string; mensagem?: string; nivel?: string | null }) => void;
  extraTopo?: React.ReactNode;
}

type Fase = "conectando" | "ao_vivo" | "instavel" | "microfone_bloqueado" | "erro";

const LANG_TTS = { en: "en-US", es: "es-MX", pt: "pt-BR" } as const;

export default function LiveLesson({ tutor, modo, cenario, correcao = "leve", segundosLimite, cotaRestanteSeg, onEncerrar, onRecusa, extraTopo }: Props) {
  const [fase, setFase] = useState<Fase>("conectando");
  const [estado, setEstado] = useState<EstadoVoz>("repouso");
  const [expressao, setExpressao] = useState<Expressao>("neutra");
  const [legendaTutor, setLegendaTutor] = useState("");
  const [falaAluno, setFalaAluno] = useState("");
  const [legendas, setLegendas] = useState(true);
  const [missoes, setMissoes] = useState<boolean[]>(() => (cenario?.missoes ?? []).map(() => false));
  const [segundos, setSegundos] = useState(0);
  const [restante, setRestante] = useState(cotaRestanteSeg ?? segundosLimite);
  const [aviso, setAviso] = useState<string | null>(null);
  const [auxiliar, setAuxiliar] = useState<string | null>(null);
  const [maosLivres, setMaosLivres] = useState(true);
  const [visemaDemo, setVisemaDemo] = useState<Visema>(0);
  const [remoto, setRemoto] = useState<MediaStream | null>(null);
  const [mic, setMic] = useState<MediaStream | null>(null);
  const [devagar, setDevagar] = useState(false);
  const [demo, setDemo] = useState(false);

  const falas = useRef<ResumoAula["falas"]>([]);
  const conexao = useRef<ConexaoRealtime | null>(null);
  const aulaId = useRef<string | null>(null);
  const turnoDemo = useRef(0);
  const encerrado = useRef(false);
  const ultimaAtividade = useRef(Date.now());

  const { visema: visemaReal } = useLipSync(remoto);
  const volumeMic = useNivelMicrofone(mic);
  const visema = demo ? visemaDemo : visemaReal;
  const roteiro = roteiroDemo(tutor, modo, cenario);

  // ---------- encerrar ----------
  const encerrar = useCallback(
    async (motivo = "aluno") => {
      if (encerrado.current) return;
      encerrado.current = true;
      window.speechSynthesis?.cancel();
      conexao.current?.fechar();
      mic?.getTracks().forEach((t) => t.stop());
      if (aulaId.current && modo !== "nivelamento") {
        await fetch(`/api/aulas/${aulaId.current}/encerrar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ motivo }),
        }).catch(() => {});
      }
      onEncerrar({ aulaId: aulaId.current, segundos, missoesFeitas: missoes.filter(Boolean).length, falas: falas.current });
    },
    [mic, missoes, modo, onEncerrar, segundos],
  );

  // ---------- modo demonstração ----------
  const falarDemo = useCallback(
    (texto: string, depois?: () => void) => {
      setEstado("falando");
      setLegendaTutor(texto);
      falas.current.push({ quem: "tutor", texto });
      const cps = devagar ? 9 : 14;
      let i = 0;
      const tick = setInterval(() => {
        setVisemaDemo(visemaDeLetra(texto[i] ?? " "));
        i++;
        if (i > texto.length) {
          clearInterval(tick);
          setVisemaDemo(0);
          setEstado("ouvindo");
          ultimaAtividade.current = Date.now();
          depois?.();
        }
      }, 1000 / cps);
      try {
        const u = new SpeechSynthesisUtterance(texto);
        u.lang = LANG_TTS[tutor.idioma];
        u.rate = devagar ? 0.75 : 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      } catch {}
    },
    [devagar, tutor.idioma],
  );

  const responderDemo = useCallback(() => {
    if (encerrado.current) return;
    setEstado("pensando");
    const n = turnoDemo.current;
    if (cenario && n < missoes.length) {
      setMissoes((m) => m.map((v, i) => (i === n ? true : v)));
      setExpressao("sorriso");
      setTimeout(() => setExpressao("neutra"), 1500);
    }
    turnoDemo.current = n + 1;
    setTimeout(() => falarDemo(roteiro.respostas[n % roteiro.respostas.length]), 700);
  }, [cenario, falarDemo, missoes.length, roteiro.respostas]);

  // ---------- conexão ----------
  useEffect(() => {
    let cancelado = false;
    (async () => {
      // microfone primeiro: estado "microfone bloqueado" se negado
      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        if (!cancelado) setFase("microfone_bloqueado");
      }
      if (micStream && !cancelado) setMic(micStream);

      {
        try {
          const r = modo === "nivelamento"
            ? await fetch("/api/nivel/iniciar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idioma: tutor.idioma, dispositivo: idDispositivo() }),
              })
            : await fetch("/api/aulas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idioma: tutor.idioma, modo, cenarioSlug: cenario?.slug, correcao }),
              });
          if (r.ok) {
            const d = await r.json();
            aulaId.current = d.aulaId;
            setRestante(d.segundosPermitidos);
            if (d.avisoCotaBaixa) setAviso("Seus minutos estão acabando.");
            micStream?.getTracks().forEach((t) => t.stop());
            const c = await conectarRealtime(d.voz, (e) => tratarEvento(e), (s) => {
              if (s === "disconnected") setFase("instavel");
              if (s === "connected") setFase("ao_vivo");
              if (s === "failed") setFase("erro");
            });
            if (cancelado) return c.fechar();
            conexao.current = c;
            setRemoto(c.remoto);
            setMic(c.microfone);
            setFase("ao_vivo");
            setEstado("ouvindo");
            c.enviar({ type: "response.create" }); // o tutor abre a conversa
            return;
          }
          const err = await r.json().catch(() => ({}));
          // sem login (401) ou sem backend (503): segue em demonstração
          if (r.status !== 401 && err.erro !== "modo_demo") {
            if (onRecusa) {
              micStream?.getTracks().forEach((t) => t.stop());
              return onRecusa(err);
            }
            setAviso(err.mensagem ?? "Não foi possível abrir a aula.");
            setFase("erro");
            return;
          }
        } catch {
          /* sem backend: demonstração */
        }
      }
      if (cancelado) return;
      setDemo(true);
      setTimeout(() => {
        if (cancelado) return;
        setFase("ao_vivo");
        falarDemo(roteiro.abertura);
      }, 1200);
    })();
    return () => {
      cancelado = true;
      conexao.current?.fechar();
      window.speechSynthesis?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function tratarEvento(e: EventoRealtime) {
    ultimaAtividade.current = Date.now();
    switch (e.type) {
      case "input_audio_buffer.speech_started":
        setEstado("ouvindo");
        setFalaAluno("…");
        break;
      case "input_audio_buffer.speech_stopped":
        setEstado("pensando");
        break;
      case "output_audio_buffer.started":
        setEstado("falando");
        break;
      case "output_audio_buffer.stopped":
        setEstado("ouvindo");
        break;
      case "response.created":
        setLegendaTutor("");
        break;
      case "response.output_audio_transcript.delta":
        setLegendaTutor((t) => t + String(e.delta ?? ""));
        break;
      case "response.output_audio_transcript.done":
        setLegendaTutor(String(e.transcript ?? ""));
        falas.current.push({ quem: "tutor", texto: String(e.transcript ?? "") });
        break;
      case "conversation.item.input_audio_transcription.completed":
        setFalaAluno(String(e.transcript ?? ""));
        falas.current.push({ quem: "aluno", texto: String(e.transcript ?? "") });
        break;
      case "response.output_text.done":
        setAuxiliar(String(e.text ?? ""));
        break;
    }
  }

  // ---------- cronômetro, heartbeat, silêncio ----------
  useEffect(() => {
    if (fase !== "ao_vivo" && fase !== "instavel") return;
    const t = setInterval(() => {
      if (fase === "instavel") return; // tempo desconectado não conta
      setSegundos((s) => s + 1);
      setRestante((r) => r - 1);
    }, 1000);
    return () => clearInterval(t);
  }, [fase]);

  useEffect(() => {
    if (segundos >= segundosLimite) encerrar("limite");
    if (restante === 120) setAviso("Faltam 2 minutos da sua cota.");
    if (restante <= 0 && !encerrado.current) {
      setAviso("Sua cota acabou. Até a próxima!");
      if (demo) falarDemo(roteiro.despedida, () => encerrar("cota"));
      else {
        conexao.current?.enviar({ type: "response.create", response: { instructions: "Say a short, warm goodbye: the lesson time is over." } });
        setTimeout(() => encerrar("cota"), 6000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segundos]);

  useEffect(() => {
    if (!aulaId.current || fase !== "ao_vivo" || modo === "nivelamento") return;
    const t = setInterval(async () => {
      const r = await fetch(`/api/aulas/${aulaId.current}/heartbeat`, { method: "POST" }).catch(() => null);
      if (!r?.ok) return;
      const d = (await r.json()) as { acao: string; restanteSeg?: number };
      if (typeof d.restanteSeg === "number") setRestante(d.restanteSeg);
      if (d.acao === "avisar") setAviso("Faltam 2 minutos da sua cota.");
      if (d.acao === "encerrar") setRestante(0);
    }, 30_000);
    return () => clearInterval(t);
  }, [fase, modo]);

  // Silêncio de 8 s: o tutor reformula (o modo real já faz isso pelo prompt)
  useEffect(() => {
    if (!demo || estado !== "ouvindo") return;
    const t = setInterval(() => {
      if (Date.now() - ultimaAtividade.current > 8000 && !encerrado.current) {
        ultimaAtividade.current = Date.now();
        setExpressao("duvida");
        setTimeout(() => setExpressao("neutra"), 1500);
        falarDemo(roteiro.reformular);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [demo, estado, falarDemo, roteiro.reformular]);

  // ---------- ações ----------
  function tocarMicrofone() {
    if (demo) {
      if (estado === "falando") {
        window.speechSynthesis?.cancel(); // interromper o tutor
        setEstado("ouvindo");
        return;
      }
      setFalaAluno("(você falou)");
      falas.current.push({ quem: "aluno", texto: "(fala do aluno)" });
      responderDemo();
      return;
    }
    if (estado === "falando") conexao.current?.enviar({ type: "response.cancel" });
    if (!maosLivres) conexao.current?.enviar({ type: "input_audio_buffer.commit" });
  }

  function maisDevagar() {
    setDevagar((d) => !d);
    conexao.current?.enviar({ type: "session.update", session: { type: "realtime", audio: { output: { speed: devagar ? 1 : 0.8 } } } });
  }
  function traduzir() {
    if (demo) return setAuxiliar(roteiro.traducao(legendaTutor));
    conexao.current?.enviar(pedidoTexto(`Traduza para o português do Brasil, só a tradução: "${legendaTutor}"`));
  }
  function dica() {
    if (demo) return setAuxiliar(roteiro.dica);
    conexao.current?.enviar(pedidoTexto("Sugira, em uma frase curta na língua-alvo, o que o aluno poderia responder agora. Inclua a tradução entre parênteses."));
  }

  const min = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;
  const ESTADO_LABEL: Record<EstadoVoz, string> = { repouso: "Pronto", ouvindo: "Ouvindo você", pensando: "Pensando…", falando: `${tutor.nome} está falando` };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg px-4 pb-6 pt-3">
      {/* topo */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-ink-soft" aria-label="Tempo de aula">⏱ {min(segundos)}</span>
        {extraTopo}
        <span className="font-semibold text-ink-soft" aria-label="Minutos restantes da cota">{Math.max(0, Math.floor(restante / 60))} min restantes</span>
      </div>

      {aviso && <div role="status" className="mt-2 rounded-2xl bg-warn-soft px-4 py-2 text-sm font-semibold text-warn">{aviso}</div>}
      {fase === "instavel" && <div role="status" className="mt-2 rounded-2xl bg-warn-soft px-4 py-2 text-sm font-semibold text-warn">Conexão instável. Reconectando…</div>}
      {demo && <div className="mt-2 rounded-2xl bg-surface-2 px-4 py-2 text-xs text-ink-soft">Modo demonstração: o tutor segue um roteiro local. Toque no microfone depois de falar.</div>}

      {/* missões */}
      {cenario && (
        <ol className="mt-3 flex flex-wrap gap-2" aria-label="Missões da conversa">
          {cenario.missoes.map((m, i) => (
            <li key={m} className={`rounded-full px-3 py-1 text-xs font-semibold ${missoes[i] ? "bg-brand text-brand-ink" : "bg-surface-2 text-ink-soft"}`}>
              {missoes[i] ? "✓ " : `${i + 1}. `}{m}
            </li>
          ))}
        </ol>
      )}

      {/* tutor */}
      <div className="relative mx-auto mt-2 w-full max-w-xs flex-1">
        <TutorCharacter visual={tutor.visual} nome={tutor.nome} estado={estado} visema={visema} expressao={expressao} className="h-full max-h-[32vh] w-full" />
        {fase === "conectando" && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="rounded-full bg-surface px-4 py-2 text-sm font-bold shadow">Conectando com {tutor.nome}…</span>
          </div>
        )}
      </div>

      <p className="text-center text-sm font-bold text-brand" aria-live="polite">{fase === "ao_vivo" ? ESTADO_LABEL[estado] : ""}</p>

      {/* legendas */}
      <div className="mt-2 min-h-20 text-center">
        {legendas && legendaTutor && <p className="text-lg font-semibold leading-snug">{legendaTutor}</p>}
        {falaAluno && <p className="mt-1 text-sm text-ink-soft">Você: {falaAluno}</p>}
        {auxiliar && (
          <p className="mx-auto mt-2 max-w-sm rounded-2xl bg-brand-soft px-3 py-2 text-sm">
            {auxiliar} <button className="ml-1 underline" onClick={() => setAuxiliar(null)}>fechar</button>
          </p>
        )}
      </div>

      {fase === "microfone_bloqueado" && (
        <div role="alert" className="mt-2 rounded-2xl bg-warn-soft p-3 text-sm">
          <b className="text-warn">Microfone bloqueado.</b> Toque no cadeado ao lado do endereço do site e permita o microfone. Depois, recarregue a página.
        </div>
      )}
      {fase === "erro" && (
        <div role="alert" className="mt-2 rounded-2xl bg-accent-soft p-3 text-sm">
          {aviso ?? "Algo deu errado na conexão."} <button className="font-bold underline" onClick={() => location.reload()}>Tentar de novo</button>
        </div>
      )}

      {/* controles */}
      <div className="mt-3 flex items-center justify-center">
        <button
          onClick={tocarMicrofone}
          disabled={fase !== "ao_vivo"}
          aria-label={estado === "falando" ? "Interromper o tutor" : "Microfone"}
          className="relative grid size-20 place-items-center rounded-full bg-brand text-3xl text-brand-ink shadow-lg disabled:opacity-50"
        >
          {estado === "ouvindo" && (
            <span className="anim-ring absolute inset-0 rounded-full bg-brand" style={{ transform: `scale(${1 + Math.min(volumeMic * 4, 0.4)})` }} />
          )}
          <span className="relative" aria-hidden>🎙️</span>
        </button>
      </div>
      <button className="mx-auto mt-1 min-h-11 text-xs font-semibold text-ink-soft underline" onClick={() => setMaosLivres((m) => !m)}>
        {maosLivres ? "Mãos livres ligado" : "Toque para enviar sua fala"}
      </button>

      {modo !== "nivelamento" && (
        <div className="mt-2 grid grid-cols-4 gap-2 text-xs font-semibold">
          <button className="btn-ghost px-2" aria-pressed={devagar} onClick={maisDevagar}>🐢<br />Devagar</button>
          <button className="btn-ghost px-2" onClick={traduzir} disabled={!legendaTutor}>🇧🇷<br />Traduzir</button>
          <button className="btn-ghost px-2" onClick={dica}>💡<br />Dica</button>
          <button className="btn-ghost px-2" onClick={() => setLegendas((l) => !l)} aria-pressed={legendas}>CC<br />Legenda</button>
        </div>
      )}
      <button className="btn-ghost mt-3 w-full text-danger" onClick={() => { if (confirm("Encerrar a aula agora?")) encerrar(); }}>Encerrar</button>
    </div>
  );
}
