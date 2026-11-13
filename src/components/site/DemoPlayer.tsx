"use client";
import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef, useState } from "react";
import DemoAula, { DEMO } from "./demo/DemoAula";

/** Player Remotion da demonstração: começa mudo e em loop; o visitante liga o som. */
export default function DemoPlayer({ className = "" }: { className?: string }) {
  const ref = useRef<PlayerRef>(null);
  const [mudo, setMudo] = useState(true);
  const [reduzir, setReduzir] = useState(false);
  useEffect(() => setReduzir(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);

  return (
    <div className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-surface shadow-[0_40px_120px_-30px_rgba(24,169,87,.35)] ${className}`}>
      <Player
        ref={ref}
        component={DemoAula}
        durationInFrames={DEMO.duracao}
        fps={DEMO.fps}
        compositionWidth={DEMO.largura}
        compositionHeight={DEMO.altura}
        style={{ width: "100%", aspectRatio: `${DEMO.largura} / ${DEMO.altura}` }}
        autoPlay={!reduzir}
        loop
        initiallyMuted
        acknowledgeRemotionLicense
        controls={false}
        clickToPlay={false}
      />
      <button
        type="button"
        onClick={() => {
          const p = ref.current;
          if (!p) return;
          if (mudo) { p.unmute(); p.seekTo(0); p.play(); } else p.mute();
          setMudo(!mudo);
        }}
        className="absolute right-3 top-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-black/60 px-4 text-sm font-bold text-white backdrop-blur hover:bg-black/75"
        aria-pressed={!mudo}
      >
        {mudo ? "🔊 Ouvir a Grace" : "🔇 Sem som"}
      </button>
    </div>
  );
}
