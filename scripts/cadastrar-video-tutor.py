#!/usr/bin/env python3
"""Cadastra tutores em vídeo: entrada em src/lib/tutores/videos.ts e, no fotos.json, retrato estático
(o visual novo), sem os recortes de boca antigos, que não casam mais com o retrato novo.
Uso: python3 scripts/cadastrar-video-tutor.py <slug> [<slug> ...]"""
import json, os, re, sys
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pv = os.path.join(RAIZ, "src", "lib", "tutores", "videos.ts")
s = open(pv).read()
fotos_p = os.path.join(RAIZ, "src", "lib", "tutores", "fotos.json")
fotos = json.load(open(fotos_p))
for slug in sys.argv[1:]:
    if f"  {slug}: {{" not in s:
        linha = f'  {slug}: {{ falando: "/tutores/{slug}/falando.mp4", ouvindo: "/tutores/{slug}/ouvindo.mp4", poster: "/tutores/{slug}/video-poster.jpg" }},\n'
        s = re.sub(r"(export const TUTORES_VIDEO[^=]*= \{\n)", r"\1" + linha.replace("\\", "\\\\"), s, count=1)
    if slug in fotos:
        d = os.path.join(RAIZ, "public", "tutores", slug)
        for f in os.listdir(d):
            if re.match(r"(boca-\d|olhos|feliz|surpresa)\.webp$", f):
                os.remove(os.path.join(d, f))
        fotos[slug] = {"base": f"/tutores/{slug}/base.webp", "card": f"/tutores/{slug}/card.webp", "animado": False}
    print(slug, "cadastrado")
open(pv, "w").write(s)
with open(fotos_p, "w") as f:
    json.dump(fotos, f, indent=2, ensure_ascii=False); f.write("\n")
