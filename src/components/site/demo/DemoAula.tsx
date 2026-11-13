"use client";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import TutorFoto from "@/components/TutorFoto";
import Simbolo from "@/components/marca/Simbolo";
import { COR } from "@/lib/marca";
import type { Visema } from "@/lib/domain/lipsync";
import { VISEMAS_GRACE } from "./grace-visemas";

export const DEMO = { largura: 900, altura: 1180, fps: 30, duracao: 450 } as const;

const FALA_INICIO = 18;
const FALA = "Hey, I'm Grace! So, you've got an interview coming up? Great. Let's practice. Tell me about a project you're really proud of.";
const ALUNO = 300; // quadro em que o aluno responde
const CORRECAO = 352;
const RELATORIO = 392;
const PISCADAS = [70, 190, 262, 340, 420];

function Pilula({ children, cor, fundo }: { children: React.ReactNode; cor: string; fundo: string }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 999, background: fundo, color: cor, fontWeight: 700, fontSize: 24 }}>{children}</span>;
}

/** Demonstração de uma aula (Remotion): tutora falando, legenda, resposta do aluno, correção e relatório. */
export default function DemoAula() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const i = f - FALA_INICIO;
  const visema = (i >= 0 && i < VISEMAS_GRACE.length ? Number(VISEMAS_GRACE[i]) : 0) as Visema;
  const falando = visema !== 0 || (i > 0 && i < VISEMAS_GRACE.length - 6);
  const palavras = FALA.split(" ");
  const visiveis = Math.round(interpolate(i, [0, VISEMAS_GRACE.length - 10], [0, palavras.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const entrada = spring({ frame: f, fps, config: { damping: 200 } });
  const aluno = spring({ frame: f - ALUNO, fps, config: { damping: 16, stiffness: 120 } });
  const correcao = spring({ frame: f - CORRECAO, fps, config: { damping: 14, stiffness: 130 } });
  const relatorio = spring({ frame: f - RELATORIO, fps, config: { damping: 18 } });
  const nota = Math.round(interpolate(f, [RELATORIO, RELATORIO + 30], [0, 86], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const saida = interpolate(f, [DEMO.duracao - 14, DEMO.duracao], [1, 0], { extrapolateLeft: "clamp" });
  const ondas = Array.from({ length: 22 }, (_, k) => 10 + Math.abs(Math.sin((f + k * 7) / 4)) * 34);

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#111a2c 0%,#0b1220 100%)", fontFamily: "var(--font-manrope), Manrope, sans-serif", color: "#F1F5F9", opacity: saida }}>
      <Sequence from={FALA_INICIO}><Audio src="/tutores/audio/grace.mp3" /></Sequence>

      {/* topo */}
      <div style={{ position: "absolute", left: 40, right: 40, top: 34, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: entrada }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Simbolo className="h-[52px] w-[52px]" />
          <div><div style={{ fontWeight: 800, fontSize: 28 }}>Entrevista de emprego</div><div style={{ color: "#A3AEC2", fontSize: 22 }}>Inglês · B1 · com a Grace</div></div>
        </div>
      </div>

      {/* tutora */}
      <div style={{ position: "absolute", left: 40, right: 40, top: 130, bottom: 34, borderRadius: 36, overflow: "hidden", background: "#efe3d3", transform: `scale(${0.96 + entrada * 0.04})` }}>
        <TutorFoto slug="grace" nome="Grace" estado={falando ? "falando" : f > ALUNO && f < CORRECAO ? "ouvindo" : "repouso"} visema={visema}
          expressao={f > CORRECAO ? "sorriso" : "neutra"} piscando={PISCADAS.some((p) => f >= p && f < p + 4)} enquadramento="preencher" className="h-full w-full overflow-hidden" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 48%, rgba(11,18,32,.6) 62%, rgba(11,18,32,.95) 80%)" }} />
        {/* legenda */}
        <div style={{ position: "absolute", left: 22, right: 22, top: 528, padding: "18px 22px", borderRadius: 24, background: "rgba(11,18,32,.82)", fontSize: 27, lineHeight: 1.35, fontWeight: 600, minHeight: 92, opacity: i > 0 ? 1 : 0 }}>
          {palavras.slice(0, visiveis).join(" ")}
        </div>
      </div>

      {/* resposta do aluno */}
      <div style={{ position: "absolute", right: 64, top: 800, maxWidth: 620, padding: "20px 24px", borderRadius: "28px 28px 8px 28px", background: COR.verde, color: "#04170B", fontSize: 27, fontWeight: 700,
        opacity: aluno, transform: `translateY(${(1 - aluno) * 40}px)` }}>
        I&apos;m proud of a project where I <span style={{ textDecoration: "underline wavy #04170B88", textUnderlineOffset: 6 }}>lead</span> the team.
        <div style={{ display: "flex", gap: 4, alignItems: "center", height: 40, marginTop: 8, opacity: 0.6 }}>
          {ondas.map((h, k) => <span key={k} style={{ width: 6, height: f < CORRECAO ? h * 0.6 : 6, borderRadius: 3, background: "#04170B" }} />)}
        </div>
      </div>

      {/* correção gentil */}
      <div style={{ position: "absolute", left: 64, top: 965, display: "flex", gap: 12, alignItems: "center", opacity: correcao, transform: `translateX(${(1 - correcao) * -60}px)` }}>
        <Pilula cor="#0B1220" fundo={COR.amarelo}>✦ Dica</Pilula>
        <span style={{ fontSize: 27, fontWeight: 700 }}>No passado: <span style={{ color: COR.amarelo }}>“I <b>led</b> the team”</span></span>
      </div>

      {/* relatório */}
      <div style={{ position: "absolute", left: 64, right: 64, bottom: 54, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, opacity: relatorio, transform: `translateY(${(1 - relatorio) * 50}px)` }}>
        {[[`${nota}`, "pronúncia", COR.verde], ["3", "palavras novas", COR.azul], ["1", "cartão de revisão", COR.vermelho]].map(([n, t, c]) => (
          <div key={t} style={{ borderRadius: 24, background: "rgba(24,35,58,.92)", border: "1px solid #243149", padding: "10px 18px" }}>
            <div style={{ fontSize: 38, fontWeight: 800, color: c }}>{n}</div>
            <div style={{ fontSize: 21, color: "#A3AEC2" }}>{t}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}
