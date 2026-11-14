#!/bin/bash
# Ativa um tutor em vídeo a partir dos dois vídeos do Veo/Google Flow (16:9, mesmo enquadramento).
# Uso: scripts/ativar-video-tutor.sh <slug> <falando.mp4> <ouvindo.mp4> [imagem-16x9.png]
#  - recorta o quadrado central (720 px), tira o som e faz a emenda suave do loop (0,5 s);
#  - grava public/tutores/<slug>/{falando,ouvindo}.mp4 e video-poster.jpg;
#  - com a imagem 16:9, troca também o retrato e o card do tutor pelo visual novo.
# Depois, cadastre o slug em src/lib/tutores/videos.ts (scripts/cadastrar-video-tutor.py faz isso).
set -euo pipefail
slug="$1"; F="$2"; O="$3"; IMG="${4:-}"
dir="public/tutores/$slug"; mkdir -p "$dir"
loop() {
  local E="$1" S="$2" X=0.5 D L OFF
  D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$E")
  OFF=$(python3 -c "print(round($D-2*$X,3))")
  local C="crop=ih:ih:(iw-ih)/2:0,scale=720:720,setsar=1,fps=24"
  ffmpeg -v error -y -i "$E" -i "$E" -filter_complex \
    "[0:v]$C,trim=$X:$D,setpts=PTS-STARTPTS[a];[1:v]$C,trim=0:$X,setpts=PTS-STARTPTS[b];[a][b]xfade=transition=fade:duration=$X:offset=$OFF,format=yuv420p[v]" \
    -map "[v]" -an -c:v libx264 -crf 24 -preset slow -movflags +faststart "$S"
}
loop "$F" "$dir/falando.mp4"
loop "$O" "$dir/ouvindo.mp4"
# imagem de abertura: o quadro do "ouvindo" mais parecido com o retrato (evita pegar um piscar)
python3 - "$dir" "$IMG" <<'PY'
import sys, cv2, numpy as np
d, img = sys.argv[1], sys.argv[2]
cap = cv2.VideoCapture(f"{d}/ouvindo.mp4"); quadros = []
while True:
    ok, q = cap.read()
    if not ok: break
    quadros.append(q)
if img:
    ref = cv2.imread(img); h, w = ref.shape[:2]
    ref = cv2.resize(ref[:, (w - h) // 2:(w - h) // 2 + h], (720, 720)).astype(np.float32)
    melhor = min(quadros[::3], key=lambda q: float(np.abs(q.astype(np.float32) - ref).mean()))
else:
    melhor = quadros[0]
cv2.imwrite(f"{d}/video-poster.jpg", melhor, [cv2.IMWRITE_JPEG_QUALITY, 88])
PY
if [ -n "$IMG" ]; then
  python3 - "$IMG" "$dir" <<'PY'
import sys
from PIL import Image
img, d = sys.argv[1], sys.argv[2]
im = Image.open(img).convert("RGB"); w, h = im.size
q = im.crop(((w - h) // 2, 0, (w - h) // 2 + h, h))
q.resize((768, 768), Image.LANCZOS).save(f"{d}/base.webp", quality=84)
q.resize((400, 400), Image.LANCZOS).save(f"{d}/card.webp", quality=80)
PY
fi
echo "$slug: vídeos prontos em $dir"
