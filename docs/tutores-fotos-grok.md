# Fotos dos tutores (para o Grok)

Cada tutor precisa de **12 fotos**, todas com a **mesma pessoa, mesma roupa, mesma luz e mesmo enquadramento**.
Só a boca, os olhos ou a expressão mudam. É isso que permite animar a boca sem a cabeça "pular".

## Padrão visual (igual aos 8 tutores atuais)

- Retrato fotográfico realista, frontal, olhando para a câmera, ombros aparecendo.
- Fundo liso bege claro (#EFE3D3), sem objetos.
- Camiseta lisa de gola redonda, numa cor sólida (cada tutor com uma cor).
- Luz suave e uniforme de estúdio, sem sombras fortes.
- Quadrado, 1024 × 1024 px, JPG.
- Cabeça no mesmo lugar em todas as fotos (centro horizontal; olhos a ~35% da altura).
- Expressão base: neutra e simpática, boca fechada e relaxada.

## As 12 fotos de cada tutor (nomes dos arquivos)

| Arquivo | O que muda |
|---|---|
| `base.jpg` | retrato neutro, boca fechada relaxada |
| `boca_A_fechada.jpg` | lábios fechados e encostados (M, B, P) |
| `boca_B_aberta_larga.jpg` | boca bem aberta (A) |
| `boca_C_sorriso_dentes.jpg` | lábios esticados mostrando os dentes (E, I) |
| `boca_D_arredondada.jpg` | boca arredondada, abertura média (O) |
| `boca_E_bico.jpg` | lábios em bico (U, W) |
| `boca_F_labio_dente.jpg` | dentes de cima encostando no lábio de baixo (F, V), **centralizado, sem puxar para um lado** |
| `boca_G_lingua.jpg` | ponta da língua atrás dos dentes (L, TH) |
| `olhos_fechados.jpg` | igual à base, só com os olhos fechados (piscar) |
| `expressao_feliz.jpg` | sorriso leve |
| `expressao_surpresa.jpg` | sobrancelhas levantadas, boca entreaberta |
| `expressao_pensativa.jpg` | olhar levemente para cima (opcional) |

**Importante:** a boca deve ficar sempre centralizada. Uma foto com a boca puxada para um lado é trocada automaticamente pelo script, e aquela posição fica menos expressiva.

## Os 8 tutores novos

Uma pasta por tutor, com o nome em minúsculas (ex.: `camille/`), dentro da mesma pasta do Drive dos tutores atuais.

| Pasta | Tutor | Idioma | Descrição para o Grok | Cor da camiseta |
|---|---|---|---|---|
| `camille` | Camille | Francês | mulher francesa de ~30 anos, cabelo castanho liso na altura dos ombros, ar elegante | azul-marinho |
| `julien` | Julien | Francês (Quebec) | homem canadense de ~35 anos, barba curta, cabelo castanho claro, ar descontraído | vermelho |
| `giulia` | Giulia | Italiano | mulher italiana de ~28 anos, cabelo escuro cacheado, sorridente e expressiva | verde-escuro |
| `marco` | Marco | Italiano | homem italiano de ~40 anos, cabelo escuro curto e bem penteado, ar calmo | cinza-grafite |
| `lena` | Lena | Alemão | mulher alemã de ~32 anos, cabelo loiro preso em coque, ar direto e simpático | laranja |
| `lukas` | Lukas | Alemão | homem alemão de ~35 anos, cabelo castanho-claro curto, óculos de armação fina | azul-petróleo |
| `yuki` | Yuki | Japonês | mulher japonesa de ~26 anos, cabelo preto liso e longo, ar gentil e alegre | rosa |
| `kenji` | Kenji | Japonês | homem japonês de ~38 anos, cabelo preto curto, ar calmo e educado | azul-escuro |

## Depois de gerar

Coloque as pastas no Drive e avise. O script `scripts/tutores-fotos.py` alinha os quadros, recorta boca, olhos e expressões, troca bocas tortas e liga as fotos no app e no site.
