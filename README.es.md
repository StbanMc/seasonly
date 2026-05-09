# seasonly

> Sistema de tematización estacional liviano y sin dependencias para
> cualquier sitio web. Banners y partículas que reaccionan a la fecha,
> con un sistema de calendarios extensible. Pensado primero en LATAM
> (Colombia incluida), abierto a cualquier país, religión o calendario
> propio.

[![CI](https://github.com/StbanMc/seasonly/actions/workflows/ci.yml/badge.svg)](https://github.com/StbanMc/seasonly/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Estado: 0.1.0 — primer release público.** Resolver, validador de
> schema, dos calendarios incluidos (`co`, `global`), los dos Web
> Components (`<seasonly-banner>` y `<seasonly-particles>` con 14 efectos),
> auto-init ESM para plataformas no-code, cero dependencias en runtime Y
> en dev, ~20 KB gz totales de fuente. 105 tests verdes en Node 18 / 20 /
> 22 sobre Linux, Windows y macOS. El componente compuesto
> `<seasonly-themes>`, un playground en Stackblitz y la promesa de
> estabilidad v1.0.0 vienen después.

[Read in English](README.md) · [**Demo en vivo →**](https://stbanmc.github.io/seasonly/)

---

## Por qué seasonly

Casi todas las librerías de "confetti" o "partículas" no saben de fechas:
tú decides cuándo dispararlas. Casi todos los plugins de "holiday banner"
están escritos asumiendo el calendario de un solo país (normalmente
EE.UU.), así que el *Día de las Velitas* colombiano, el *Día de Muertos*
mexicano, el 25 de Mayo argentino o cualquier festividad local con fecha
móvil simplemente no existen para ellos.

**seasonly** invierte el enfoque: montas el componente una vez y él
resuelve la *temporada activa* por fecha contra un **calendario**
enchufable. Puedes usar el `co` (Colombia) o el `global` que vienen
incluidos, escribir el tuyo o combinar varios. Las festividades móviles
como el Día de la Madre (segundo domingo de mayo) se expresan como
**reglas**, así que la fecha es correcta *todos los años* sin actualizar
nada a mano.

Reglas de diseño:

- **Cero dependencias en runtime.** Validado en CI en cada commit.
- **Nativo del navegador.** Web Components, sin atadura a framework.
- **Sin build step obligatorio.** Una etiqueta `<script>` es suficiente.
- **Accesibilidad primero.** `prefers-reduced-motion` siempre respetado.
- **Calendarios enchufables.** Embebidos, URL remota, objeto inline o
  fusionados.

---

## Instalación

```bash
npm install seasonly
```

CDN (sin instalación, sin build):

```html
<script type="module">
  import { resolveSeason } from 'https://cdn.jsdelivr.net/npm/seasonly/+esm';
</script>
```

### Auto-init de una sola línea para plataformas no-code

Pega este tag en WordPress, Shopify, Webflow, Squarespace o cualquier HTML
plano. La librería lee sus propios atributos `data-*`, descarga el
calendario, resuelve la temporada activa de hoy y monta el banner y las
partículas sin que escribas una línea de JavaScript:

```html
<script type="module"
        src="https://cdn.jsdelivr.net/npm/seasonly@0/src/auto.js"
        data-locale="co"
        data-mode="banner+particles"
        data-message="Hasta 30% off este Black Friday"
        data-cta-text="Comprar ahora"
        data-cta-href="/promos">
</script>
```

Modos: `banner`, `particles`, `banner+particles`, `none`. Locales: `co`,
`global` (más vía PR). Pasa `data-calendar-url="..."` para cargar tu
propio calendario JSON. Agrega `data-debug` para ver en consola
exactamente qué se cargó y montó. El atributo `cta-href` se sanea contra
una lista blanca de esquemas seguros — `javascript:`, `data:`,
`vbscript:` y compañía se descartan en silencio.

---

## Inicio rápido (API actual de v0.0.1-dev)

```js
import { resolveSeason, validateCalendar, loadCalendar, mergeCalendars } from 'seasonly';
import co from 'seasonly/calendars/co.json' with { type: 'json' };

const hoy = new Date();
const activa = resolveSeason(hoy, co);

if (activa) {
  console.log(activa.season.name, '· pico:', activa.peakDate);
  console.log('días al pico:', activa.distance);
} else {
  console.log('Hoy no hay tema estacional activo.');
}
```

Cuando varias temporadas se solapan (por ejemplo *Black Friday* y *Día
de las Velitas* a fin de noviembre / inicio de diciembre), el resolver
devuelve la más cercana a su pico. El orden en el calendario actúa como
desempate determinista.

---

## Forma del calendario

Un calendario es un objeto JSON. El
[JSON Schema](docs/calendar.schema.json) está publicado para tener
autocompletado en el editor (apunta tu `$schema` ahí).

```jsonc
{
  "$schema": "https://stbanmc.github.io/seasonly/calendar.schema.json",
  "id": "mi-calendario",
  "name": "Mi calendario propio",
  "version": "1.0.0",
  "seasons": [
    {
      "id": "aniversario-empresa",
      "name": "7 años",
      "date": "03-15",
      "daysBefore": 7,
      "daysAfter": 3,
      "particles": "confetti",
      "gradient": ["#ff6a00", "#ee0979"],
      "textColor": "#ffffff",
      "icon": "🎉"
    },
    {
      "id": "dia-de-la-madre-co",
      "name": "Día de la Madre",
      "rule": { "type": "weekday", "month": 5, "weekday": 0, "occurrence": 2 },
      "daysBefore": 7,
      "daysAfter": 7,
      "particles": "flowers"
    }
  ]
}
```

**Campos de cada temporada:**

- `id` (obligatorio) — único dentro del calendario.
- `name` (obligatorio) — nombre legible.
- **O** `date` (`MM-DD` fija) **o** `rule` (festividad móvil).
  - `rule.type: "weekday"` con `month` (1–12), `weekday`
    (0=domingo…6=sábado) y `occurrence` (1..5 para *N-ésima*, `-1` para
    la última). Resuelve Día de la Madre/Padre, Black Friday, último
    sábado del mes, etc., correctamente cada año.
- `daysBefore` / `daysAfter` — ventana alrededor del pico (default 0).
- `particles` — uno de: `none`, `snowflakes`, `hearts`, `confetti`,
  `stars`, `fireworks`, `balloons`, `flowers`, `flags`, `kites`,
  `lightning`, `candles`, `bats`, `leaves`, `petals`. (El renderer llega
  en 0.1.0.)
- `gradient`, `textColor`, `icon` — pistas visuales que usarán los
  componentes que vienen. **El texto del banner y los CTA siempre los
  pone tu aplicación**, nunca la librería.

---

## Calendarios incluidos

| id       | Temporadas                                                                  |
| -------- | --------------------------------------------------------------------------- |
| `co`     | 14 — calendario colombiano completo (Velitas, Independencia, Amistad, etc.) |
| `global` | 5 — universales (Año Nuevo, San Valentín, Halloween, Navidad, Fin de Año)   |

Más calendarios regionales (`mx`, `ar`, `cl`, `pe`, `es`, `us`,
calendarios religiosos) son **explícitamente bienvenidos vía PR**. Mira
`CONTRIBUTING.md` cuando salga 0.1.0.

---

## Roadmap

- [x] Resolver de fechas con ranking por cercanía al pico
- [x] Validador de schema de calendarios (sin dependencias)
- [x] Reglas de festividades móviles (`rule.type: weekday`)
- [x] Calendarios: `co`, `global`
- [x] Loader de calendarios (inline / URL / embebido)
- [x] JSON Schema público para autocompletado en VS Code
- [x] Web Component `<seasonly-banner>` (Shadow DOM, glassmorphism, dismiss persistente)
- [x] Web Component `<seasonly-particles>` con 14 efectos CSS-only, solo GPU
- [x] `prefers-reduced-motion` respetado de punta a punta (CSS + JS)
- [x] Modo auto-init `<script type="module" data-locale="co">`
- [x] Bundle-size budget en CI (~20 KB gzip de todo `src/`)
- [x] Demo interactivo en `index.html` (slider de fecha + timeline de temporadas + snippet de código vivo) listo para GitHub Pages
- [ ] Componente compuesto `<seasonly-themes>` (banner + partículas en un solo tag)
- [ ] Build dual ESM + CJS + IIFE para usuarios `<script>` legacy (diferido a v1.1)
- [ ] Playground Stackblitz embebido en la docu

---

## Ejecutar los ejemplos localmente

Las páginas HTML de `examples/` importan módulos ES, y los browsers rechazan
cargar módulos desde URLs `file://` (CORS con null-origin — es el
comportamiento correcto del browser, no un bug). Levanta el dev server
incluido:

```bash
npm run dev
# → http://localhost:5173/examples/01-banner-basic.html
```

El dev server tiene cero dependencias (`tools/serve.mjs`, ~80 líneas usando
solo el módulo `http` nativo de Node). Escucha solo en 127.0.0.1 y valida
que cada ruta servida quede dentro del repo.

Si abres un ejemplo por accidente con `file://`, la página detecta el
protocolo y muestra una guía clara con la URL correcta.

## Licencia

MIT © 2026 Esteban Esquivel
