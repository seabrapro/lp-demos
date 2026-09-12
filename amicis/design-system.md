# Design system — Amicis Fitness

Status: **travado** em 12/09/2026 após hero aprovado em 375px e 1440px. Seções só reutilizam estes tokens.
Trilha: Cinemática, variante clara.

## Cor (extraída do intake — não inventar tons novos)
| Token | Hex | Origem / uso |
|---|---|---|
| `--bg` | #F4F2EE | creme do logo (#E2E4DF) clareado 1 passo — fundo de página |
| `--bg-2` | #EAE7E1 | faixa alternada de seção |
| `--ink` | #1C1C1A | texto principal (preto quente, não #000) |
| `--ink-2` | #5C5A56 | texto secundário |
| `--sage` | #99BCC2 | verde-sálvia do logo — acento, botão, detalhes |
| `--sage-ink` | #5E8B93 | sálvia escurecida para texto/links sobre fundo claro (contraste AA) |
| `--warm` | #B0A8A8 | cor média da foto do hero — gradientes de transição |
| `--brown` | #89675E | cor média das fotos de estúdio marrom — uso raro (legenda, linha) |
| `--cream` | #E2E4DF | creme do logo — texto sobre sálvia |
| `--hero-bg` | #D5CEC4 | borda esquerda do vídeo do hero (Soul + Kling) — fundo do hero, o vídeo funde nele |
| `--hero-floor` | #A9A08F | piso do vídeo do hero — reservado |
| `--cta-bg` | #C6BC9F | média do vídeo de tecido do CTA — fundo do CTA, texto escuro |

Fundo das seções com foto larga = cor média da foto (ffmpeg scale=1:1), nunca preto.

## Tipografia (Google Fonts, 2 famílias)
- Display: **Bodoni Moda** (Didone, casa com o logo e com "HARMONY"). Pesos 400/500, itálico permitido em 1 palavra por headline.
- Texto/UI: **DM Sans** 400/500/600.
- Escala (mobile → desktop): h1 `clamp(2.6rem, 7vw, 5.6rem)` · h2 `clamp(2rem, 4.5vw, 3.4rem)` · lead 1.125rem · body 1rem · small 0.8125rem · eyebrow 0.75rem uppercase tracking 0.18em.
- Line-height: display 1.02 · texto 1.55.

## Espaço e forma
- Base 8px. Padding lateral `clamp(20px, 5vw, 72px)`. Seção: `clamp(72px, 12vw, 160px)` vertical.
- Container máx. 1280px.
- Raio: botões 999px (pílula) · fotos 4px · nada mais arredondado.
- Sombra: nenhuma. Profundidade vem de sobreposição de foto e cor, não de sombra.
- Linhas divisórias: 1px `--ink` a 12% de opacidade. Sem stroke em card.

## Botão
- Primário: fundo `--ink`, texto `--bg`, DM Sans 500 0.9375rem, padding 16×28, pílula. Hover: fundo `--sage-ink`.
- Secundário (texto): `--sage-ink` com seta →, sem borda.
- Um só CTA por seção. Sempre WhatsApp.

## Movimento
- Hero: `assets/hero.mp4` (Kling 2.5, 10 s, loop, 1600×900, 0,57 MB) à direita com máscara horizontal (transparente → opaco em 22%) sobre fundo `--hero-bg`; poster = primeiro frame. Mobile: `object-position 40% 50%`. Transição para a seção seguinte via gradiente vertical para `--bg`. **Nunca Ken Burns em foto raster.**
- CTA final: `assets/cta.mp4` (tecido em macro, 0,64 MB) full-bleed, texto `--ink` com halo radial claro — sem véu preto.
- Revelar ao rolar: opacidade 0→1 + 16px de subida, 700ms, uma vez. Nada além disso.
- `prefers-reduced-motion`: desliga tudo.

## Header
- Wordmark "AMICIS" (Bodoni 500, tracking 0.12em) + "fitness" (DM Sans 0.6875rem uppercase) à esquerda; CTA à direita. Transparente sobre o hero, `--bg` ao rolar.
