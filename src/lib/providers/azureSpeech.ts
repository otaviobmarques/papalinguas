/** Azure Speech: região normalizada e validação da chave pela emissão de um token (sem custo de uso). */
export function normalizarRegiao(r: string): string {
  return r.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

export const urlTokenAzure = (regiao: string) => `https://${normalizarRegiao(regiao)}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;

export async function emitirTokenAzure(chave: string, regiao: string, f: typeof fetch = fetch): Promise<string> {
  const r = await f(urlTokenAzure(regiao), { method: "POST", headers: { "Ocp-Apim-Subscription-Key": chave, "Content-Length": "0" } });
  if (!r.ok) throw Object.assign(new Error(`Azure ${r.status}`), { status: r.status });
  return r.text();
}

export async function validarAzure(chave: string, regiao: string, f: typeof fetch = fetch): Promise<{ ok: true } | { ok: false; motivo: string }> {
  if (!/^[a-z0-9]{4,40}$/.test(normalizarRegiao(regiao))) return { ok: false, motivo: "Informe a região do recurso (ex.: East US ou Brazil South)." };
  try {
    await emitirTokenAzure(chave, regiao, f);
    return { ok: true };
  } catch (e) {
    const st = (e as { status?: number }).status;
    if (st === 401) return { ok: false, motivo: "A Azure recusou a chave para essa região (401). Confira a chave e a região do recurso." };
    if (st) return { ok: false, motivo: `A Azure respondeu ${st}.` };
    return { ok: false, motivo: "Não foi possível falar com a Azure. Confira a região (ex.: eastus, brazilsouth)." };
  }
}
