# Arquitectura — partición del monolito (mejoras #1, #2, #20)

Estado v1.8: `renderer.js` 990 KB/12.576 → **~830 KB/~10.200 líneas** tras
extraer 7 módulos. `index.html` 421 → 29 KB (diálogos a `templates/`).

## Lo extraído (scope top-level DESNUDO, sin IIFE)
Sin IIFE a propósito: los archivos comparten scope global con el remanente,
igual que cuando eran secciones del monolito. Orden defer en index.html.

```
core-bootstrap.js    (DATA, CYCLE_YEARS, cycle, currentView, $, hideBootSplash)
core-audio.js        (getNotifyAudio, playNotifySound, unlock)
core-themes.js       (THEMES + aplicación/selector)
core-storage.js      (scheduleSave)
core-calendario.js   (vistas luna/semana/mes + grid + pager + mobile)
core-dialogo-dia.js  (dayDialog: notas, compromisos, ánimo, compartir)
core-clima.js        (WMO, offline, panel open-meteo, aire/UV)
```

`core/a11y.js` no se extrajo: ese código sigue en renderer.js (accesibilidad-
modulo.js lo complementa con observer, no lo reemplaza).

## Reglas (vigentes, verificadas por CI + smoke Electron)
1. Cortes solo en líneas en blanco; el slice debe pasar `node --check`
   aislado y no duplicar declaraciones (`nodup`: 0 duplicados).
2. Sin ejecuciones load-time que llamen a código del remanente (solo
   declaraciones + wiring autocontenido con `$`/DOM estático).
3. `scripts/check-size.cjs` fija techos; si un archivo lo supera, se parte
   (no se sube el techo). renderer techo 1150 KB.
4. Cada extracción: minify + sync-web + build-sw + manifest + `npm test` +
   `smoke-electron.cjs` (TDZ/orden solo se ven en runtime).

## Candidatos siguientes (cuando renderer vuelva al techo)
`core-hogar.js` (pantalla inicio), `core-siembra.js`, `core-mareas.js`,
diálogos territorio (pesca/aves/intermareal/bosque), `core-salud.js`
(menstrual/medic), `core-respaldo.js` (search/backup/restore).
