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
| `buen-vivir-modulo.js` | 🌎 Buen Vivir: visión, 7 pueblos (küme mongen, sumak kawsay, ñande reko, kolla, shiir waras, balu wala, suma qamaña) + práctica y compromisos | Ajustar textos y prácticas |
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
| `hogar-despensa-closet-modulo.js` | 🍯 Mi Despensa + 👕 Mi Closet: inventarios de casa | Agregar/quitar ítems propios |
| `hogar-herramientas-modulo.js` | 🧰 Mis Herramientas: inventario del taller casero | Agregar herramientas propias |
| `municipalidad-penco.js` | 🏛️ Municipalidad: trámites, salud, emergencias, historia | Actualizar teléfonos/horarios verificados |
| `bomberos-penco.js` | 🚒 Bomberos: compañías, prevención, plan de escape | Verificar cuarteles y teléfonos |
| `apoyo-emergencia.js` | 🆘 Apoyo Emergencia: red de ayuda vecinal | Actualizar puntos de ayuda |
| `actores-territorio.js` | 🗺️ Actores del Territorio: organizaciones + fichas propias | Agregar organizaciones verificadas |
| `negocios-penco.js` | 🏪 Economía Local (+ pestaña 🪙 Moneda Social): fichas por tipo/rubro/sector | Agregar fichas con datos verificados en terreno |
| `moneda-social.js` | 🪙 Moneda Social: guía, billetera, ofertas, transacciones, acuerdos | No tocar lógica salvo que sepas JS (ver §16) |

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
| 🌎 Buen Vivir | `btnBuenVivir` (Territorio) | `buenVivirDialog` | `switchBvTab` / `renderBvVision` / `renderBvPueblos` / `renderBvComp` — visión, pueblos, práctica + compromisos | `DATA.buenVivir.compromisos` |
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

## 16. Herramientas agregadas 22–28 sep 2026 · tercera oleada: Penco cívico + economía (v1.4.0)

Mismo patrón §15: cada archivo auto-instalable inyecta su botón, crea su `<dialog>` y guarda en `userData().<clave>`. Cabecera de cada archivo = botón, diálogo, pestañas y clave de datos. Todo 100% offline. Los datos territoriales viven en `data/territorios/penco/*.json` (leídos con `territorio.js`).

| Herramienta | Archivo | Botón | Diálogo / pestañas | Datos (`userData()`) |
|---|---|---|---|---|
| 🍯 Mi Despensa + 👕 Mi Closet | `hogar-despensa-closet-modulo.js` | Hogar > Casa (2 botones) | `despensaDialog` (Resumen/inventario) + `closetDialog` (Resumen/ropa) | `despensa { items }` + `closet { items }` |
| 🧰 Mis Herramientas | `hogar-herramientas-modulo.js` | `btnHerramientas` (Hogar) | `herramientasDialog` — inventario de la casa | `herramientas { items }` |
| 🏛️ Municipalidad Penco | `municipalidad-penco.js` | `btnMuni` (Territorio > Penco) | `muniDialog` — sede, trámites, salud, emergencias, historia + 📌 vencimientos al calendario | `muniPenco` |
| 🚒 Bomberos Penco | `bomberos-penco.js` | `btnBomberos` (Territorio > Penco) | `bomberosDialog` — compañías, prevención, plan de escape | `bomberosPenco` |
| 🆘 Apoyo Emergencia | `apoyo-emergencia.js` | Territorio > Penco | `apoyoDialog` — red de ayuda vecinal | `apoyoPenco` |
| 🗺️ Actores del Territorio | `actores-territorio.js` | `btnActores` (Territorio > Penco) | `actoresDialog` — organizaciones + fichas propias y seguidos | `actores { mios, siguiendo }` |
| 🏪 Economía Local | `negocios-penco.js` | `btnNegocios` (Territorio > Penco) | `negociosDialog` — Inicio / Negocios / Emprendimientos / Artesanos / Oficios / Cursos / 🪙 Moneda Social / Míos / Guía (vistas 📇/📋/🗂️, filtros, ➕ fichas propias, 📌 visitas al calendario) | `negociosPenco { mios, favs, visitas }` |
| 🪙 Moneda Social | `moneda-social.js` | `btnMoneda` (Comunidad > Red Penco) + **pestaña `tabNegMoneda` dentro de Economía Local** (v1.4.0) | `monedaDialog` — Guía / Billetera (tope de confianza) / Ofertas y Pedidos / Transacciones / Acuerdos | `monedaSocial { cuenta, txs, ofertas, acuerdos, tratos }` |

Notas tercera oleada:
- ❓ Guía in-app actualizada 2026-09-28 (v1.4.0): mapa rápido (Municipalidad, Bomberos, Apoyo, Actores, Economía + Moneda), tarjeta Territorio (párrafo “Penco cívico · Economía”), tarjeta Hogar/Comunidad (Despensa & Closet, Herramientas, Moneda Social, Apoyo) y “Tips & Novedades v1.4.0”.
- 🪙 Moneda Social vive en **dos puertas, una sola fuente**: módulo propio (`monedaDialog`) + sección completa dentro de Economía Local (`negMonPanel`: billetera, ofertas, transacciones, fichas con 🪙, guía mínima). Ambas leen `window.MonedaSocial.store()` — no duplicar datos.
- `sw.js` → `cal13-v37-offline` (agrega `negocios-penco.js?v=2`); `index.html` sube `negocios-penco.js?v=1` → `?v=2`. `moneda-social.js` sin cambios: queda en `?v=1`.
- `package.json` raíz → **1.4.0**; `web/package.json` → 1.4.0 + se agregan `negocios-penco.js` y `moneda-social.js` a `build.files` (faltaban).
- Para recompilar el portable: `npm run build` (electron-builder --win portable) → sale `dist-empaquetado/Calendario 13 Lunas 1.4.0.exe`. Borra el `.exe` viejo 1.3.0 si no lo quieres duplicar.

---

## 17. Herramientas agregadas 3–6 oct 2026 · cuarta oleada: interior y oráculos (v1.5.0)

Mismo patrón §15: cada archivo auto-instalable inyecta su botón, crea su `<dialog>` y guarda en `userData().<clave>`. Cabecera de cada archivo = botón, diálogo, pestañas y clave de datos. Todo 100% offline.

| Herramienta | Archivo | Botón | Diálogo / contenido | Datos (`userData()`) |
|---|---|---|---|---|
| 🧭 Ikigai | `ikigai-modulo.js` | Interior | `ikigaiDialog` — propósito (lo que amas / sabes / necesita el mundo / te pagan) | `ikigai` |
| 🔥 Retos 21 días | `retos-21-modulo.js` | Mi Día | `retos21Dialog` — retos de 21 días con fases siembra/brote/floración | propio |
| 💎 Fortalezas VIA | `fortalezas-via-modulo.js` | Interior | `viaDialog` — 6 virtudes, 24 fortalezas + test + firma (puente con Hábitos) | `via` |
| ☯️ Tao | `tao-modulo.js` | Interior | `taoDialog` — práctica y textos | `tao` |
| 🦅 Toltecas | `tolteca-modulo.js` | Interior | `toltecaDialog` — acuerdos y prácticas | `tolteca` |
| 🏛️ Estoicismo | `estoicismo-modulo.js` | Interior | `estoicismoDialog` — examen estoico, control/dicotomía | `estoicismo` |
| 🌺 Ho'oponopono | `hooponopono-modulo.js` | Interior | `hooponoponoDialog` — práctica de perdón y limpieza | `hooponopono` |
| 🔢 Grabovoi | `grabovoi-modulo.js` | Interior | `grabovoiDialog` — secuencias numéricas | `grabovoi` |
| 🧠 Método Silva | `metodo-silva-modulo.js` | Interior | `silvaDialog` — control mental, alfa, visualización | `silva` |
| 🌊 Vigyan Bhairav (Tantra) | `vigyan-bhairav-modulo.js` | Interior | `vigyanDialog` — 112 meditaciones | `vigyan` |
| 🔮 Numerología | `numerologia-modulo.js` | Oráculos | `numerologiaDialog` — número de vida, año personal | `numerologia` |
| 🌀 Kin Maya (ampliado) | `kin-maya-modulo.js` | Oráculos | `kinMayaDialog` — sello, tono, onda encantada | `kinMayaData` |
| 🎴 Tarot | `tarot-modulo.js` | Oráculos | `tarotDialog` — tiradas y significados | `tarot` |
| 🔯 Oráculo | `oraculo-modulo.js` | Oráculos | `oraculoDialog` — pregunta/respuesta | `oraculo` |
| 🔢 Matemáticas | `matematicas-modulo.js` | Aprender | `matematicasDialog` — práctica y desafíos (+ crucigrama/sopa ampliados) | `matematicas` |
| 🔌 Electrónica | `electronica-modulo.js` | Hogar/Taller | `electronicaDialog` — guías básicas | `electronica` |
| 🏠 Domótica | `domotica-modulo.js` | Hogar/Taller | `domoticaDialog` — casa inteligente de bajo costo | `domotica` |
| 🧭 Feng Shui | `feng-shui-modulo.js` | Hogar | `fengShuiDialog` — mapa bagua por habitación (% hábitos) | `fengshui` |
| 🌿 Recetas Naturales | `recetas-naturales-modulo.js` | Cuerpo | `recetasDialog` — preparados y remedios caseros | `recetas` |
| 🛤️ Cuarto Camino | `cuarto-camino-modulo.js` | Interior | `cuartoCaminoDialog` — ideas, prácticas, test, trabajo | `cuartoCamino` |
| ⛪ Iglesias Penco | `iglesias-penco.js` | Territorio > Penco | `iglesiasDialog` — templos e historia local | — |

Notas cuarta oleada:
- ❓ Guía in-app actualizada: tarjetas Mente (Métodos con 20 fichas, Oráculos, Tradiciones) y “Tips & Novedades”.
- `package.json` raíz → **1.5.0** (+ espejo `web/package.json`); `sw.js` sube caché con cada módulo nuevo.
- `package.json → build.files` debe incluir cada `*-modulo.js` nuevo o el `.exe` portable sale sin esa herramienta.

---

## 18. Novedades 6–8 oct 2026 · quinta oleada + perfiles (v1.6.0)

| Herramienta | Archivo | Botón | Diálogo / contenido | Datos (`userData()`) |
|---|---|---|---|---|
| 👼 Ami | `ami-modulo.js` | Interior | `amiDialog` — escucha, verdad, miedo, ritos (puente con 🌬️ Respiración) | `ami` |
| 💰 Finanzas-Negocio | `finanzas-negocio-modulo.js` | Hogar | `finanzasNegocioDialog` — hábitos de dinero, SII/DIDECO Penco | `finanzasNegocio` |
| 🤖 IA | `ia-modulo.js` | Aprender | `iaDialog` — guía de uso (salud/cuerpo, interior/memoria) sin diagnósticos | `iaUso` |
| 📜 Código Abierto | `open-source-modulo.js` | Comunidad | `openSourceDialog` — licencias GPLv3 + CC BY-NC-SA | — |

Notas v1.6.0:
- 👥 Perfiles actualizados y **sin opción Infantil** (11 perfiles: Todo, Esencial, Adolescente, Adulto, Mayor, Estudiante, Agricultor, Pescador, Salud, Deportista, Docente).
- 🏠 Pantalla de inicio ampliada de 24 a **34 bloques** (🎣 Pesca, 🌳 Bosque, 🦅 Aves, 🥬 Huerta, 🧠 Estudio, 📖 Cuentos, 🌳 Familia, 🚨 Emergencia, 🤝 Comunidad, 🔧 Energía); cada perfil ajusta su inicio (vista + bloques ◉ Hoy).
- APK de referencia: `dist-empaquetado/13-Lunas-offline-1.6.0.apk` (debug).
- `package.json` raíz y `web/package.json` → **1.6.0**.

---

## 19. Base técnica 11 oct 2026 · rendimiento y pipeline (v1.7.0)

Sin herramientas nuevas visibles: puro cimiento para que la app vuele y se publique sola.

- ⚡ **Minificado esbuild** (`scripts/minify.cjs`): sidecars `min/*.min.js(css)`; `index.html` + `boot-modulos.js` apuntan a `.min` (deploy slim: las fuentes `.js/.css` ya no viajan en `web/` ni en el portable).
- 🧩 **Diálogos a plantillas** (`scripts/build-templates.cjs`): `templates/*.html` + `templates-bundled.js` con inyección eager; `index.html` adelgaza ~380 KB.
- 🛡️ **CSP fase 1 + 2**: sin `unsafe-inline` en scripts; ~9.700 estilos estáticos migrados a utilidades `styles-csp.css` (`scripts/csp-fase2.cjs`).
- 💾 **Bitácoras a IndexedDB** (`storage-idb.js`): store propio primario + cuota + cifrado; respaldo/restaurar por usuario.
- 🧱 **`renderer.js` partido en 7 `core-*`**: calendario, clima, diálogo-día, storage, temas, bootstrap, audio (990 → 830 KB).
- 📲 **PWA instalable**: prompt de instalación, screenshots reales, `manifest.json` con capturas.
- ✅ **CI + calidad**: workflow GitHub (`test` + `lighthouse`), presupuesto de performance (`scripts/perf-budget.cjs`), checks de sintaxis/tamaño/manifiesto/SW/web/donate; `npm test` lo corre todo.
- 🔄 **Auto-update + release**: `electron-updater` en `main.js` (feed GitHub); al pushear tag `v*`, CI compila el **NSIS** y lo publica en Releases.
- `package.json` raíz y `web/package.json` → **1.7.0**.

Comandos clave: `npm test` (todo) · `npm run build:min` · `npm run build:tpl` · `npm run sync:web -- --fix` · `npm run build` (portable) · `npm run build:win-nsis` (instalador).

---

## 20. Novedades 12 oct 2026 · conexión y pulido diario (v1.8.0)

| Novedad | Dónde | Detalle |
|---|---|---|
| 📅 ICS importar/exportar | `ics-modulo.js` · Mi Día > Organizar | Lleva compromisos a Google/Outlook/Apple (luna, ciclo o todo; notas privadas NO salen) y trae `.ics` externos (recurrentes DAILY/WEEKLY) sin duplicar. RFC 5545, tope 2 MB. 100% local. |
| ⚡ Energía y Descanso | `energia-descanso-modulo.js` · Cuerpo | Registro opcional diario: horas de sueño, calidad, energía, ánimo + nota → marca 💤 en el calendario; vista por lunas + guía. No diagnostica: espejo personal. `userData().energiaDescanso`. |
| ✨ Espíritu en navegación | `espiritu-modulo.js` + `renderer.js`/`index.html` | Botón `✨ Espíritu` cableado en grupo prácticas, `ALL_BTNS`, perfiles (Mayor/Salud/Deportista) y respaldo (clave `espiritu`); keywords de búsqueda. |
| 🛤️ Cuarto Camino ampliado | `cuarto-camino-modulo.js` | 14 → **21 ideas**, 8 → **12 prácticas** (+ STOP 1 min, recuerdo de sí, puentes con Eneagrama). |
| ✅ Hábitos: iconos por categoría | `renderer.js` + `habitsDialog` | 45 → **~125 iconos** en 8 categorías (Esenciales, Movimiento, Mente, Comida, Hogar, Naturaleza, Calma, Familia) + **botón desplegable** (colapsado muestra 14) + campo Icono editable para pegar cualquier emoji. |
| 🌬️ Respiración: práctica arriba | `breathDialog` + `renderer.js` | El reproductor (círculo + ▶ Iniciar) va **antes de la grilla**; intro colapsable; al elegir técnica sube solo a la práctica; al abrir entra con scroll arriba. |

Notas v1.8.0:
- `package.json` raíz y `web/package.json` → **1.8.0**; `android/app/build.gradle` → `versionName "1.8.0"` (+ `versionCode`).
- `sw.js` → `cal13-v77-offline` (incluye `espiritu-modulo`; poda de historial `?v=`).
- Artefactos: `dist-empaquetado/Calendario 13 Lunas 1.8.0.exe` (portable) + instalador NSIS `...Setup 1.8.0.exe` + `dist-empaquetado/13-Lunas-offline-1.8.0.apk` (debug).
- ❓ Guía in-app actualizada: textos de Hábitos/Respiración + “Tips & Novedades v1.8.0” (también se agregaron las entradas v1.5.0 y v1.7.0 que faltaban).

---

## 21. Novedades 13–16 oct 2026 · territorio vivo + aprender + interior (v1.9.0)

Mismo patrón §15: cada archivo auto-instalable inyecta su botón, crea su `<dialog>` y guarda en `userData().<clave>`. Cabecera de cada archivo = botón, diálogo, pestañas y clave de datos. Todo 100% offline (audios y mapas son archivos locales precacheados).

### 21.1 Territorio vivo (Penco · Bío-Bío)

| Herramienta | Archivo | Botón | Diálogo / contenido | Datos (`userData()`) |
|---|---|---|---|---|
| 🦭 Fauna Marina | `fauna-marina-modulo.js` | `btnFaunaMarina` (Territorio > Mar, junto a Ballenas) | `faunaMarinaDialog` — Hoy / Catálogo (cetáceos Golfo de Arauco, lobos + chungungo, pingüinos y aves marinas) / Bitácora / Historia / Guía. Puente con 🐦 Aves e 🦀 Intermareal | `faunaMarina { avistamientos, ... }` |
| 🌾 Humedal Rocuant-Andalién | `humedal-rocuant-andalien-modulo.js` | `btnHumedal` (Territorio > Mar/Tierra) | `humedalDialog` — Hoy / Conocer / Vida / Visita / Defensa / Bitácora. Sistema Rocuant-Andalién-Vasco Da Gama (~1.500-2.000 ha, sitio IBA BirdLife, 120-160 especies) | `humedal { visitas, reportes, ... }` |
| ⚠️ Amenazas del Territorio | `amenazas-territorio.js` | `btnAmenazas` (Territorio > Penco) | `amenazasDialog` — fichas por amenaza (extractiva/natural/urbana: nivel, zona, señales, qué hacer, dónde denunciar) + por sector (cruce con los 7 sectores de Penco) + Mis reportes vecinales (📌 al calendario) | `amenazas { siguiendo, reportes }` |
| 🧱 Permacultura (hub) | `permacultura-modulo.js` | `btnPermacultura` (Territorio > Tierra, junto a Huerta) | `permaculturaDialog` — Guía (3 éticas, 12 principios, zonas, agua, luna) / Diseño / Mi sitio (zonas 0-5) / Sistemas / Tareas. Marco que une Huerta + Electrocultura + Compost | `permacultura { sitios, sistemas, tareas }` |
| 📖 Bosque ampliado | `bosque-historia.js` + `data/territorios/penco/historia/*.json` | pestaña Historia en `bosqueDialog` | Linajes gondwánicos → restauración actual; especies del catálogo cargables a bitácora | `bosque` (bitácora existente) |

Datos nuevos en `data/territorios/penco/`: `amenazas.json`, `especies/fauna-marina.json`, `historia/historia-fauna-marina.json` (+ ampliaciones en `historia-bosque.json`, `companeros-bosque.json`, `especies/bosque.json`, `territorio.json`). Todo con fallback embebido; paridad verificada por `scripts/validar-territorios.cjs`.

### 21.2 Aprender: idiomas, música y juegos

| Herramienta | Archivo | Botón | Diálogo / contenido | Datos |
|---|---|---|---|---|
| 🗣️ Método de idiomas | `idiomas-modulo.js` | `btnIdiomas` (Aprender > Idiomas, guía general) | `idiomasDialog` — Guía (CEFR, errores) / Método 28 días / Vocabulario / Escucha y habla (shadowing, TTS) / Gramática / Mi plan (racha, auto-test) | `idiomas { mazo, sesiones, plan }` |
| 🇧🇷 Portugués | `portugues-modulo.js` | `btnPortugues` (junto a Mapuzugun/Inglés) | `portuguesDialog` — Palavra do dia (TTS pt-BR) / A1 / A2 / B1 / B2-C1 + Cultura (falsos amigos, música, capoeira) | `portugues { ... }` |
| 🇨🇳 Chino Mandarín | `chino-mandarin-modulo.js` | `btnChino` (junto a los anteriores) | `chinoDialog` — Palabra del día (hanzi+pinyin+tono, TTS zh-CN) / HSK1-2 / HSK3 / HSK4-5 + Cultura (chengyu, trazos, té, Confucio/Tao) | `chino { ... }` |
| 🎶 Música (8 secciones) | `musica-modulos.js` | `btnAprenderInstrumento` + `btnGuitar btnUkelele btnFlauta btnTeclado btnCajon btnCanto btnViolin btnMusicaPractica` | Método universal 28 días + 6 instrumentos completos (3 niveles c/u) + Herramientas (afinador, metrónomo, tap-tempo). Reemplaza el botón único “Instrumentos” | `musica { ... }` por instrumento |
| ⚪ Damas chilenas | `dama-modulo.js` | `btnDama` (Aprender > Juegos) | Tablero jugable (2P o vs CPU 4 niveles), reglas chilenas (captura obligatoria, dama larga), 6 motivos + 8 puzzles + 6 salidas | `dama { stats, puzzles }` |
| 🃏 Solitario Klondike | `solitario-modulo.js` | `btnSolitario` (Aprender > Juegos) | Klondike 52 cartas (modos 1/3 cartas, puntos, deshacer, pista, auto-terminar, partida guardada) + Aprender + registros | `solitario { stats, partida }` |
| 📚 Cuentos narrados | `assets/cuentos/luna01-13.mp3` | dentro de `btnTales` | 13 audios (~10 MB total, offline precacheados): un cuento por luna | — (archivos, no datos) |

### 21.3 Interior, día y hogar

| Herramienta | Archivo | Botón | Diálogo / contenido | Datos |
|---|---|---|---|---|
| 🕊️ Reiki | `reiki-modulo.js` | `btnReiki` (Linaje > Prácticas, tras Ho'oponopono) | `reikiDialog` — Guía (Usui, niveles, ética) / Gokai (5 principios) / Posiciones (12 + 7 chakras) / Sesión / Registro | `reiki { practicas, sesiones }` |
| ✝️ Consciencia Crística | `consciencia-cristica-modulo.js` | `btnCristica` (tras Reiki) | `cristicaDialog` — Guía (ecuménica) / 7 Pilares / 12 Palabras (bienaventuranzas + parábolas) / Oración / Examen / Registro | `cristica { ... }` |
| 🌅 Club 5 AM | `club-5am-modulo.js` | `btnClub5am` (Mi Día > Organizar) | `club5amDialog` — Guía (20/20/20, 66 días) / Mi Victoria (checklist diario) / Reto 66 días (3 fases) / Descanso | `club5am { dias, racha }` |
| 🎯 Retos ampliado | `retos-21-modulo.js` | `btnRetos21` (existe) | **12 plantillas** con plan día a día + Mis retos (duplicar, editar, archivar) + vista Día a día | `retos { ... }` (existente) |
| 🔌 Electricidad (hub) | `electricidad-modulo.js` | `btnElectricidad` (Hogar > Energía, primero) | `electricidadDialog` — Guía base (qué toca técnico SEC) / Tablero / Circuitos / Boleta y consumo / Autonomía y cortes. No confundir con Electrónica (componentes) ni Domótica (casa inteligente) | `electricidad { circuitos, lecturas }` |
| ⚖️ Legal y privacidad | `legal-modulo.js` + `legal/*.html` | `btnLegal` (Comunidad > Legal) | `legalDialog` — resumen + acciones (exportar respaldo, borrado local Ley 21.719). Textos completos standalone: `terminos.html`, `privacidad.html`, `cookies.html`, `licencias.html` (precacheados, footer de `index.html` los enlaza) | aceptación `cal13-legal-v1` |

### 21.4 Base técnica y pulido

- 👋 **Bienvenida primera vez** (`bienvenida-modulo.js` + `bienvenida.css`): pantalla 0 Bienvenida → 1 Perfil (nombre + preset) → 2 Listo. Solo en instalación fresca. Animación con `anime-v4.js` (UMD vendored, **lazy**, precacheado en SW, no penaliza el arranque).
- 🔍 **Zoom calendario** (`zoom-calendario.js`): `Ctrl+rueda` sobre la grilla (solo PC, 60–180%), atajos `Ctrl+/-/0`, insignia flotante A−/A+/1:1. Persiste en `DATA.config.calZoom`.
- 📱 **Vista celular en PC**: botón `btnVistaCelular` (emula 390px centrados) + insignia solo-PC en `styles.css`.
- 🧱 **Renderer adelgazado**: `renderer-territorio-vivo.js` extraído (bitácoras Pesca/Aves/Intermareal/Bosque); `core-calendario.js` + `core-sanitize.js` como núcleos; `renderer.js` baja ~990 → ~830 KB.
- 🔍 **SEO/PWA**: `robots.txt` + `sitemap.xml` ampliados, meta description/OG/Twitter, `schema.org` JSON-LD, `<title>` con Penco, `preload` de `renderer.min.js`, `aria-label` sin emoji.
- 🛡️ **Pipeline**: techos sincerados a lo medido — CSP dinámicos 211→**229** (`scripts/csp-fase2.cjs`), perf JS 5300→**5600** / gzip 1770→**1880** / CORE 380→**395** (`scripts/perf-budget.cjs`). `npm test` verde: **77/77**, sintaxis **269** archivos.
- 📦 Versiones: `package.json` raíz y `web/package.json` → **1.9.0**; `android/app/build.gradle` → `versionName "1.9.0"` (`versionCode 3`); `sw.js` → `cal13-v113-offline`; `min/` 127 fuentes; dependencias (Electron 43.7.10, `overrides.tar`).

Notas v1.9.0:
- Para recompilar todo: `npm test` (verifica) → `npm run build` (portable) → `npm run build:win-nsis` (instalador) → `npm run movil:build` (APK debug en `android/app/build/outputs/apk/debug/app-debug.apk`, copia a `dist-empaquetado/13-Lunas-offline-1.9.0.apk`).
- Al agregar otro `*-modulo.js`: añádelo a `boot-modulos.js` (lista MODS), a `build.files` en `package.json`, y corre `npm run build:min` + `npm run build:sw` + `npm run sync:web -- --fix` (el SW sube CACHE solo).
- Los mp3 de cuentos van en `assets/cuentos/` y viajan en `build.files` (`assets/**/*`) + precache SW; pesan ~10 MB: no meter más audio sin revisar `check:size` + `check:perf`.

---

*Última actualización: 2026-10-16 (v1.9.0) — Mantener esta guía junto a `LEEME.txt`.*
