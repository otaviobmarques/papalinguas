# Tutores no Rive: instruções para o animador

O Papalinguas é um app de conversação com tutores de inteligência artificial. O aluno fala com o tutor
por voz, numa tela parecida com uma chamada de vídeo. Cada tutor é um personagem que precisa **falar com
a boca sincronizada com a voz**, piscar, respirar e mudar de expressão.

Este documento descreve o arquivo `.riv` que cada personagem precisa ter para o app conseguir controlá-lo.
O app já está pronto para receber o arquivo: basta seguir os nomes abaixo.

## Referência visual

- Estilo: cartoon 3D de filme de animação (olhos grandes e expressivos, pele lisa com sombreado suave),
  como a imagem de referência de cada personagem enviada junto com este documento.
- Enquadramento: busto (cabeça e ombros), de frente, olhando para a câmera, centralizado.
- O personagem é **original**: não copie personagens de outros apps, filmes ou marcas.

## Arquivo

| Item | Valor |
|---|---|
| Nome do arquivo | `tutor.riv` (um arquivo por personagem) |
| Artboard | `Tutor`, quadrado, 1024 × 1024 |
| State machine | `Tutor` |
| Fundo | o cenário do personagem pode ficar no próprio artboard, numa camada separada |
| Tamanho | idealmente até 1 MB (roda em celulares simples) |

## Entradas da state machine (inputs)

O app envia estes valores ~60 vezes por segundo. Os nomes precisam ser **exatamente** estes.

| Input | Tipo | Valores | O que o app quer dizer |
|---|---|---|---|
| `visema` | Number | 0 a 6 | a boca que corresponde ao som falado agora (tabela abaixo) |
| `estado` | Number | 0 repouso, 1 ouvindo, 2 pensando, 3 falando | o momento da conversa |
| `expressao` | Number | 0 neutra, 1 sorriso, 2 dúvida, 3 comemoração | a expressão do rosto |
| `acenar` | Trigger | (disparo) | dar um tchau com a mão, na apresentação |

### Bocas (`visema`)

| Valor | Som | Boca |
|---|---|---|
| 0 | silêncio | boca fechada e relaxada (repouso) |
| 1 | A | aberta, abertura média, dentes de cima aparecendo um pouco |
| 2 | E / I | entreaberta e um pouco esticada, dentes à mostra |
| 3 | O | arredondada, abertura média |
| 4 | U / W | biquinho, quase fechada |
| 5 | M / B / P | lábios fechados e encostados |
| 6 | F / V / S | dentes de cima tocando o lábio de baixo |

**Importante para a sincronia:**
- As trocas de boca precisam ser **rápidas e suaves**: transição (blend) de 60 a 80 ms entre uma boca e outra.
  Mais lento que isso, a boca fica atrasada em relação à voz.
- A boca precisa ficar **centralizada e simétrica** em todas as posições.
- Só a boca e o queixo se mexem na fala. O contorno do rosto, as bochechas e o cabelo não mudam de forma nem de cor.
- Com `estado` diferente de 3 (falando), o app sempre envia `visema = 0`.

## Animações que ficam dentro do arquivo

O app não controla estas; o próprio arquivo deve fazer sozinho:

- **Piscar**: aleatório, a cada 2,5 a 6 segundos (às vezes duas vezes seguidas), com duração de ~130 ms.
- **Respiração**: movimento leve e contínuo de ombros e cabeça em repouso.
- **Fala**: além da boca, um leve balanço de cabeça e sobrancelhas enquanto `estado = 3`.
- **Ouvindo** (`estado = 1`): cabeça levemente inclinada, olhar atento; acenos sutis de cabeça são bem-vindos.
- **Pensando** (`estado = 2`): olhar para cima ou para o lado por um instante.

## Expressões (`expressao`)

As expressões são mostradas fora da fala (quando o aluno acerta algo, tem dúvida etc.) e devem ter transição
de ~300 ms. Durante a fala, a expressão pode influenciar as sobrancelhas e os olhos, mas a boca é sempre a do `visema`.

## Como testar

No editor do Rive, mexa nos inputs manualmente: troque `visema` rapidamente entre 0, 1, 2 e 5, simulando
uma fala (cerca de 5 trocas por segundo). A boca deve acompanhar sem atraso e sem "pular" de posição.

## Entrega

Envie o `tutor.riv` e, se possível, o arquivo-fonte do Rive (`.rev`) para ajustes futuros.

---

## English summary (for international animators)

Original 3D-cartoon-style character, bust framing, square artboard `Tutor` (1024×1024), state machine `Tutor`.
Inputs (exact names): `visema` Number 0–6 (0 rest, 1 A, 2 E/I, 3 O, 4 U/W, 5 M/B/P, 6 F/V/S),
`estado` Number (0 idle, 1 listening, 2 thinking, 3 talking), `expressao` Number (0 neutral, 1 smile,
2 doubt, 3 celebration), `acenar` Trigger (wave). Mouth blends of 60–80 ms, centered and symmetric; only
mouth and jaw move while talking. Random blinking, breathing and talking head motion live inside the file.
Target file size up to 1 MB. Deliver `tutor.riv` and the `.rev` source.

---

## Para o desenvolvedor: como ligar um personagem no app

1. Coloque o arquivo em `public/tutores/<slug>/tutor.riv`.
2. Adicione o slug em `src/lib/tutores/rive.ts` (`TUTORES_RIVE`).
3. Pronto: `TutorCharacter` passa a usar o Rive (`src/components/rive/TutorRive.tsx`) em todas as telas,
   no lugar da foto animada. O motor do Rive é servido pelo próprio app (`public/rive/rive.wasm`, copiado no
   `postinstall`).
