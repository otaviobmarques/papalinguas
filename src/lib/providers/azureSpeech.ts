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

/** Regiões da Azure com o serviço de voz. A chave só emite token na região do recurso. */
export const REGIOES_AZURE = [
  "eastus", "eastus2", "westus", "westus2", "westus3", "centralus", "northcentralus", "southcentralus", "westcentralus",
  "canadacentral", "canadaeast", "brazilsouth", "mexicocentral", "northeurope", "westeurope", "uksouth", "ukwest", "francecentral",
  "germanywestcentral", "swedencentral", "switzerlandnorth", "switzerlandwest", "norwayeast", "italynorth", "polandcentral",
  "spaincentral", "eastasia", "southeastasia", "japaneast", "japanwest", "koreacentral", "australiaeast", "centralindia",
  "southindia", "westindia", "uaenorth", "qatarcentral", "southafricanorth", "israelcentral",
];

/** Descobre a região testando a chave em todas as regiões em paralelo (só a certa responde 200). */
export async function descobrirRegiao(chave: string, f: typeof fetch = fetch, regioes = REGIOES_AZURE): Promise<string | null> {
  const tentativas = regioes.map(async (r) => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 8000);
    try {
      const resp = await f(urlTokenAzure(r), { method: "POST", headers: { "Ocp-Apim-Subscription-Key": chave, "Content-Length": "0" }, signal: ctl.signal });
      if (resp.ok) return r;
    } catch {}
    finally { clearTimeout(t); }
    throw new Error("não");
  });
  try {
    return await Promise.any(tentativas);
  } catch {
    return null;
  }
}

export async function validarAzure(chave: string, regiao: string, f: typeof fetch = fetch): Promise<{ ok: true; regiao?: string } | { ok: false; motivo: string }> {
  if (!normalizarRegiao(regiao)) {
    const achada = await descobrirRegiao(chave, f);
    return achada ? { ok: true, regiao: achada } : { ok: false, motivo: "Não encontramos nenhuma região em que essa chave funcione. Confira se copiou a chave inteira." };
  }
  if (!/^[a-z0-9]{4,40}$/.test(normalizarRegiao(regiao))) return { ok: false, motivo: "Região inválida (ex.: East US ou Brazil South), ou deixe em branco para detectar." };
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
