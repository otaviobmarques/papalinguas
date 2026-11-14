#!/usr/bin/env python3
"""
Prepara as fotos dos tutores para o app (retrato base + recortes de boca, olhos e expressões).

Entrada: uma pasta por tutor com os arquivos que o Grok entrega:
  base.jpg (ou <slug>_base.jpg), boca_A_fechada.jpg ... boca_G_lingua.jpg,
  olhos_fechados.jpg, expressao_feliz.jpg, expressao_surpresa.jpg
Saída:
  public/tutores/<slug>/base.webp, card.webp e, se o conjunto estiver completo,
  boca-1..6.webp, olhos.webp, feliz.webp, surpresa.webp (recortes com borda suave)
  src/lib/tutores/fotos.json (posição de cada recorte, em fração da imagem)

Cada quadro é alinhado ao retrato base (ECC afim) e só a região que muda é recortada.
Assim a cabeça, o cabelo e a luz ficam parados e apenas a boca e os olhos se mexem.

Uso: pip install opencv-python-headless numpy
     python3 scripts/tutores-fotos.py <pasta-com-subpastas-por-tutor> [--gerados]
     (--gerados: tutores feitos com scripts/tutores-gerar-openai.py; ver VISEMA_PARA_BOCA_GERADOS)
"""
import json
import os
import sys

import cv2
import numpy as np

LADO = 768  # tamanho do retrato servido (suficiente para telas retina até ~380 px)
CARD = 400
# visema do app (src/lib/domain/lipsync.ts) -> boca usada.
# As fotos "aberta larga" (B) e "sorriso com dentes" (C) são extremas e, na fala, ficavam exageradas
# (abrindo demais e esticando para os lados). Usamos posições moderadas: "A" com a arredondada (D)
# e "E/I", o som mais frequente, com a boca entreaberta da expressão "surpresa".
VISEMA_PARA_BOCA = {1: "D", 2: "surpresa", 3: "D", 4: "E", 5: "A", 6: "F"}
# Tutores gerados pela OpenAI (scripts/tutores-gerar-openai.py, opção --gerados): a "arredondada" (D)
# deles é um "ô" bem marcado e, usada também no "A", deixava a boca com cara de "ô-ô-ô", fora do ritmo da fala.
# Neles, o "A" usa a boca entreaberta da foto "língua" (G), que parece fala normal; o "O" continua com a D.
# O chiado (F/V/S/CH, muito comum em francês, alemão e japonês) usa os dentes à mostra (C): a "lábio no dente"
# gerada é quase fechada e, em trechos longos, parecia fala de boca fechada.
VISEMA_PARA_BOCA_GERADOS = {1: "G", 2: "surpresa", 3: "D", 4: "E", 5: "A", 6: "C"}
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def achar(pasta, *nomes):
    arquivos = os.listdir(pasta)
    for n in nomes:
        for a in arquivos:
            if a.lower().endswith(".jpg") and (a.lower() == f"{n}.jpg" or a.lower().startswith(f"{n}_") or a.lower().endswith(f"_{n}.jpg")):
                return os.path.join(pasta, a)
    return None


def alinhar(base, img):
    g0 = cv2.cvtColor(base, cv2.COLOR_BGR2GRAY).astype(np.float32)
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    w = np.eye(2, 3, dtype=np.float32)
    try:
        _, w = cv2.findTransformECC(g0, g, w, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), None, 5)
    except cv2.error:
        pass
    return cv2.warpAffine(img, w, (base.shape[1], base.shape[0]), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)


def caixa_mudanca(base, img, zona):
    """Caixa (x0,y0,x1,y1) do que mudou dentro de uma zona (frações), ou None."""
    h, w = base.shape[:2]
    d = cv2.absdiff(cv2.GaussianBlur(img, (9, 9), 0), cv2.GaussianBlur(base, (9, 9), 0)).max(axis=2)
    m = (d > 26).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
    zx0, zy0, zx1, zy1 = (int(zona[0] * w), int(zona[1] * h), int(zona[2] * w), int(zona[3] * h))
    sub = m[zy0:zy1, zx0:zx1]
    ys, xs = np.nonzero(sub)
    if len(xs) < 40:
        return None
    return (xs.min() + zx0, ys.min() + zy0, xs.max() + zx0, ys.max() + zy0)


def unir(caixas):
    caixas = [c for c in caixas if c]
    return (min(c[0] for c in caixas), min(c[1] for c in caixas), max(c[2] for c in caixas), max(c[3] for c in caixas))


def folga(c, px, w, h):
    return (max(0, c[0] - px), max(0, c[1] - px), min(w, c[2] + px), min(h, c[3] + px))


def mascara_elipse(cw, ch):
    m = np.zeros((ch, cw), np.float32)
    cv2.ellipse(m, (cw // 2, ch // 2), (int(cw * 0.40), int(ch * 0.40)), 0, 0, 360, 1.0, -1)
    k = int(min(cw, ch) * 0.18) | 1
    return cv2.GaussianBlur(m, (k, k), 0)


def mascara_cobertura(base, imgs, c):
    """Máscara que cobre com opacidade total tudo o que muda em qualquer das imagens (com folga),
    para o retrato nunca aparecer por baixo (ex.: cantos da boca fechada atrás da boca aberta)."""
    x0, y0, x1, y1 = c
    w, h = x1 - x0, y1 - y0
    muda = np.zeros((h, w), np.uint8)
    bb = cv2.GaussianBlur(base[y0:y1, x0:x1], (5, 5), 0)
    for im in imgs:
        d = cv2.absdiff(cv2.GaussianBlur(im[y0:y1, x0:x1], (5, 5), 0), bb).max(axis=2)
        muda |= (d > 18).astype(np.uint8)
    muda = cv2.morphologyEx(muda, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    folga = max(9, int(min(w, h) * 0.09)) | 1
    muda = cv2.dilate(muda, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (folga, folga)))
    k = max(11, int(min(w, h) * 0.12)) | 1
    m = cv2.GaussianBlur(muda.astype(np.float32), (k, k), 0)
    m = np.clip(m * 1.6, 0, 1)  # o núcleo fica totalmente opaco; só a borda externa é suave
    m = np.maximum(m, mascara_elipse(w, h) * 0.999)
    # a borda da região nunca pode ficar opaca (senão aparece um retângulo)
    borda = np.ones((h, w), np.float32)
    e = max(4, int(min(w, h) * 0.06))
    rampa = np.linspace(0, 1, e)
    borda[:e, :] *= rampa[:, None]; borda[-e:, :] *= rampa[::-1][:, None]
    borda[:, :e] *= rampa[None, :]; borda[:, -e:] *= rampa[::-1][None, :]
    return m * borda


def recorte(base, img, c, mascara=None):
    """Recorte RGBA da região c de img, com borda suave e cor ajustada ao retrato base."""
    x0, y0, x1, y1 = c
    p = img[y0:y1, x0:x1].astype(np.float32)
    b = base[y0:y1, x0:x1].astype(np.float32)
    a = mascara if mascara is not None else mascara_elipse(x1 - x0, y1 - y0)
    anel = (a > 0.05) & (a < 0.6)
    if anel.sum() > 50:  # compensa pequena diferença de exposição entre as fotos
        ganho = (b[anel].mean(axis=0) + 1) / (p[anel].mean(axis=0) + 1)
        p = np.clip(p * np.clip(ganho, 0.9, 1.1), 0, 255)
    rgba = np.dstack([p.astype(np.uint8), (a * 255).astype(np.uint8)])
    return rgba


DESVIO_MAX = 0.07  # 7% da largura da região da boca (medido: bocas normais ficam até ~5%)


def desvio_horizontal(base, img, c):
    """Quanto o que muda na boca está deslocado do centro da região (fração da largura; + = para a direita)."""
    x0, y0, x1, y1 = c
    d = cv2.absdiff(cv2.GaussianBlur(img[y0:y1, x0:x1], (5, 5), 0), cv2.GaussianBlur(base[y0:y1, x0:x1], (5, 5), 0)).max(axis=2)
    a = mascara_elipse(x1 - x0, y1 - y0)
    ys, xs = np.nonzero((d * a) > 30)
    if len(xs) < 50:
        return 0.0
    return (xs.mean() - (x1 - x0) / 2) / (x1 - x0)


def salvar_webp(caminho, img, q=82):
    cv2.imwrite(caminho, img, [cv2.IMWRITE_WEBP_QUALITY, q])


def frac(c, w, h):
    return {"x": round(c[0] / w, 4), "y": round(c[1] / h, 4), "w": round((c[2] - c[0]) / w, 4), "h": round((c[3] - c[1]) / h, 4)}


def processar(pasta, slug, mapa=VISEMA_PARA_BOCA):
    base_p = achar(pasta, "base", f"{slug}_base")
    if not base_p:
        return None
    base = cv2.resize(cv2.imread(base_p), (LADO, LADO), interpolation=cv2.INTER_AREA)
    saida = os.path.join(RAIZ, "public", "tutores", slug)
    os.makedirs(saida, exist_ok=True)
    salvar_webp(os.path.join(saida, "base.webp"), base, 84)
    salvar_webp(os.path.join(saida, "card.webp"), cv2.resize(base, (CARD, CARD), interpolation=cv2.INTER_AREA), 80)
    info = {"base": f"/tutores/{slug}/base.webp", "card": f"/tutores/{slug}/card.webp", "animado": False}

    letras = {L: achar(pasta, f"boca_{L.lower()}") for L in "ABCDEFG"}
    olhos_p = achar(pasta, "olhos_fechados", "olhos")
    if not all(letras[L] for L in "ABCDEF") or not olhos_p:
        return info

    ler = lambda p: alinhar(base, cv2.resize(cv2.imread(p), (LADO, LADO), interpolation=cv2.INTER_AREA))
    bocas = {L: ler(p) for L, p in letras.items() if p}
    olhos = ler(olhos_p)
    zona_boca, zona_olhos = (0.33, 0.42, 0.67, 0.78), (0.30, 0.26, 0.70, 0.46)

    cb = unir([caixa_mudanca(base, im, zona_boca) for im in bocas.values()])
    cb = folga(cb, int(LADO * 0.05), LADO, LADO)
    co = caixa_mudanca(base, olhos, zona_olhos) or (int(LADO * 0.38), int(LADO * 0.32), int(LADO * 0.62), int(LADO * 0.40))
    co = folga(co, int(LADO * 0.035), LADO, LADO)

    surpresa_p = achar(pasta, "expressao_surpresa", "surpresa")
    if surpresa_p:
        bocas["surpresa"] = ler(surpresa_p)
    escolhas = {}
    for v, L in mapa.items():
        escolha = L if bocas.get(L) is not None else "C"  # sem a foto "surpresa": volta ao sorriso com dentes
        # boca torta (ex.: mordendo o lábio de um lado) fica estranha na fala: troca por uma centralizada
        # M/B/P (lábios fechados) nunca troca por uma boca aberta: a alternativa é a F, quase fechada
        for alternativa in (("F",) if v == 5 else ("surpresa", "A")):
            if abs(desvio_horizontal(base, bocas[escolha], cb)) <= DESVIO_MAX or alternativa not in bocas:
                break
            print(f"  {slug}: boca {L} da posição {v} está deslocada para o lado; usando {alternativa}")
            escolha = alternativa
        escolhas[v] = escolha
    # uma máscara só para todas as bocas: cobre a união do que muda em qualquer uma delas
    m_boca = mascara_cobertura(base, [bocas[e] for e in set(escolhas.values())], cb)
    for v, escolha in escolhas.items():
        cv2.imwrite(os.path.join(saida, f"boca-{v}.webp"), recorte(base, bocas[escolha], cb, m_boca), [cv2.IMWRITE_WEBP_QUALITY, 85])
    cv2.imwrite(os.path.join(saida, "olhos.webp"), recorte(base, olhos, co), [cv2.IMWRITE_WEBP_QUALITY, 85])
    info.update({"animado": True, "boca": frac(cb, LADO, LADO), "olhos": frac(co, LADO, LADO), "expressoes": {}})

    # expressões: só as que não mexem a cabeça (a "pensativa" costuma inclinar o rosto)
    rosto = folga(unir([cb, co]), int(LADO * 0.02), LADO, LADO)
    for nome in ("feliz", "surpresa"):
        p = achar(pasta, f"expressao_{nome}", nome)
        if not p:
            continue
        im = ler(p)
        cv2.imwrite(os.path.join(saida, f"{nome}.webp"), recorte(base, im, rosto), [cv2.IMWRITE_WEBP_QUALITY, 85])
        info["expressoes"][nome] = f"/tutores/{slug}/{nome}.webp"
    info["rosto"] = frac(rosto, LADO, LADO)
    return info


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    entrada = sys.argv[1]
    mapa = VISEMA_PARA_BOCA_GERADOS if "--gerados" in sys.argv[2:] else VISEMA_PARA_BOCA
    destino = os.path.join(RAIZ, "src", "lib", "tutores", "fotos.json")
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    todos = json.load(open(destino)) if os.path.exists(destino) else {}
    for slug in sorted(os.listdir(entrada)):
        pasta = os.path.join(entrada, slug)
        if not os.path.isdir(pasta):
            continue
        info = processar(pasta, slug, mapa)
        if info:
            todos[slug] = info
            print(f"{slug}: {'animado' if info['animado'] else 'só retrato'}")
    with open(destino, "w") as f:
        json.dump(todos, f, indent=2, ensure_ascii=False)
        f.write("\n")


if __name__ == "__main__":
    main()
