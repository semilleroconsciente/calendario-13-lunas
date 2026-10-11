# Arquitectura — plan de partición (mejoras #1, #2, #20)

Estado: `renderer.js` ≈ 990 KB / 12.575 líneas, `nuevos-modulos.js` ≈ 374 KB,
`index.html` ≈ 4670 líneas. Todo funciona, pero cada cambio toca un monolito.

## Partición objetivo (sin romper IIFE ni `btn*`)

```
renderer.js  →  js/core/
  core/bootstrap.js    (DATA, CYCLE_YEARS, cycle, currentView, $, saveTimer)
  core/audio.js        (getNotifyAudio, playNotifySound, unlock)
  core/a11y.js         (a11yPatchIconButtons + observer) — ya delegado a accesibilidad-modulo.js
  core/themes.js       (THEMES + aplicación)
  core/calendario.js   (vistas luna/semana/mes + grid + pager)
  core/dialogo-dia.js  (dayDialog: notas, compromisos, ánimo)
  core/storage.js      (scheduleSave + window.api) — borde IDB en storage-idb.js
nuevos-modulos.js  →  un archivo por módulo (ya son IIFE; solo separar)
index.html diálogos  →  templates/xxx.html cargados con fetch + <template>
```

## Reglas

1. Cada módulo sigue IIFE, sin top-level nuevo (lo verifica `check:syntax` + test de colisiones).
2. `scripts/check-size.cjs` fija techos; si un archivo lo supera, se parte (no se sube el techo).
3. `storage-idb.js` + `accesibilidad-modulo.js` + `onboarding-modulo.js` +
   `auto-backup-modulo.js` son los primeros 4 extraídos con este patrón.
4. Deuda pendiente: minificación en build (terser/esbuild) y namespaces por grupo.
