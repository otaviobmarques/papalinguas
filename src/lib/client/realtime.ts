"use client";

/**
 * Conexão direta navegador ↔ OpenAI Realtime por WebRTC (Manual 3.2, passo 3),
 * usando o client secret temporário emitido por POST /api/aulas.
 */
export interface CredenciaisVoz {
  clientSecret: string;
  connectUrl: string;
  model: string;
}

export type EventoRealtime = { type: string; [k: string]: unknown };

export interface ConexaoRealtime {
  remoto: MediaStream;
  microfone: MediaStream;
  enviar: (evento: EventoRealtime) => void;
  silenciarMicrofone: (mudo: boolean) => void;
  fechar: () => void;
}

export async function conectarRealtime(
  cred: CredenciaisVoz,
  onEvento: (e: EventoRealtime) => void,
  onEstadoConexao?: (s: RTCPeerConnectionState) => void,
): Promise<ConexaoRealtime> {
  const pc = new RTCPeerConnection();
  const audio = new Audio();
  audio.autoplay = true;

  const remoto = await new Promise<MediaStream>(async (resolve, reject) => {
    pc.ontrack = (e) => {
      audio.srcObject = e.streams[0];
      resolve(e.streams[0]);
    };
    pc.onconnectionstatechange = () => onEstadoConexao?.(pc.connectionState);
    try {
      const mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      pc.addTrack(mic.getAudioTracks()[0], mic);
      (pc as RTCPeerConnection & { _mic?: MediaStream })._mic = mic;

      const dc = pc.createDataChannel("oai-events");
      dc.onmessage = (m) => {
        try {
          onEvento(JSON.parse(m.data));
        } catch {}
      };
      (pc as RTCPeerConnection & { _dc?: RTCDataChannel })._dc = dc;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const r = await fetch(cred.connectUrl, {
        method: "POST",
        body: offer.sdp,
        headers: { Authorization: `Bearer ${cred.clientSecret}`, "Content-Type": "application/sdp" },
      });
      if (!r.ok) throw new Error(`Realtime SDP ${r.status}`);
      await pc.setRemoteDescription({ type: "answer", sdp: await r.text() });
    } catch (e) {
      reject(e);
    }
  });

  const ext = pc as RTCPeerConnection & { _mic: MediaStream; _dc: RTCDataChannel };
  return {
    remoto,
    microfone: ext._mic,
    enviar: (e) => ext._dc.readyState === "open" && ext._dc.send(JSON.stringify(e)),
    silenciarMicrofone: (mudo) => ext._mic.getAudioTracks().forEach((t) => (t.enabled = !mudo)),
    fechar: () => {
      ext._mic.getTracks().forEach((t) => t.stop());
      ext._dc?.close();
      pc.close();
      audio.srcObject = null;
    },
  };
}

/** Pedido "fora da conversa" (não entra no histórico): usado por Traduzir e Dica. */
export function pedidoTexto(instrucoes: string): EventoRealtime {
  return {
    type: "response.create",
    response: { conversation: "none", output_modalities: ["text"], instructions: instrucoes, metadata: { tipo: "auxiliar" } },
  };
}
