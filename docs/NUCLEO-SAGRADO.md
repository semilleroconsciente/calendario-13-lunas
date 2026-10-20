# Núcleo Sagrado (lo que no se rompe)

Lo mínimo que hace que este regalo siga siendo regalo, aunque cambie todo lo demás.

## Núcleo técnico

1. **Offline-first:** abre sin internet. Service Worker (`sw.js`) + datos en `data/territorios/<id>/` + fallback en `src/data.js`.
2. **Privado por defecto:** `userData()` local por perfil. `scheduleSave` guarda en el aparato. Nada sale sin gesto explícito (compartir/exportar).
3. **Sin rastreo ni publicidad:** CSP `script-src 'self'`, sin analytics. Ver `index.html` y `legal/privacidad.html`.
4. **Licencia dual:** código GPL-3.0-or-later (`COPYING`), contenido CC BY-NC-SA 4.0 (`LICENCIA-CONTENIDO-CC-BY-NC-SA-4.0.md`). Nadie lo privatiza ni lucra sin retribuir.
5. **Presupuestos:** JS raw 6400 KB / gzip 2150 KB / CORE 420 / index 60 KB. Ante exceso, partir/diferir (ver `scripts/perf-budget.cjs`, `scripts/check-size.cjs`).
6. **Carga:** núcleo pinta el calendario; `boot-modulos.js` carga el resto diferido. Nuevos módulos van a `MODS`, con IIFE + `window.cal13*` único (ver `tests/iife-globals.test.js`).

## Núcleo cultural

1. 13 lunas x 28 días + día fuera del tiempo, con nombres en mapuzugun y estaciones Pukem/Pewü/Walüng/Rimü.
2. Territorio vivo: mareas, clima, bosque, huerta y vida comunal de Penco como ejemplo clonable.
3. Convivencia gregoriano + lunar: ninguno invalida al otro.
4. Lenguaje: educativo, no clínico ni esotérico cerrado. Deriva a red formal en salud/emergencia.

## Regla de cambio

- Cambiar datos de un territorio: solo su carpeta `data/territorios/<id>/` + `scripts/validar-territorios.cjs`.
- Cambiar UI: extender módulos existentes antes que crear archivos nuevos (cada `.js` nuevo suma ~2 entradas CORE + JS al presupuesto).
- Nuevos diálogos: preferir `makeDialog` en JS antes que `templates/*.html` (cada template suma 1 entrada CORE).
