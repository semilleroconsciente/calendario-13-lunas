# Guía de Cambios Manuales — Calendario 13 Lunas / Web

> Carpeta: `calendario-13-lunas/web` · Todo se edita con un editor de texto (VS Code, Notepad++, Bloc de notas). No necesitas compilar.

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

Botones del footer `index.html:76-108` — cada uno es:

```html
<button id="btnTides" class="btn">🌊 Mareas</button>
```

Borra la línea para quitar el botón, o duplica cambiando `id` y texto para agregar uno nuevo (requiere lógica en `renderer.js` si debe hacer algo).

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

*Última actualización: 2026-09-01 — Mantener esta guía junto a `LEEME.txt`.*
