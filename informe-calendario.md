# Informe — Calendario de las 13 Lunas · Mari Küla Küyen

**Fecha del informe:** 1 de octubre de 2026
**Versión de la app:** 1.3.0 · **Ubicación de referencia:** Penco, Bío-Bío, Chile (36.73° S, 72.99° O)
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
| **Linaje** | Interior, Familia | Psicología, eneagrama, métodos, neurodiversidad, recapitulación, espiritualidad, duelo, árbol genealógico, voces de abuelos, adultez, vejez |
| **Hogar** | Casa, Energía | Comidas, compras, finanzas, tareas del hogar, bodega, despensa, clóset, energía, leña, taller, herramientas, mecánica, conversor |
| **Comunidad** | Red, Emergencia, App | Trueque, minga, derechos, cuidado animal, primeros auxilios, violencia, evacuación, respaldo, restaurar, acceso directo, PDF luna/ciclo, donaciones |

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
