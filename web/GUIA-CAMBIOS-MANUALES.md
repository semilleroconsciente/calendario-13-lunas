# Guía de Cambios Manuales — Calendario 13 Lunas / Web

> Carpeta: `calendario-13-lunas/web` · Todo se edita con un editor de texto (VS Code, Notepad++, Bloc de notas). No necesitas compilar.
>
> **Datos por territorio (nuevo):** la información de Penco (especies, historia,
> mareas/intermareal, eventos, siembra) vive en `data/territorios/penco/*.json`
> y la app la lee con `territorio.js`. Para cambiar datos edita esos JSON
> (no `data.js`, que es solo fallback). Para otro territorio ver
> `data/territorios/_plantilla/LEEME.md` y abrir con `?territorio=<id>`.

## 0. Antes de tocar nada

1. **Haz una copia** de la carpeta `web` completa (ej: `web-backup-2026-09-01`).
2. Edita **un archivo a la vez** y prueba (ver §8).
3. Si rompes algo, restaura el archivo desde el backup.
4. Usa codificación **UTF-8** al guardar (para que se vean tildes/emojis).

---

## 1. Mapa de archivos

| Archivo | Qué contiene | Cuándo tocarlo |
|---|---|---|
| `index.html` | Estructura, textos visibles, diálogos, botones | Cambiar títulos, labels, agregar/quitar secciones |
| `styles.css` | Colores, fuentes, tamaños, responsive | Cambiar tema/colores |
| `data.js` | Datos del calendario: lunas, estaciones, siembra, aves, eventos | Cambiar nombres/descripciones de lunas, siembra, efemérides |
| `cal.js` | Lógica de calendario (We Tripantu 21 jun, zona horaria, cálculo sol/luna) | Cambiar fecha inicio de ciclo o zona horaria |
| `frases.js` | 365 frases (una por día) | Cambiar frases diarias |
| `donate.json` | Datos privados de donación (RUT, cuentas) | Cambiar links MercadoPago/PayPal |
| `renderer.js` | Lógica de la interfaz (temas, guardado, diálogos) | Cambiar comportamiento de temas/botones |
| `manifest.json` | Nombre e íconos PWA (instalar en celular) | Cambiar nombre al instalar |
| `server.js` | Servidor local Node (puerto 8137) | Cambiar puerto |
| `Servir Web.bat` | Doble clic para levantar servidor local | Raramente se toca |
| `sw.js` / `web-api.js` / `astro.js` | Service worker, bridge Electron, astronomía | No tocar salvo que sepas JS |
| `penco-guia.js` + `talleres-penco.js` | 🎉 Penco: eventos, guía comunal, sectores, historia + pestaña 🎨 Talleres (fichas propias, 📌 al calendario, ⭐ inscritos) | Agregar talleres verificados / eventos anuales |
| `flora.js` | 🌿 Flora: nativas cuenca estero Penco + ornamentales nativas + advertencia invasoras | Agregar fichas de jardín nativo |
| `huerta-modulo.js` | 🥬 Mi Huerta: bancales, cultivos, tareas, cosechas, guía rotación/asociaciones | Crear bancales y cultivos |
| `hidroponia-modulo.js` | 💧 Hidroponía: 6 sistemas, 14 cultivos pH/EC, calculadora solución, bitácora | Ajustar cultivos y nutrientes |
| `electrocultura-modulo.js` | ⚡ Electrocultura: 8 antenas, 4 proyectos ferretería, bitácora tratado vs control | Agregar antenas/proyectos |
| `plantas-modulo.js` | 🪴 Mis Plantas: inventario, riegos, cuidados, guía sustrato/luz/luna | Registrar plantas de casa |
| `mecanica-modulo.js` | 🔧 Mecánica: bici/moto/auto/motores + bitácora por vehículo | Agregar guías de taller |
| `adolescencia-modulo.js` | 🌱 Adolescencia 10-19: cuerpo, mente, estudio+Holland, seguridad, mi espacio | Ajustar recursos Chile |
| `etapas-vida-modulo.js` | 🌅 Juventud · 🏠 Adultez · 🔥 Climaterio · 🦉 Vejez (5 pestañas c/u) | Ajustar chequeos y metas |
| `neurodiversidad-modulo.js` | 🧠 Neurodiversidad: guía, 8 perfiles, 8 apoyos, AQ-10/ASRS-6, plan acceso | No diagnostica; solo textos |
| `red-comunitaria-modulo.js` | 📡 Red Comunitaria: guía, Meshtastic, diagnóstico, radioaficionado, mis nodos | Verificar norma SUBTEL vigente |
| `psicologia-modulo.js` | 🪞 Psicología (comparte datos con neurodiversidad) | Solo textos guía |

---

## 2. Cambiar textos visibles (títulos, subtítulos)

**Archivo:** `index.html:11-17`

```html
<title>Calendario de las 13 Lunas</title>          <!-- pestaña navegador -->
<h1>Mari Küla Küyen</h1>                            <!-- sidebar -->
<p class="brand-sub">Calendario de las 13 Lunas<br>Penco · Bío-Bío · Chile</p>
```

Cambia el texto entre etiquetas y guarda. Ejemplo:

```html
<h1>Mi Calendario Lunar</h1>
```

Botones del footer `index.html:80-181` (~60 botones estáticos en 7 grupos: 📅 Mi Día · 🌊 Territorio Penco · 💚 Cuerpo & Salud · 🧠 Aprender/Crear/Jugar · 🪞 Interior-Linaje-Memoria · 🏡 Hogar y Vida Práctica · 🤝 Comunidad/Emergencia/Sistema — más ~15 botones inyectados por JS: 🥬 Huerta, 💧 Hidroponía, ⚡ Electrocultura, 🪴 Plantas, 🔧 Mecánica, 🌱 Adolescencia, 🌅 Juventud, 🏠 Adultez, 🔥 Climaterio, 🦉 Vejez, 🧠 Neurodiversidad, 📡 Red ×5, ♟️ Ajedrez, 🔢 Sudoku) — cada uno es:

```html
<button id="btnTides" class="btn" data-keywords="mareas shoa talcahuano pleamar bajamar">🌊 Mareas</button>
```

`data-keywords` alimenta el **🔍 Buscar función (Ctrl+K)** — incluye sinónimos al agregar un botón.

Para agregar una herramienta completa (patrón usado en sep 2026):
1. Botón en el grupo (`index.html`) + checkbox en `configDialog` (`index.html:~1960-2030`).
2. `<dialog id="...">` con pestañas `.timer-tabs` + `<div id="...Panel">` (`index.html`).
3. `render...Panel()` + `setup...Dialog()` + `setTimeout(setup..., 88x)` (`renderer.js`).
4. Agregar el `id` a `ALL_BTNS` (`renderer.js:~3669`) y a los `PRESETS` que corresponda.
5. Copiar `index.html` y `renderer.js` a `web/` (son espejos) y pasar `node --check renderer.js`.

---

## 3. Cambiar colores y temas

### 3.1 Colores base
**Archivo:** `styles.css:3-14`

```css
:root {
  --bg: #0b1026;
  --panel: #161e3f;
  --card: #1b2447;
  --gold: #e8c56a;   /* dorado principal */
  --accent: #f0d488;
  --text: #e8eaf6;
  --muted: #9aa3c7;
}
```

Cambia el hex (ej: `--gold: #ff6b6b;`) y todo el sitio que use esa variable cambia.

### 3.2 Temas por estación
**Archivo:** `styles.css:273-277`

```css
body[data-tema="PUKEM"] { --gold: #9fc2ee; ... }
body[data-tema="PEWU"]  { --gold: #a9d18e; ... }
body[data-tema="WALUNG"]{ --gold: #f0d488; ... }
body[data-tema="RIMU"]  { --gold: #e8a06a; ... }
```

Cada estación (`PUKEM`, `PEWU`, `WALUNG`, `RIMU`) define su paleta.

### 3.3 Temas manuales (selector 🎨)
**Archivo:** `styles.css:279-286`

```css
body[data-theme="noche"] { ... }
body[data-theme="claro"] { ... }
body[data-theme="bosque"] { ... }
body[data-theme="oceano"] { ... }
```

Para agregar un tema nuevo:
1. Copia un bloque `body[data-theme="..."]` y cambia nombre y colores.
2. Agrégalo al `<select id="themeSel">` en `index.html:30-38`:

```html
<option value="miTema">Mi Tema — rojo</option>
```

3. Registra el color del navegador en `renderer.js:36`:

```js
const colors = { noche:'#0b1026', claro:'#f4f1e8', miTema:'#330000', ... };
```

### 3.4 Ajustes rápidos de tamaño
Sidebar: `styles.css:25-26` (`width: 270px`)
Tarjeta de día: `styles.css:90-95` (`min-height: 108px`)
En móvil: `styles.css:432-478` (media query `max-width: 920px`)

---

## 4. Cambiar lunas, estaciones y descripciones

**Archivo:** `data.js:1-76`

### Coordenadas Penco (sol/mareas/clima)
```js
const PENCO = { lat: -36.73194, lng: -72.9925 }; // data.js:1
```
Cambia lat/lng si quieres otro lugar (usar Google Maps → clic derecho → copiar coordenadas). Afecta `cal.js:52-53` (cálculo `sunTimes`).

### Estaciones
```js
const ESTACIONES = {
  PUKEM: { nombre: 'Pukem · Invierno', desc: '...', color: '#4a6fa5' },
  // ...
}; // data.js:3-8
```
`color` es el chip que se ve en `renderer.js:177-182`.

### Lunas (13 + DFT)
```js
const MOONS = [
  { n: 1, nombre: 'We Tripantü Küyen', traduccion: 'Luna del año nuevo',
    estacion: 'PUKEM',
    descripcion: 'Mar de invierno y marejadas...' },
  // ... 13 entradas
]; // data.js:10-76
```
- `n`: 1..13 (no cambiar orden)
- `nombre` / `traduccion` / `descripcion`: texto libre
- `estacion`: debe ser una clave de `ESTACIONES`

DFT (Día Fuera del Tiempo): `data.js:78-88`
```js
const DFT = { titulo: 'El Día Fuera del Tiempo', texto1: '...', sub2: '...' };
```

> Después de editar `data.js`, recarga con `Ctrl+F5` (caché).

---

## 5. Cambiar frases diarias (365)

**Archivo:** `frases.js:1-368`

```js
window.frases = [
  { t: "Cuando una puerta...", a: "Helen Keller" },
  // 365 entradas → índice 0 = Luna 1 Día 1, índice 364 = DFT
];
```

- Mantén el formato `{ t: "texto", a: "autor" }`.
- Deben quedar **365** entradas (364 días de lunas + 1 DFT). Si pones 364 o 366, la última fallará.
- Función helper `fraseDelDia(i)` en `frases.js:368` hace `i % length`, así que si agregas/quitas, ajusta.

---

## 6. Cambiar siembra, efemérides, aves, eventos

Todo en `data.js`:

| Qué | Variable | Línea | Formato |
|---|---|---|---|
| Siembra por fase | `SIEMBRA` | `data.js:109-138` | `nueva/creciente/llena/menguante: { fase, titulo, texto, siembra, tareas }` |
| Siembra por luna | `SIEMBRA_LUNAS` | `data.js:140-154` | `1: { titulo, epoca, directa, almacigos, cosecha, tareas }` |
| Efemérides calendario | `EFEMERIDES` | `data.js:101-107` | `'03-20': 'Equinoccio...'` (clave MM-DD) |
| Aves Penco | `AVES_PENCO` | `data.js:181-198` | `{ nombre, cient, hab, icon, epoca }` |
| Eventos astronómicos | `EVENTOS_ASTRONOMICOS` | `data.js:200-223` | `{ date:"2026-03-03", tipo, icon, nombre, desc }` |
| Eventos comuna | `EVENTOS_COMUNA_PENCO` | `data.js:225-240` | `{ md:"06-21", nombre, icon, desc, cat }` |
| Ánimos | `MOODS` | `data.js:90-99` | `{ e:'😊', c:'#7fbf5f', n:'Feliz' }` |

Para agregar efeméride nueva, solo agrega línea:

```js
'07-15': 'Fiesta local de ...',
```

> Nota: los datos de las herramientas agregadas en sep 2026 **no viven en `data.js`** sino en `renderer.js` (listas `const` junto a su `render...`) o en su `*-modulo.js` / `talleres-penco.js` propio (ver cabecera de cada archivo: botón, diálogo, pestañas y clave `userData()`). Ver §14 y §15.

---

## 7. Cambiar donaciones y links

**Archivo:** `donate.json:1-18` (datos reales) + `data.js:162-179` (placeholders)

`donate.json` es el que se publica si haces deploy. `data.js:DONATE` tiene campos vacíos por privacidad.

Para cambiar MercadoPago/PayPal:
1. Edita `donate.json:9-10`:

```json
"mercadopago": "https://link.mercadopago.cl/tu-link",
"paypal": "https://www.paypal.com/donate?business=tu@correo.com"
```

2. También revisa `index.html:594-618` (diálogo donar) si quieres cambiar textos:

```html
<a id="donateMPLink" href="https://link.mercadopago.cl/semilleroconsciente">Pagar con Mercado Pago</a>
```

---

## 8. Cambiar PWA (nombre al instalar en celular)

**Archivo:** `manifest.json:1-16`

```json
{
  "name": "Calendario de las 13 Lunas",
  "short_name": "13 Lunas",
  "theme_color": "#0b1026",
  "background_color": "#0b1026"
}
```

Cambia `name`/`short_name` y el color. Iconos: reemplaza `icon-192.png` / `icon-512.png` manteniendo mismos nombres y tamaños.

---

## 9. Cambiar lógica de calendario (avanzado)

**Archivo:** `cal.js:19`

```js
function weTripantuUTC(year) { return utcNoon(year, 5, 21); } // 21 jun
```

Cambia `5, 21` (mes 0-indexado: 5=junio) si tu año nuevo es otra fecha. Afecta `buildCycle()` en `cal.js:21-32` (13×28 + 1 DFT = 365 días).

Zona horaria: `cal.js:1`

```js
const TZ = 'America/Santiago';
```

Cámbialo a `'America/Bogota'` etc. Afecta `fmtTime`, `fmtDate`, `santiagoParts`.

---

## 10. Cómo probar los cambios

### Opción A — Local (recomendado)
1. Doble clic en `Servir Web.bat` → abre `http://localhost:8137`
2. Edita archivo → guarda → recarga navegador con `Ctrl+F5`
3. Abre `F12` → Consola para ver errores JS

### Opción B — Sin Node
Arrastra `index.html` directo al navegador (algunas funciones como clima/mareas requieren servidor).

### Ver errores comunes
- Pantalla blanca → `F12` → error de sintaxis (coma faltante en `data.js` o `frases.js`)
- Colores no cambian → caché → `Ctrl+F5`
- Frase no aparece → revisa que `window.frases` tenga 365 entradas

---

## 11. Cómo publicar después de cambios

Ver `LEEME.txt:16-25`:
- **Netlify Drop:** arrastra carpeta `web` a https://app.netlify.com/drop
- **GitHub Pages:** sube contenido de `web` a repo → Settings → Pages
- **APK Android:** publica web primero → https://www.pwabuilder.com → pega URL → descarga APK

---

## 12. Checklist rápido

- [ ] Backup hecho
- [ ] Editado con UTF-8
- [ ] Probado en `http://localhost:8137` con `Ctrl+F5`
- [ ] Sin errores en `F12`
- [ ] Probado en móvil (responsive `styles.css:432`)
- [ ] Si cambiaste `donate.json`, no subas RUT/cuenta a repo público sin querer

---

## 13. Ejemplos express

**Cambiar dorado a rojo en todo el sitio:**
`styles.css:12` → `--gold: #e74c3c;`

**Renombrar Luna 1:**
`data.js:12` → `nombre: 'Mi Luna Nueva'`

**Agregar efeméride:**
`data.js:102` → `'07-15': 'Aniversario local'`

**Cambiar frase día 1:**
`frases.js:2` → `{ t: "Mi frase nueva", a: "Yo" }`

**Cambiar puerto servidor:**
`server.js:25` → `.listen(8080, ...)` y `Servir Web.bat:3` → `http://localhost:8080`

---

## 14. Herramientas agregadas sep 2026 · primera oleada (dónde está cada una)

Todo 100% offline salvo 🌬️ Aire (vivo opcional). Datos personales en `DATA` por usuario (ver `userData()` en `renderer.js:62`).

| Herramienta | Botón (`index.html`) | Diálogo | Lógica (`renderer.js`) | Datos |
|---|---|---|---|---|
| 🌊🚨 Evacuación Tsunami | `btnEvac` (Emergencias) | `evacDialog` | `renderEvacPanel` / `setupEvacDialog` — tabs rutas/mochila/plan/sismo | Checklist en `DATA.evacCheck` |
| 🗣️ Kimün Mapuzugun | `btnMapu` (Mente) | `mapuDialog` | `renderMapuPanel` / `setupMapuDialog` — palabra/números/lunas/quiz, 🔊 `speechSynthesis` | `MAPU_WORDS`, `MAPU_NUMS`; puntaje en `DATA.mapu` |
| 🌿 Lawen Herbario | `btnLawen` (Cuerpo) | `lawenDialog` | `renderLawenList` + `lawenCardHTML` — buscador, filtro luna, fichas propias | `LAWEN_PLANTS` (20 base) + `DATA.lawenUser` (fichas propias) |
| 🪱 Compost & Suelo | `btnCompost` (Territorio) | `compostDialog` | `renderCompostPanel` — pila/suelo/menguantes desde `phaseMap` | `DATA.compost.turns` |
| ♻️ Reciclaje & Ferias | `btnRecicla` (Territorio) | `reciclaDialog` | `renderReciclaList` — buscador + filtro destino | `RECICLA_ITEMS` (14) |
| 🌬️ Aire Penco | `btnAire` (Territorio) | `aireDialog` | `fetchAire` (Open-Meteo air-quality, con fallback offline) + `renderAireTips` | En vivo, sin guardar |
| 📓 Gratitud Diaria | `btnGratitud` (Mente) | `gratitudDialog` | `renderGratitudBox` / `renderGratHistory` — racha + ✨ en calendario (`renderLuna`) | `DATA.gratitud.entries` |
| 🪵 Leña & Pellet | `btnLena` (Herramientas) | `lenaDialog` | `renderLenaCalc` — $/kWh por combustible y unidad | Constantes `KWH`/`KG` en función |
| 🌰 Mis Semillas | pestaña `tabSemillas` en `siembraDialog` | `siembraSemillasBox` | `renderSiembraSemillas` — inventario con −/+/✕, cableada en `renderSiembraContent` + tabs | `DATA.semillasInv` |
| 🚨 Emergencias (grupo) | — | `helpDialog` | Tarjeta “🚨 Emergencias & Comunidad” agregada a la ❓ Guía in-app | — |

Notas:
- El botón standalone 🌱 Banco Semillas se eliminó; su reemplazo es 🌰 Mis Semillas dentro de 🌱 Siembra. Quedó `DATA.semillas` huérfano (sin uso) por si hay que migrar avisos viejos.
- La ❓ Guía in-app (`helpDialog` en `index.html:~2004-2135`) documenta todas las herramientas por grupo + “Tips & Novedades”.
- `ALL_BTNS` + `PRESETS` (`renderer.js:~3669-3682`): agricultor trae compost/lawen/recicla/aire; salud trae lawen/gratitud/aire/evac; mayor trae gratitud/aire/leña; docente trae mapu/gratitud/recicla.

---

## 15. Herramientas agregadas 20–21 sep 2026 · segunda oleada (módulos propios)

Cada módulo es un archivo `*-modulo.js` auto-instalable: inyecta su botón, crea su `<dialog>` y guarda en `userData().<clave>`. Patrón de edición: abre la cabecera del archivo (primeras 20 líneas) — ahí están botón, diálogo, pestañas y clave de datos. Todo 100% offline.

| Herramienta | Archivo | Botón (inyectado) | Diálogo / pestañas | Datos (`userData()`) |
|---|---|---|---|---|
| 🥬 Mi Huerta | `huerta-modulo.js` | `btnHuerta` (Territorio > Tierra, junto a Siembra) | `huertaDialog` — Resumen / Bancales / Cultivos / Tareas / Cosechas / Guía (rotación 4 años, asociaciones, luna, suelo Penco) | `huerta { bancales, cultivos, tareas, cosechas }` |
| 💧 Hidroponía | `hidroponia-modulo.js` | `btnHidroponia` (Territorio > Tierra) | `hidroDialog` — Guía / Sistemas (6: Kratky, balsa, mecha, NFT, goteo, torre) / Cultivos (14 con pH/EC/luna) / Solución (calculadora) / Luna & Clima / Mi cultivo (pH/EC/temp) | `hidroponia { logs, hechos }` |
| ⚡ Electrocultura | `electrocultura-modulo.js` | `btnElectrocultura` (Territorio > Tierra, junto a Mi Huerta) | `electroDialog` — Guía / Antenas (8) / Proyectos (4 ferretería Penco) / Luna & Medir / Mi experimento (tratado vs control) | `electrocultura { logs, hechos }` |
| 🪴 Mis Plantas | `plantas-modulo.js` | `btnPlantas` (Hogar > Casa, junto a Tareas Hogar) | `plantasDialog` — Resumen / Mis Plantas (CRUD + riego auto) / Cuidados (💧 Regar hoy) / Guía (sustrato Penco, luz, luna, toxicidad) | `plantas { items, cuidados }` |
| 🔧 Mecánica | `mecanica-modulo.js` | `btnMecanica` (Hogar > Energía y Taller) | `mecanicaDialog` — Guías básicas / Bici / Moto / Auto / Motores (2T/4T/diésel/eléctrico/bote) / Mi taller (bitácora por vehículo) | `mecanica { logs, checks }` |
| 🎨 Talleres Penco | `talleres-penco.js` | pestaña en `comunaDialog` (Territorio > Penco) | `tabComunaTalleres` — fichas propias verificadas, 📌 crea 🕐 compromiso en el día, ⭐ Mis inscritos | `talleresPenco { mios, inscripciones }` |
| 🌿 Flora ampliada | `flora.js` | `btnFlora` (Territorio) | `floraDialog` — Flora hoy / Bitácora / Links. Nativas cuenca estero Penco + ornamentales nativas; invasoras solo advertencia | `DATA` flora + bitácora |
| 🌱 Adolescencia 10-19 | `adolescencia-modulo.js` | `btnAdolescencia` (Mente & Estudio) | `adolescenciaDialog` — Guía / Cuerpo / Mente / Estudio+Holland / Social & Seguridad / Mi espacio (chequeo+metas+diario) | `adolescencia { checks, tests, metas }` |
| 🌅 Juventud · 🏠 Adultez · 🔥 Climaterio · 🦉 Vejez | `etapas-vida-modulo.js` | `btnJuventud btnAdultez btnClimaterio btnVejez` | `juventudDialog adultezDialog climaterioDialog vejezDialog` — 5 pestañas c/u: Guía / Cuerpo & Salud / Mente & Vínculos / Vida práctica / Mi espacio | `etapasVida { juv, adu, cli, vej }` |
| 🧠 Neurodiversidad | `neurodiversidad-modulo.js` | `btnNeurodiversidad` (junto a Psicología) | `neurodiversidadDialog` — Guía / Perfiles (8) / Apoyos (8) / Tests AQ-10+ASRS-6 / Mi plan (tarjeta acceso). Educativo, no diagnostica | comparte `psicologia { tests, neuro }` (migra auto) |
| 📡 Red Comunitaria | `red-comunitaria-modulo.js` | `btnRedGuia btnRedMeshtastic btnRedDiagnostico btnRedRadio btnRedNodos` | `redComunitariaDialog` — Guía / Meshtastic (frecuencia Chile) / Diagnóstico (SNR/RSSI) / Radioaficionado (SUBTEL+plan 4 sem) / Mis Nodos | `redcomunitaria { nodos, diags, hechos }` |

Notas segunda oleada:
- ❓ Guía in-app actualizada 2026-09-21: tarjetas Territorio (huerta/hidroponía/electrocultura/flora/talleres), Cuerpo (plantas), Mente (adolescencia/neurodiversidad), Hogar (mecánica/plantas) y “Tips & Novedades”.
- `sw.js` sube de caché en cada oleada (`cal13-v27-offline` incluye `talleres-penco.js`; si agregas un `*-modulo.js` nuevo, súbelo a `CACHE` + lista `ASSETS` y sube versión).
- `package.json → build.files` debe incluir cada `*-modulo.js` nuevo o el `.exe` portable sale sin esa herramienta. Ya incluidos hasta `talleres-penco.js` en v1.2.0; al agregar otro, añádelo ahí + `<script src>` en `index.html` y espejo en `web/`.
- `index.html` + `renderer.js` de raíz y `web/` son espejos: edita en raíz, prueba con `npm start`, y copia ambos a `web/` antes de publicar o compilar el `.exe`.

---

*Última actualización: 2026-09-21 — Mantener esta guía junto a `LEEME.txt`.*
