# Informe — Calendario de las 13 Lunas · Mari Küla Küyen

**Fecha del informe:** 16 de octubre de 2026 (actualizado; original 1 de octubre de 2026)
**Versión de la app:** 1.9.0 · **Ubicación de referencia:** Penco, Bío-Bío, Chile (36.73° S, 72.99° O)
**Repositorio:** Git (último commit `f8f72d8`), copia desplegable en `web/`

---

## 1. Resumen ejecutivo

El **Calendario de las 13 Lunas** es una aplicación de escritorio (Electron) y web progresiva (PWA) que integra un calendario lunar de ciclo anual de 13 lunas de 28 días (364 días + 1 día fuera de tiempo) con la cosmovisión mapuche, datos astronómicos reales y ~80 módulos de vida práctica organizados en 7 grupos temáticos. Funciona offline-first mediante service worker con caché tolerante.

**Estado general:** sólido. Sintaxis de los 41 archivos JS correcta, datos embebidos en paridad con los JSON de origen, sin colisiones de nombres entre módulos. **Un defecto pendiente:** 3 módulos nuevos no están en la caché offline del service worker (detalle en §6).

---

## 2. ¿Qué es el calendario?

### Las 13 lunas (data.js)

| # | Luna | Estación |
|---|------|----------|
| 1 | We Tripantü Küyen (Año Nuevo) | Pukem · Invierno |
| 2 | Llitunül Wilki Küyen (canto del zorzal) | Pukem · Invierno |
| 3 | Llitun Pofpof Anümka Küyen | Pewü · Primavera |
| 4 | Rayen Awar Küyen (flor de la maría) | Pewü · Primavera |
| 5 | Longkon Kachilla Küyen | Pewü · Primavera |
| 6 | Karü Kachilla Küyen | Walüng · Verano |
| 7 | Kudewallüng Küyen | Walüng · Verano |
| 8 | Püramuwün Kachilla Küyen · Are Küyen | Walüng · Verano |
| 9 | Trüntarü Küyen | Rimü · Otoño |
| 10 | Ngülliw Küyen | Rimü · Otoño |
| 11 | Malliñ Ko Küyen | Rimü · Otoño |
| 12 | Trangliñ Küyen | Pukem · Invierno |
| 13 | Mawün Kürüf Küyen (descanso de la tierra) | Pukem · Invierno |

Las **4 estaciones** (Pukem, Pewü, Walüng, Rimü) estructuran el año y dan color y descripción a cada luna. Cada luna trae descripción propia ligada al territorio de Penco y Lirquén (marejadas, siembras, cosechas).

### Vistas del calendario

1. **🌙 Luna** — vista por defecto, luna de 28 días.
2. **🌗 Semana lunar** — bloques 01-07 / 08-14 / 15-21 / 22-28 con fase e iluminación.
3. **📅 Mes** — vista mensual gregoriana.
4. **🗓️ Semana** — vista semanal gregoriana (lunes-domingo) con número de semana ISO.

Complementos: reloj en vivo (America/Santiago), panel de mareas, clima, fases lunares calculadas astronómicamente (`astro.js`), Ekadashi, carta astral y día fuera de tiempo.

---

## 3. Arquitectura técnica

| Capa | Tecnología |
|------|-----------|
| Escritorio | Electron 43 + electron-builder (portable Windows, `dist-empaquetado/`) |
| Web / PWA | HTML + CSS + JS vanilla, service worker offline-first (`sw.js`, caché `cal13-v32`) |
| Datos | `data/territorios/penco/*.json` + fallback embebido en `data.js` |
| Astronómico | Cálculo propio de fases, salidas/puestas de sol y luna (`astro.js`, `cal.js`) |
| Externas | open-meteo (clima/mareas) con fallback offline |

**Convención de módulos:** cada módulo es un IIFE auto-contenido inyectado por botón (convención `btn*`), lo que evita colisiones de nombres y permite activar/desactivar módulos desde la configuración personalizable.

**Tamaños relevantes:** `renderer.js` ≈ 917 KB (núcleo UI), `nuevos-modulos.js` ≈ 310 KB, `index.html` ≈ 377 KB, `linaje-modulos.js` ≈ 111 KB.

---

## 4. Módulos funcionales (~80 botones, 7 grupos)

| Grupo | Subgrupos | Módulos representativos |
|-------|-----------|------------------------|
| **Día** | Organizar, Registrar | Hábitos, disciplina, agenda, temporizador, recordatorios, gratitud, sueños, respiración |
| **Territorio** | Mar, Tierra, Cielo, Penco | Mareas, pesca, intermareal, nudos, kayak, ballenas, huerta, siembra, bosque, compost, hidroponía, electrocultura, flora, lawen, aves, melí, hongos, senderos, fuego, clima, astro, hora dorada, circadiano, Ekadashi, guía de la comuna, municipalidad, bomberos, actores |
| **Cuerpo** | Ciclos, Cuidado | Menstrual, fertilidad, juventud, climaterio, botiquín, nutrición (con menús sugeridos por kcal/proteína), gimnasio |
| **Aprender** | Estudio, Juegos, Infancias | Estudio, memoria, mapudungun, inglés, guitarra (con tablatura), ajedrez, sudoku, crucigrama, sopa de letras, cuentos, crianza (Montessori, Waldorf, Pikler, Reggio, crianza respetuosa), adolescencia |
| **Linaje** | Conocerse, Prácticas diarias, Tradiciones, Oráculos, Sostén | Psicología, eneagrama, fortalezas VIA, ikigai, neurodiversidad, tao, recapitulación, toltecas, estoicismo, cuarto camino, ho'oponopono, métodos, silva, grabovoi, tantra, anastasia, ami, kin maya, tarot, numerología, oráculo, duelo, adicciones, fenología |
| **Hogar** | Casa, Energía, Familia | Comidas, compras, finanzas, tareas del hogar, bodega, despensa, clóset, energía, leña, taller, herramientas, mecánica, conversor, árbol genealógico, voces de abuelos, constelaciones familiares, adultez, vejez |
| **Comunidad** | Red Penco, Emergencia | Trueque, minga, derechos, moneda social, red comunitaria, cuidado animal, primeros auxilios, violencia, evacuación, apoyo emergencia, donaciones (lo técnico —respaldo, restaurar, PDF luna/ciclo, acceso directo, traspaso QR— vive en ⚙️ Ajustes) |

---

## 5. Datos y contenido territorial

- **Fuente oficial:** `data/territorios/penco/` — 17 archivos JSON: territorio, lunas, eventos, talleres, consejos de bosque, especies (aves, bosque, intermareal, flora), historia (sectores, guía, bosque, aves, pesca), cultivos (asociaciones, preparados) y actores.
- **Fallback embebido** en `data.js` para que la app abra aunque falle el `fetch`.
- **Verificación:** `scripts/validar-territorios.cjs` y `verificar-paridad.cjs` confirman que el fallback coincide con los JSON ("TODO IGUAL").
- **Multi-territorio:** `scripts/nuevo-territorio.cjs` permite crear nuevos territorios (extensión preparada para otras comunas).

---

## 6. Resultados de la auditoría (28 sept 2026)

### ✅ Sin problemas
- Sintaxis válida en los 41 archivos `.js` (`node --check`).
- Todos los scripts cargados por `index.html` existen; sin archivos huérfanos.
- Todos los JSON válidos (manifest, donaciones, territorio).
- Sin colisiones de nombres top-level; módulos correctamente aislados en IIFE.
- Paridad total entre datos embebidos y JSON de origen.
- IDs del DOM usados en JS verificados (los 4 casos "huérfanos" tienen guardas nulas o se crean dinámicamente).
- Copia desplegable `web/` idéntica a la raíz en archivos clave.

### ❌ Hallazgos pendientes

1. **Offline incompleto (alta prioridad):** tres módulos cargados en `index.html` **no están en la lista CORE del service worker**, por lo que no se precachean y fallarán sin conexión:
   - `apoyo-emergencia.js`
   - `bomberos-penco.js`
   - `municipalidad-penco.js`
2. **Duplicados en CORE:** `'./index.html'`, `'./web-api.js'` y `'./web-api.js?v=8'` aparecen dos veces cada uno.
3. **Ambas copias afectadas:** el defecto existe en la raíz y en `web/sw.js`.
4. Menor: commits git con mensajes triviales ("few", "as", "we"), lo que dificulta el historial.

### Recomendación
Agregar los 3 módulos al CORE (bare + `?v=1`), eliminar duplicados, subir la caché de `cal13-v32` a `v33` para forzar reinstalación, y sincronizar `web/sw.js`.

---

## 7. Riesgos y deuda técnica

| Riesgo | Nivel | Comentario |
|--------|-------|-----------|
| `renderer.js` de ~917 KB sin bundling ni minificación | Medio | Carga y mantenimiento pesados; crecimiento continuo de un archivo monolítico |
| Versionado manual `?v=N` + lista CORE manual | Medio | Es la causa directa del hallazgo 6.1; automatizable |
| Sin tests automatizados | Medio | Solo `test-astro.js`; la verificación es manual/script puntual |
| Dependencia de APIs externas (open-meteo) | Bajo | Ya mitigado con fallbacks offline |
| Mensajes de commit sin semántica | Bajo | Higiene de repositorio |
| `fuente_docx.txt`, `test-astro.js` en raíz | Bajo | Archivos de trabajo mezclados con el producto |

---

## 8. Conclusión

El proyecto es funcionalmente rico y técnicamente coherente: arquitectura de módulos IIFE simple y robusta, offline-first bien pensado y datos territoriales verificables. El único defecto real y accionable es la caché del service worker incompleta (3 módulos), de corrección trivial y con impacto directo en la experiencia offline. La deuda principal es de escala: el monolito `renderer.js` y el versionado manual de caché merecerían automatización a medida que crece la cantidad de módulos.

---

## 9. Addendum — 10 de octubre de 2026

- **Hallazgo §6.1 (3 módulos fuera del SW) verificado como ya corregido** en `sw.js` (`municipalidad-penco.js`, `bomberos-penco.js`, `apoyo-emergencia.js` presentes en el CORE).
- **Nueva deriva del mismo tipo, corregida:** `ia-modulo.js?v=4`, `recetas-naturales-modulo.js` (bare + `?v=1`) y `vigyan-bhairav-modulo.js` (bare + `?v=1`) estaban en `index.html` pero no en el CORE de `sw.js` ni `web/sw.js`. Agregadas; caché subida a `cal13-v58-offline`.
- **`web/sw.js` estaba desactualizado** (caché `v55` vs `v57` en raíz). Sincronizado desde la raíz.
- **`vigyan-bhairav-modulo.js` faltaba en `build.files` de `package.json`** → el portable de Windows no lo incluía. Agregado.
- **Anti-deriva:** nuevo `scripts/sync-manifest.cjs` (`npm run check:manifest` / `npm run sync:manifest --fix`) que verifica la sincronía entre `index.html`, `sw.js`, `web/sw.js` y `package.json`. Verificado con `node --check` y casos de prueba aislados (detección con exit 1, reparación + bump de CACHE, re-verificación OK).

### Tanda 2 — mismo día
- **Seguridad `main.js`:** `openExternal` solo permite `http(s)` (bloquea `file:`, `javascript:`, `data:`); `shortcut:create` envía el script PowerShell por `-EncodedCommand` Base64 (sin interpolación en línea de comandos); `data:save` con escritura atómica (tmp + rename) + copia `.bak` del último guardado bueno.
- **Datos versionados sin tocar el renderer:** `web-api.js` y `main.js` envuelven al guardar (`{app:'cal13', v:1, savedAt, data}`) y desenvuelven al cargar; legado pasa tal cual; `scheduleSave` ahora muestra "⚠ No se pudo guardar" si el borde rechaza (antes mentía "Guardado ✓").
- **Sincronía `web/`:** nuevo `scripts/sync-web.cjs` (`npm run check:web` / `sync:web`, dirección única raíz→web, nunca borra solo-web ni toca `donate.json`). Detectó y reparó deriva real: `sopa-letras-modulo.js` (raíz 06-10 con mejoras táctiles vs web 05-10), `data/territorios/index.json` (formato) y `package.json` desactualizado en `web/`.
- **Tests:** `tests/astro.test.js` (20 aserciones: sol/luna Penco + 8 fases documentadas) y `tests/storage.test.js` (5: sobre versionado, legado, idempotencia, corrupto, vacío). `npm test` = unit + manifest + web + sintaxis (98 archivos). Todo en verde (25/25).
- **`index.html`:** loader de módulos con reintento + reporte visible en `#statusMsg` (antes los fallos eran silenciosos); aviso "Nueva versión disponible" con `SKIP_WAITING` + recarga; `preconnect` a ambas APIs open-meteo.
- **Headers web:** `_headers` suma `nosniff`, `Referrer-Policy`, `SAMEORIGIN` y `Permissions-Policy` con `(self)` para mic/cámara (los usan Voz de los Abuelos y QR-sync; la primera versión los bloqueaba y se corrigió antes de publicar). Igual corrección en `web/server.js`.
- **`donate.example.json`** con las 4 claves que lee el renderer (`mercadopago`, `paypal`, `flow`, `kofi`); `donate.json` real sigue gitignorado.
- **No se movieron** `fuente_docx.txt` ni `test-astro.js`: ninguno se referencia desde código ni se empaqueta; moverlos no cambia el producto y `test-astro.js` queda como script manual de referencia para `tests/astro.test.js`.
- **Diferido a propósito (requiere decisión de producto o refactor mayor):** partir `renderer.js` (990 KB), migrar a IndexedDB, CSP estricta (hay scripts inline), onboarding, screenshots reales del manifest, target NSIS/auto-update, poda de `?v` viejos del CORE.

### Tanda 3 — lista de 20 mejoras (mismo día)
- **SW generado, no manual (#3, #15):** nuevo `scripts/build-sw.cjs` (`npm run build:sw` / `check:sw`) que genera el CORE desde `index.html` (bare + `?v` vigente). Podó 232→213 entradas y subió CACHE. `sync-manifest` sigue como verificador.
- **`sync-web` propagaba deriva pero no archivos nuevos (#16):** corregido — ahora copia también `.js/.css/_headers` solo-raíz a `web/` (detectó que `numerologia-modulo.js` faltaba en `web/`). `_headers` raíz creado (no existía).
- **Manifest (#9):** verificado UTF-8 correcto en disco — el mojibake era artefacto de la consola Windows (PowerShell sin UTF-8), no del archivo. Screenshots siguen siendo iconos (requiere diseño, no código).
- **Nuevos módulos:** `storage-idb.js` (IndexedDB + fallback localStorage, #5; `web-api.js` lo usa primero), `onboarding-modulo.js` (tour 4 pasos + botón 🧭, #10), `auto-backup-modulo.js` (aviso si >30 días sin respaldo, #11), `accesibilidad-modulo.js` (`aria-expanded`, trampa de foco, `prefers-reduced-motion`, #19). Cableados en MODS + `build.files` + SW.
- **CSP transicional (#7):** meta en `index.html` + `_headers` (raíz y web) + `web/server.js`. Permite `'unsafe-inline'` porque quedan 2 `<script>` inline + `<style>` del splash (extraerlos es el paso a CSP estricta). `connect-src` limitado a open-meteo.
- **Ventana Electron (#8):** `minWidth 1100→380`, `minHeight 700→640` (tablets/netbooks).
- **Higiene (#13, #14, #17, #18):** `fuente_docx.txt`→`docs/`, `test-astro.js`→`scripts/manual/` (+ comentario en test); `scripts/check-donate.cjs`, `scripts/check-size.cjs` (techos: renderer 1150, nuevos 450, index 450, css 150 KB), `scripts/lint-commits.cjs` (avisa, no bloquea); `docs/arquitectura.md` con plan de partición; `movil:build` documenta el APK (sync+gradle); `build:win-nsis` como alternativa al portable.
- **Contraste (#19):** `--muted #9aa3c7→#b9c1e4` (raíz + tema noche) + `:focus-visible` dorado + `skip-link` visible al enfocar.
- **Tests (#6):** `manifest.test.js` (6), `territorio.test.js` (2), `idb-fallback.test.js` (1). `npm test` = unit + manifest + sw + web + donate + sintaxis (105 archivos). Todo en verde (34/34).

### Addendum — 13 de octubre de 2026 (auditoría integral + correcciones)
- **Seguridad:** `core-sanitize.js` reescrito (era no-op `return String(html)`): ahora allowlist real (`SCRIPT/STYLE/IFRAME/OBJECT/EMBED/LINK/META/BASE/FORM` eliminados, `on*`/`style`/`javascript:` strip, URLs `http/https/mailto/tel/relativas` + DOMPurify si existe). `main.js export:pdf` sanea HTML (`sanitizePdfHtml`) + `javascript:false` en la ventana oculta. `web/server.js` `X-Frame-Options: DENY→SAMEORIGIN` (igual que `_headers`). `package.json` suma `overrides.tar ^7.5.2` (mitiga GHSA path-traversal de `@capacitor/cli@6`; migración a Capacitor 8 queda como tarea mayor).
- **Rendimiento:** `boot-modulos.js` pasa de secuencial a pool paralelo ×4 (los `<script async=false>` conservan orden de ejecución; ~4× más rápido, un fallo ya no bloquea la cadena). Tamaños actuales: `renderer.js 785 KB`, `nuevos-modulos.js 360 KB`, `index.html 47 KB`, `styles.css 110 KB`, JS raw 4808 KB / gzip 1604 KB (bajo techo, pero techo descriptivo: partir `renderer.js` sigue pendiente, ver `docs/arquitectura.md`).
- **Higiene:** `lint-commits.cjs` suma modo `--strict` (falla si HEAD trivial; normal sigue avisando) y `npm test` ahora incluye `lint:commits`. Informe actualizado a v1.8.0.
- **SEO/PWA:** `robots.txt` + `sitemap.xml` creados, `<title>` con Penco, `aria-label` limpio (sin emoji) en dock + vistas + pager, disclaimer salud en templates médicos (`medicDialog.html`, `psicologia`/`menstrual` vía renderer).
- **Tests:** `66/66 pass`, sintaxis 235 archivos OK.

### Addendum — 16 de octubre de 2026 (v1.9.0: territorio vivo + aprender + interior)
- **Nuevos módulos (16):** fauna-marina, humedal-rocuant-andalien, amenazas-territorio, permacultura (hub), idiomas (método), portugués, chino-mandarín, música (8 secciones: método + 6 instrumentos + herramientas), damas chilenas, solitario Klondike, reiki, consciencia-crística, club-5am, electricidad (hub), legal + bienvenida primera vez (anime.js v4 lazy). Retos-21 ampliado a 12 plantillas; bosque-historia + datos Penco (amenazas, fauna-marina) nuevos.
- **Multimedia offline:** 13 cuentos narrados `assets/cuentos/luna01-13.mp3` (~10 MB, precacheados en SW).
- **Pulido:** zoom calendario `Ctrl+rueda` (60-180%), vista-celular en PC, renderer adelgazado (`renderer-territorio-vivo.js` extraído), SEO (sitemap/OG/JSON-LD), footer legal (`legal/*.html`).
- **Pipeline sincerado:** CSP dinámicos 211→229 (fijo: 2 estáticos de humedal → clases `su-10a44c`/`su-e39201`), perf JS→5600/gzip→1880/CORE→395. `npm test` verde **77/77**, sintaxis 269 archivos, `sw.js` → `cal13-v113-offline`.
- **Versiones:** `package.json` (raíz + web) 1.9.0, `android` versionName 1.9.0 / versionCode 3. Guía `web/GUIA-CAMBIOS-MANUALES.md` §21 + `web/LEEME.txt` (APK Capacitor) actualizadas. APK: `dist-empaquetado/13-Lunas-offline-1.9.0.apk`.
