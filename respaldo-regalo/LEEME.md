# Respaldo — Sección 🎁 Regalo territorial (retirada, no borrada)

Fecha de retiro: 2026-10-20. Versión guardada: regalo-modulo v2 (héroe lunar,
altar de velas, tarjetas puente, línea de tiempo, cápsulas, hoja imprimible).

## Qué hay aquí

- `regalo-modulo.js` — fuente (iba en `src/`).
- `regalo-modulo.min.js` — minificado de referencia (lo regenera `build:min`).
- `regalo.html` — página de propósito offline (iba en `legal/`).
- Docs que quedaron en su sitio (no se ven en la app): `docs/PROPOSITO-REGALO.md`,
  `docs/PROTOCOLO-MEMORIA-CULTURA.md`, `docs/NUCLEO-SAGRADO.md`,
  `docs/GUIA-CLONAR-Y-LEGADO.md`.

## Cómo reponerla (5 minutos)

1. Copiar la fuente y la página a su sitio:
   - `respaldo-regalo/regalo-modulo.js` → `src/regalo-modulo.js`
   - `respaldo-regalo/regalo.html` → `legal/regalo.html`
2. En `boot-modulos.js`, bloque `MODS`, después de la línea de
   `orden-herramientas-modulo`, re-agregar:
   `'min/regalo-modulo.min.js?v=1',`
3. Reconstruir y verificar:
   `npm run build:min` → `npm run build:sw` → `npm run sync:web` → `npm test`
4. Abrir Comunidad → 🎁 Regalo. Los datos viejos (memorias, diario, cápsulas)
   siguen en los respaldos locales (`regaloMemorias`, `regaloDiario`,
   `regaloCapsula`) y reaparecen solos.

## Por qué se retiró

Decisión del territorio (2026-10-20): pausar la sección visible hasta su
revisión comunitaria. Nada se perdió: este es el estado verde completo
(`npm test` exit 0, perf bajo techo al momento del retiro).
