"""
Gera fotos de tutores pela API de imagens da OpenAI (alternativa ao Grok).

1. Retrato base: --img <foto de referência de estilo> com a descrição do tutor.
2. Bocas, piscar e expressões: --img <base.png> --mask <máscara> com a mudança pedida.
   A máscara (PNG) é transparente só onde pode mudar; o resto da foto fica igual.
Depois, scripts/tutores-fotos.py alinha e recorta tudo.

Uso: OPENAI_KEY_TESTE=... python3 scripts/tutores-gerar-openai.py --img base.png --mask mask-boca.png --prompt "..." --out boca.png
"""
import base64, os, sys, time, json, requests
KEY = os.environ["OPENAI_KEY_TESTE"]
MODEL = os.environ.get("IMG_MODEL", "gpt-image-2")

def editar(imagens, prompt, saida, mascara=None, n=1, qualidade="high"):
    files = [("image[]", (os.path.basename(p), open(p, "rb"), "image/png")) for p in imagens]
    if mascara:
        files.append(("mask", (os.path.basename(mascara), open(mascara, "rb"), "image/png")))
    data = {"model": MODEL, "prompt": prompt, "size": "1024x1024", "quality": qualidade, "n": str(n)}
    for tentativa in range(3):
        r = requests.post("https://api.openai.com/v1/images/edits", headers={"Authorization": f"Bearer {KEY}"}, files=files, data=data, timeout=600)
        if r.status_code == 200:
            break
        print("erro", r.status_code, r.text[:300], file=sys.stderr)
        if r.status_code < 500: raise SystemExit(1)
        time.sleep(5)
    d = r.json()
    out = []
    for i, item in enumerate(d["data"]):
        nome = saida if n == 1 else saida.replace(".png", f"-{i+1}.png")
        open(nome, "wb").write(base64.b64decode(item["b64_json"]))
        out.append(nome)
    u = d.get("usage", {})
    print(json.dumps({"arquivos": out, "uso": u}))
    return out

if __name__ == "__main__":
    import argparse
    a = argparse.ArgumentParser()
    a.add_argument("--img", action="append", required=True)
    a.add_argument("--mask")
    a.add_argument("--prompt", required=True)
    a.add_argument("--out", required=True)
    a.add_argument("--n", type=int, default=1)
    x = a.parse_args()
    editar(x.img, x.prompt, x.out, x.mask, x.n)
