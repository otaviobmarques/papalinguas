#!/usr/bin/env python3
"""
Bocas "procedurais" para tutores em cartoon: abre a boca do próprio retrato em vez de usar fotos de boca.

Nas fotos de boca geradas por IA, a pele em volta, a cor dos lábios e até o queixo mudam um pouco, e em
desenho (pele lisa) isso aparece como uma boca "colada", de outra cor. Aqui todos os pixels de pele vêm do
retrato: o lábio de baixo e o queixo descem (deformação suave) e o espaço aberto recebe o interior da boca
(tons do próprio lábio, escurecidos), com dentes de cima e língua. Para "O" e "U" os lábios se juntam para o
centro; para "E/I" esticam um pouco.

Uso: python3 scripts/bocas-procedurais.py <slug> [<slug> ...]
     Lê public/tutores/<slug>/base.webp e grava boca-1..6.webp e a região "boca" em src/lib/tutores/fotos.json.
"""
import json
import os
import sys

import cv2
import numpy as np

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# visema do app -> (abertura em fração da largura da boca, aperto horizontal, altura dos dentes, língua, curva)
#   aperto > 1 junta os lábios para o centro (O/U); < 1 estica (E/I)
#   curva: < 1 deixa a abertura arredondada (O), > 1 afina os cantos (amêndoa)
FORMAS = {
    1: (0.26, 1.00, 0.30, True, 1.3),   # A: boca aberta média
    2: (0.15, 0.96, 0.50, False, 1.5),  # E/I: entreaberta, um pouco esticada, dentes à mostra
    3: (0.26, 1.50, 0.18, True, 0.7),   # O: arredondada
    4: (0.10, 1.70, 0.00, False, 0.8),  # U/W: biquinho quase fechado
    5: (0.00, 1.00, 0.00, False, 1.0),  # M/B/P: fechada (o próprio retrato)
    6: (0.08, 0.98, 0.75, False, 1.6),  # F/V/S: quase fechada, dentes de cima à mostra
}


def achar_boca(base):
    """Linha entre os lábios (y para cada x) e os cantos da boca, pela dobra escura entre os lábios."""
    h, w = base.shape[:2]
    ycc = cv2.cvtColor(base, cv2.COLOR_BGR2YCrCb).astype(np.float32)
    cr = cv2.GaussianBlur(ycc[:, :, 1], (5, 5), 0)
    lum = cv2.GaussianBlur(ycc[:, :, 0], (3, 3), 0)
    # centro dos lábios: pixels mais avermelhados do centro-baixo do rosto
    x0, x1, y0, y1 = int(w * 0.36), int(w * 0.64), int(h * 0.36), int(h * 0.66)
    reg = cr[y0:y1, x0:x1]
    ys, xs = np.nonzero(reg >= np.percentile(reg, 98.0))
    cy, cxl = y0 + float(np.median(ys)), x0 + float(np.median(xs))
    alt = int(h * 0.03)  # meia altura da faixa onde procurar a dobra
    meia = int(w * 0.11)
    xs_all = np.arange(int(cxl - meia), int(cxl + meia) + 1)
    yline = np.zeros(len(xs_all), np.float32)
    contraste = np.zeros(len(xs_all), np.float32)
    for i, x in enumerate(xs_all):
        col = lum[int(cy) - alt:int(cy) + alt + 1, x]
        k = int(np.argmin(col))
        yline[i] = int(cy) - alt + k
        contraste[i] = float(np.median(col)) - float(col[k])
    # cantos: onde a dobra entre os lábios fica bem mais fraca que no meio da boca
    # (falhas de até 2 px não interrompem a busca)
    centro = int(np.argmin(np.abs(xs_all - cxl)))

    def canto(passo):
        lim = 0.6 * float(np.median(contraste[max(0, centro - 15):centro + 16]))
        k, ultimo, falha = centro, centro, 0
        while 0 <= k + passo < len(contraste):
            k += passo
            if contraste[k] >= lim:
                ultimo, falha = k, 0
            else:
                falha += 1
                if falha > 2:
                    break
        return ultimo

    esq, dir_ = canto(-1), canto(+1)
    xa, xb = int(xs_all[esq]), int(xs_all[dir_])
    # linha suave (parábola) entre os cantos
    sel = slice(esq, dir_ + 1)
    coef = np.polyfit(xs_all[sel].astype(np.float32), yline[sel], 2)
    linha = np.polyval(coef, np.arange(w)).astype(np.float32)
    cor_labio = base[int(cy) + 2:int(cy) + alt, int(cxl) - 3:int(cxl) + 4].reshape(-1, 3).mean(axis=0)
    return linha, xa, xb, cor_labio


def gerar_boca(base, boca, forma):
    abert, aperto, dentes, lingua, curva = forma
    if abert == 0 and aperto == 1:
        return base.copy()
    h, w = base.shape[:2]
    linha, xa, xb, cor_labio = boca
    cx = (xa + xb) / 2
    larg = float(xb - xa)
    H = abert * larg  # quanto o lábio de baixo desce no centro
    Y, X = np.mgrid[0:h, 0:w].astype(np.float32)
    ylin = float(np.interp(cx, np.arange(w), linha))

    # 1) aperto horizontal: a região da boca se junta (O/U) ou estica (E/I) em direção ao centro
    peso = np.exp(-((Y - ylin) / (larg * 0.45)) ** 2) * np.exp(-((X - cx) / (larg * 0.75)) ** 2)
    fx = cx + (X - cx) * (1 + (aperto - 1) * peso)

    # 2) abertura em forma de lente entre os cantos (já apertados)
    meia = larg / 2 / aperto
    t = np.clip((X - (cx - meia)) / (2 * meia), 0, 1)
    abre = H * np.maximum(np.sin(np.pi * t), 0) ** curva

    # 3) o lábio de baixo e o queixo descem; o deslocamento some suavemente mais abaixo
    lin = np.interp(fx, np.arange(w), linha)
    dist = Y - lin
    alcance = larg * 1.4
    queda = np.maximum(abre, H * 0.55 * np.exp(-((X - cx) / (larg * 0.8)) ** 2))
    decai = np.clip(1 - (dist - abre) / alcance, 0, 1) ** 1.6
    desloc = np.where(dist <= abre, np.clip(dist, 0, None), queda * decai + 0 * dist)
    desloc = np.where(dist <= 0, 0, np.where(dist <= abre, dist, np.minimum(dist, queda * decai + abre * 0)))
    fy = np.where(dist <= 0, Y, np.where(dist <= abre, lin, Y - desloc))
    out = cv2.remap(base, fx.astype(np.float32), fy.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)

    # 4) interior da boca, nas cores do próprio lábio
    dentro = ((dist > 0) & (dist < abre)).astype(np.float32)
    if dentro.sum() == 0:
        return out
    labio = cor_labio.astype(np.float32)
    fundo = labio * 0.38                      # garganta: lábio escurecido (vermelho escuro, não preto)
    tom_lingua = labio * 0.85 + np.array([20, 20, 10], np.float32)
    prof = np.clip(dist / np.maximum(abre, 1e-3), 0, 1)[..., None]
    interior = np.broadcast_to(fundo, out.shape).astype(np.float32).copy()
    interior = interior * (1 - 0.25 * prof)   # um pouco mais escuro no meio
    if lingua:
        lg = (np.clip((prof - 0.6) / 0.4, 0, 1) * 0.9)
        interior = interior * (1 - lg) + tom_lingua * lg
    if dentes > 0:
        alt_d = np.maximum(abre * dentes, 1.5)
        lado = np.clip(1 - np.abs(t - 0.5) / 0.30, 0, 1)
        dn = ((dist > 0) & (dist < alt_d) & (lado > 0)).astype(np.float32)
        dn = cv2.GaussianBlur(dn, (3, 3), 0)[..., None]
        interior = interior * (1 - dn * 0.92) + np.array([214, 224, 234], np.float32) * dn * 0.92
    a = cv2.GaussianBlur(dentro, (3, 3), 0)[..., None]
    return np.clip(out.astype(np.float32) * (1 - a) + interior * a, 0, 255).astype(np.uint8)


def caixa(base, imgs):
    """Caixa de tudo que muda em alguma das bocas, com folga."""
    h, w = base.shape[:2]
    muda = np.zeros((h, w), np.uint8)
    for im in imgs:
        muda |= (cv2.absdiff(im, base).max(axis=2) > 2).astype(np.uint8)
    ys, xs = np.nonzero(muda)
    f = 8
    return max(0, xs.min() - f), max(0, ys.min() - f), min(w, xs.max() + f + 1), min(h, ys.max() + f + 1)


def main():
    destino = os.path.join(RAIZ, "src", "lib", "tutores", "fotos.json")
    fotos = json.load(open(destino))
    for slug in sys.argv[1:]:
        pasta = os.path.join(RAIZ, "public", "tutores", slug)
        base = cv2.imread(os.path.join(pasta, "base.webp"))
        boca = achar_boca(base)
        bocas = {v: gerar_boca(base, boca, f) for v, f in FORMAS.items()}
        x0, y0, x1, y1 = caixa(base, list(bocas.values()))
        for v, im in bocas.items():
            rec = im[y0:y1, x0:x1]
            # alfa só onde algo mudou (com borda suave): fora disso, aparece o próprio retrato
            mudou = (cv2.absdiff(rec, base[y0:y1, x0:x1]).max(axis=2) > 1).astype(np.uint8) * 255
            alfa = cv2.GaussianBlur(cv2.dilate(mudou, np.ones((5, 5), np.uint8)), (5, 5), 0)
            cv2.imwrite(os.path.join(pasta, f"boca-{v}.webp"), np.dstack([rec, alfa]), [cv2.IMWRITE_WEBP_QUALITY, 100])
        H, W = base.shape[:2]
        fotos[slug]["boca"] = {"x": round(x0 / W, 4), "y": round(y0 / H, 4), "w": round((x1 - x0) / W, 4), "h": round((y1 - y0) / H, 4)}
        print(f"{slug}: bocas procedurais (boca de {boca[2] - boca[1]} px), recorte {x1 - x0}x{y1 - y0} px")
    with open(destino, "w") as f:
        json.dump(fotos, f, indent=2, ensure_ascii=False)
        f.write("\n")


if __name__ == "__main__":
    main()
