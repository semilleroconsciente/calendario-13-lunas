# Auditoría — Estado actual (Fase 0)

**Repositorio:** `C:\Users\IVI\Documents\Default Project\calendario-13-lunas`
**Rama base:** `main` @ `43ef758`
**Fecha de verificación:** 2026-11-02
**Alcance de esta pasada:** Fase 0, Fase 1 (protección de datos), Fase 2
(territorio) y Fase 3 (esquema, validación y CI) del informe
`INFORME-AUDITORIA-CALENDARIO-13-LUNAS-CODEX.md`, priorizando los riesgos P0 de
integridad de datos y añadiendo pruebas de regresión. La regla calendárica de
bisiestos (CAL-01) queda fuera de alcance por requerir decisión de producto.

> Los cambios de esta pasada están **sin commit**. No se publicó ni se ejecutó
> ningún script de publicación.

---

## 1. Método y comandos ejecutados

No se usó `npm test` como verificación de solo lectura porque ese comando
ejecuta primero `csp:fase2`, `build:tpl` y `build:min` con `--fix`, es decir,
modifica archivos. En su lugar se ejecutaron por separado las pruebas y los
verificadores:

```powershell
npm run test:ci        # pruebas + verificadores, solo lectura
node --test "tests/*.test.js"
node scripts/minify.cjs --check
node scripts/build-sw.cjs --check
node scripts/sync-web.cjs --check
node scripts/check-syntax.cjs
```

Cuando `min/` y `web/` quedaron desactualizados tras editar `src/`, se
regeneraron de forma explícita y se revisó el diff:

```powershell
node scripts/minify.cjs --fix
node scripts/sync-web.cjs --fix
```

Resultado final de la suite:

| Métrica | Resultado |
|---|---:|
| Pruebas | 121 |
| Pasan | 120 |
| Fallan | 0 |
| `todo` | 1 (CAL-01, decisión pendiente) |
| Suites | 27 |

Verificadores finales:

| Comando | Resultado |
|---|---|
| `minify.cjs --check` | `OK: min/ fresco (147 archivos)` |
| `build-sw.cjs --check` | sin cambios (407 entradas) |
| `sync-web.cjs --check` | `OK: web/ esta en sincronia con la raiz` |
| `check-syntax.cjs` | `OK: sintaxis valida en 310 archivos` |

---

## 2. Matriz resumen: hallazgo → archivo → reproducción → estado

Estados usados:

- **corregido:** el riesgo se corrigió y hay una prueba automatizada que lo
  reproduce/verifica.
- **vigente:** el riesgo sigue presente en el código actual (confirmado por
  lectura o por prueba).
- **pendiente:** no se abordó en esta pasada, requiere decisión de producto o
  verificación externa (CI, dispositivo real, lector de pantalla).
- **no reproducido:** no se observó el comportamiento señalado.

| ID | Hallazgo | Archivo principal | Reproducción / evidencia | Estado |
|---|---|---|---|---|
| CAL-01 | 13×28 + DFT y continuidad en bisiestos | `src/cal.js` | `tests/calendario-continuidad.test.js` (huecos 20-jun en 2020, 2024, 2028, 2032, 2036, 2040) | **vigente** (decisión pendiente) |
| DATA-01 | Borrado de perfil deja bitácoras/espejos | `src/core-storage.js`, `src/renderer.js` | `tests/persistencia.test.js` → «borra datos, store de bitácoras y espejos…» | **corregido** |
| DATA-02 | Restauración no elimina grupos antiguos | `src/web-api.js`, `src/renderer.js` | `tests/persistencia.test.js` → «replaceData elimina grupos…» | **corregido** |
| DATA-03 | Éxito falso con persistencia degradada | `src/storage-idb.js`, `src/web-api.js`, `src/core-storage.js` | `tests/persistencia.test.js` → contrato de escritura (3 casos) | **corregido** |
| DATA-04 | Faltan pruebas de borrado/restauración | `tests/persistencia.test.js` | 16 pruebas nuevas sobre IDB falso en memoria | **corregido** |
| DATA-05 | Guardados concurrentes fuera de orden | `src/core-storage.js` | `tests/persistencia.test.js` → «serializa guardados…» | **corregido** |
| BACKUP-01 | El clic marca respaldo aunque se cancele | `src/auto-backup-modulo.js`, `src/renderer.js` | `tests/respaldo-confirmacion.test.js` (2 pruebas) | **corregido** |
| IMPORT-01 | Importación individual sin identidad origen/destino | `src/bitacoras-respaldo-modulo.js` | `tests/importacion-identidad.test.js` (5 pruebas) | **corregido** |
| MIG-01 | Sin `schemaVersion` ni migraciones de `DATA` | `src/data-schema.js`, `src/web-api.js`, `main.js` | `tests/esquema-datos.test.js` + `tests/persistencia.test.js` (esquema futuro/corrupto) | **corregido** |
| MIG-02 | Validación profunda insuficiente | `src/data-schema.js`, `src/renderer.js`, importadores | `tests/esquema-datos.test.js` (invariantes, Huerta, notas huérfanas) | **corregido parcialmente** |
| TERR-01 | Mezcla silenciosa de territorios/fallback | `src/territorio.js`, `index.html`, `src/styles.css` | `tests/territorio-loader.test.js` (3 pruebas, incluye aviso) | **corregido** |
| HUERTA-01 | Referencias huérfanas al borrar bancales/cultivos | `src/huerta-modulo.js` | `bancalId = ''`, cosechas/tareas conservadas | **vigente** |
| TEST-01 | Cobertura IDB real y roundtrip | `tests/helpers.cjs`, `tests/persistencia.test.js` | IDB falso en memoria (no navegador real) | **corregido parcialmente** |
| CI-01 | CI de solo lectura y versiones coherentes | `package.json`, `.github/workflows/ci.yml`, `README.md` | `test:ci` de solo lectura + `check:size`; CI usa `test:ci`; README aclara el portable 1.9.0 | **corregido** |
| ACT-01 | Modelo común de actividades | Agenda, Huerta, Retos, Comunidad | Formatos de tarea separados | **vigente** |
| DFT-01 | Compromisos DFT como registros | `src/retos-21-modulo.js` | `cyk.dft.nota` es texto concatenado | **vigente** |
| ELECTRON-01 | Recuperación asistida desde `.bak` | `main.js` | Se crea `.bak`, no se ofrece recuperación | **vigente** |
| MODULE-01 | Manifiesto central de módulos | varias listas | No existe manifiesto único | **vigente** |
| UX-01 | Descubrimiento/onboarding | UI | No auditado en esta pasada | **pendiente** |
| KNOW-01 | Procedencia y revisión del conocimiento | contenidos | No auditado en esta pasada | **pendiente** |
| S (ACC) | Accesibilidad, compatibilidad, rendimiento | UI/PWA/Electron | No auditado en esta pasada | **pendiente** |

---

## 3. Detalle por hallazgo

### A. CAL-01 — Calendario, ciclos y DFT

**Archivo:** `src/cal.js` (líneas 21–32).
**Regla actual confirmada:** `weTripantuUTC(year)` fija el 21 de junio;
`buildCycle(year)` genera 13×28 = 364 días y añade un DFT en el día 365. El
ciclo siguiente vuelve a empezar el 21 de junio.

**Reproducción:** `tests/calendario-continuidad.test.js` verifica estructura,
inicio de ciclo y duplicados, y confirma que los únicos huecos actuales son el
**20 de junio de cada año bisiesto**:

```
2020-06-20, 2024-06-20, 2028-06-20, 2032-06-20, 2036-06-20, 2040-06-20
```

La prueba «todas las fechas gregorianas tienen exactamente una asignación»
queda marcada como `todo` porque la corrección exige una decisión
calendárica/cultural que no corresponde inventar al agente.

**Estado:** **vigente**. Bloqueado por decisión de producto entre:
1. año calendárico fijo de 365 días con ajuste explícito en bisiestos;
2. inicio astronómico/cultural variable;
3. otra regla documentada por el responsable del calendario.

**Criterio de aceptación pendiente:** ninguna fecha sin asignación ni con doble
asignación, con la regla elegida documentada y cubierta por pruebas.

---

### B. TERR-01 — Datos territoriales y fallback

**Archivo:** `src/territorio.js` (loader `cargarTerritorio`, API `api.listo`).

**Cambios realizados:**
- El `id` solicitado se valida contra `data/territorios/index.json`. Un id no
  listado vuelve al territorio por defecto y queda marcado, en vez de mezclarse
  en silencio.
- Se exponen `solicitado`, `id` efectivo, `degradado`, `motivo` y `origen` por
  clave (`json` / `fallback`).
- Un archivo faltante o un fallback por archivo marca `degradado` con motivo.
- El evento `territorio:listo` incluye esos campos.
- Se corrigió un bug de auto-mutación: cuando el fallback era la misma
  referencia global de `data.js`, `mutarEnElLugar` la vaciaba y la repoblaba
  consigo misma, dejando arreglos vacíos.
- La UI muestra un aviso persistente (`#territorioAviso`, `role="status"`)
  cuando el territorio efectivo no es el solicitado o algún archivo cayó al
  respaldo, con el motivo y el nombre del territorio mostrado.

**Pruebas:** `tests/territorio-loader.test.js`:
- territorio alternativo completo sin degradación y sin aviso;
- id no listado → default marcado y aviso con el id solicitado;
- archivo faltante → fallback identificado, degradado y aviso visible.

**Estado:** **corregido** (loader y aviso de interfaz).

---

### C. DATA-01 — Eliminación de perfiles y bitácoras huérfanas

**Archivos:** `src/core-storage.js` (`eliminarPerfil`, línea 77),
`src/renderer.js` (`btnDelUser`).

**Cambios realizados:**
- Una única operación coordinada: primero guarda la desaparición del perfil en
  `DATA`; si ese guardado falla, revierte en memoria y **no toca** sus
  bitácoras.
- Si el guardado funciona, enumera y borra los registros del store de bitácoras
  (`uid:*`) y los espejos `cal13-bit:uid:*` de `localStorage`.
- Verifica releyendo que el perfil y sus notas no reaparezcan.
- Devuelve `{ok, fallos, motivo}`; la UI distingue «falló el guardado» de
  «perfil eliminado con datos sin limpiar».
- No permite eliminar el último perfil.

**Prueba:** `tests/persistencia.test.js` → «borra datos, store de bitácoras y
espejos del perfil eliminado» y «no permite eliminar el último perfil».

**Estado:** **corregido**.

---

### D. DATA-02 — Restauración completa y sincronización entre almacenes

**Archivos:** `src/web-api.js` (`replaceData`, línea 174),
`src/renderer.js` (`applyBackupJSON`).

**Cambios realizados:**
- `replaceData()` lee el estado anterior, elimina del store los grupos que no
  pertenecen al respaldo (por usuario ausente o porque ninguna de sus claves
  está en las notas nuevas), escribe el estado nuevo y verifica la lectura de
  vuelta comparando JSON canónico.
- Si falla la limpieza, la escritura o la verificación, intenta re-guardar el
  estado anterior y devuelve error.
- `applyBackupJSON` usa `replaceData` y, si falla, restaura `DATA` en memoria y
  avisa que se conservó el estado anterior.

**Pruebas:** `tests/persistencia.test.js`:
- `replaceData` elimina grupos que no están en el respaldo;
- `replaceData` conserva los grupos que sí están.

**Estado:** **corregido**, con una limitación explícita: la recuperación es
*mejor esfuerzo* (re-guardar el estado anterior), no una transacción atómica
entre IndexedDB y `localStorage`.

---

### E. DATA-03 — Persistencia degradada y mensajes de guardado

**Archivos:** `src/storage-idb.js`, `src/web-api.js`,
`src/core-storage.js`.

**Cambios realizados:**
- `storage-idb.js` devuelve un contrato real para escrituras y borrados:
  `{ok, backend, degradado, temporal, espejo}`. `ok` solo es `true` si hay una
  copia durable confirmada (IndexedDB o `localStorage`). Si solo hay memoria,
  `ok:false` y `temporal:true`.
- `web-api.js` publica `lastSaveState` y emite `cal13:persistencia`; ya no
  convierte un fallo total en éxito.
- `partirGruposAlStore` solo elimina las claves del blob si la escritura en el
  store quedó confirmada. Antes podía borrarlas aunque el store fallara.
- `core-storage.js` distingue cuatro mensajes: persistido, degradado, temporal y
  error.

**Pruebas:** `tests/persistencia.test.js`:
- IDB disponible → `backend: indexeddb`, sin degradación;
- IDB falla y `localStorage` escribe → degradado, no éxito silencioso;
- IDB y `localStorage` fallan → `saveData` devuelve `false` y estado temporal;
- un borrado con IDB correcto pero espejo `localStorage` fallido se reporta
  como parcial (no se declara completo);
- el store de bitácoras falla → el blob no se adelgaza.

**Estado:** **corregido**.

---

### F. BACKUP-01 — Respaldo automático y confirmación de exportación

**Archivos:** `src/auto-backup-modulo.js`, `src/renderer.js` (`doBackup`).

**Cambios realizados:**
- Se eliminó el hook de clic que marcaba `cal13-ultimo-respaldo` 2 segundos
  después de pulsar el botón, aunque el usuario cancelara.
- `doBackup()` solo llama a `cal13backupDone()` si `backupSave` devuelve un
  resultado válido; si no, muestra «Cancelado o no se pudo guardar».

**Pruebas:** `tests/respaldo-confirmacion.test.js`:
- pulsar «Respaldar ahora» abre el flujo real pero **no** marca la fecha;
- solo `cal13backupDone()` marca la fecha.

**Estado:** **corregido**. El navegador no puede confirmar que el usuario
conservó el archivo; solo se confirma que la exportación devolvió un resultado
válido.

---

### G. HUERTA-01 — Referencias huérfanas en Huerta

**Archivo:** `src/huerta-modulo.js`.

**Evidencia vigente:**
- al borrar un bancal, los cultivos quedan con `bancalId = ''` (línea 505);
- al borrar un cultivo, sus cosechas y tareas se conservan;
- las tareas y cosechas guardan `bancalId`/`cultivoId` y pueden quedar sin
  contexto legible.

**Estado:** **vigente**. Requiere una política de archivado vs. borrado y una
migración compatible; no se tocó en esta pasada para no cambiar semántica de
datos sin decisión de producto.

---

### H. DFT-01 — Compromisos DFT y desafíos

**Archivo:** `src/retos-21-modulo.js` (líneas 140–141, 531–532).

**Evidencia vigente:** los compromisos se guardan concatenados en
`cyk.dft.nota` como texto, sin identificador propio ni edición/eliminación
individual equivalente a una actividad de agenda.

**Estado:** **vigente**. Depende de ACT-01.

---

### I. IMPORT-01 — Importación individual e identidad de perfil

**Archivo:** `src/bitacoras-respaldo-modulo.js` (líneas 69–99, 464–500).

**Cambios realizados:**
- Se calcula la identidad origen/destino (`identidadImportacion`).
- Si el archivo pertenece a otro perfil, se muestra nombre e id de origen y
  destino y se exige confirmación explícita antes de aplicar.
- Cancelar no modifica datos.
- Se valida que `usuario`, si existe, sea un objeto.
- `applyPayload` espera `saveNow()` y solo informa éxito si la persistencia fue
  confirmada; si falla, lanza error y no muestra «importada ✓».

**Pruebas:** `tests/importacion-identidad.test.js`:
- cancelar no modifica el destino;
- confirmar aplica y persiste antes de informar éxito;
- mismo perfil no pide confirmación;
- si la persistencia falla, no informa éxito.

**Estado:** **corregido**.

---

### J. MIG-01 — Versionado de respaldos y migraciones de esquema

**Archivos:** `src/data-schema.js` (nuevo), `src/web-api.js`, `main.js`,
`src/renderer.js`, importadores.

**Cambios realizados:**
- Se separaron explícitamente las tres versiones: contenedor (`v:1`), esquema de
  `DATA` (`SCHEMA_VERSION = 1`) e IndexedDB (`V = 2`).
- El sobre web ahora incluye `schema`. Las exportaciones completas e
  individuales también lo incluyen, sin romper el formato anterior.
- `migrarYValidar()` aplica migraciones ordenadas `vN → vN+1` sobre una copia.
  Se implementó la migración real `v0 → v1` (formato legado con `DATA.cycles`).
- Una versión futura (`schema > 1`) se rechaza con `schema-futuro` y no muta la
  entrada ni el almacenamiento.
- Una carga corrupta o de esquema futuro ya no se convierte en `{}`: el arranque
  muestra un error y bloquea los guardados (`window.cal13NoGuardar`) para no
  sobrescribir el archivo original.
- `main.js` aplica la misma regla en Electron; `web-api.loadData()` propaga
  `datos-corruptos` / `schema-futuro` en vez de ocultarlos.

**Pruebas:** `tests/esquema-datos.test.js` (8), más 6 pruebas de carga segura en
`tests/persistencia.test.js` y una de bitácora futura en
`tests/importacion-identidad.test.js`.

**Estado:** **corregido**.

---

### K. MIG-02 — Validación profunda de importaciones y restauraciones

**Archivos:** `src/data-schema.js`, `src/renderer.js` (`applyBackupJSON`),
`src/bitacoras-respaldo-modulo.js`.

**Cambios realizados:**
- Validador central independiente de `renderer.js` que comprueba:
  objeto raíz, `usuarios` (1–50, ids únicos, no vacíos, ≤40), `actual` válido,
  `notas` y `cycles`/`moons`/`days`/`dft`, `config` y las colecciones de Huerta.
- `normalizar()` completa solo campos faltantes; no reemplaza estructuras
  inválidas ni borra notas huérfanas (las reporta como advertencia).
- La restauración completa migra/valida antes de tocar `DATA`; si falla, no
  modifica nada y muestra el motivo.
- La importación individual rechaza archivos de esquema futuro antes de aplicar.

**Límite:** no hay validadores exhaustivos para los ~90 módulos restantes. La
base cubre invariantes globales y Huerta; los módulos nuevos deben registrar sus
reglas cuando tengan referencias relacionales.

**Estado:** **corregido parcialmente**.

---

### L. TEST-01 / DATA-04 — Pruebas de IndexedDB y cobertura

**Archivos nuevos:**
- `tests/helpers.cjs`: IndexedDB falso en memoria con `open/upgrade`,
  transacciones, `put/get/delete` y `openCursor`; `localStorage` en memoria y
  `localStorage` que falla.
- `tests/persistencia.test.js`: 16 pruebas.
- `tests/esquema-datos.test.js`: 8 pruebas.
- `tests/territorio-loader.test.js`: 3 pruebas.
- `tests/importacion-identidad.test.js`: 5 pruebas.
- `tests/calendario-continuidad.test.js`: 4 pruebas + 1 `todo`.
- `tests/respaldo-confirmacion.test.js`: 2 pruebas.

**Cobertura lograda:** contrato de escritura, fallo de IDB, fallo de
`localStorage`, cuota/escritura fallida simulada, restauración con grupos
antiguos, borrado completo de perfil, concurrencia de guardados, identidad de
importación, recordatorio de respaldo, migración legado→actual, rechazo de
esquema futuro y bloqueo de guardado tras una carga fallida.

**Límite:** el IndexedDB es una implementación de prueba en memoria, no el
IndexedDB real de un navegador. No se probó upgrade real de versión de base,
aborto de transacción del navegador ni cuota real del dispositivo.

**Estado:** **corregido parcialmente**. Pendiente una prueba en navegador real
(Playwright/Electron) para el roundtrip completo y la reapertura.

---

### M. DATA-05 — Guardados concurrentes y escrituras asíncronas

**Archivo:** `src/core-storage.js` (líneas 8–60).

**Cambios realizados:**
- Cola `_saveChain`: una sola escritura en vuelo.
- `scheduleSave` toma la instantánea al ejecutar, no al programar.
- `saveNow` permite guardado inmediato y verificable.
- El indicador solo se pinta para la última secuencia (`_saveSeq`).

**Prueba:** `tests/persistencia.test.js` → «serializa guardados: una escritura
lenta no pisa a la última». Simula la primera escritura lenta (40 ms) y la
segunda inmediata; el estado final debe ser el segundo.

**Estado:** **corregido**.

---

### N. ELECTRON-01 — Copia `.bak` y recuperación

**Archivo:** `main.js` (líneas 125–142).

**Evidencia vigente:** la escritura es atómica (`tmp` + `rename`) y conserva
`archivo.bak` antes de reemplazar. No se encontró una validación del archivo
principal al iniciar ni una recuperación asistida desde `.bak` si el principal
está corrupto.

**Estado:** **vigente**.

---

### O. ACT-01 — Arquitectura de actividades compartidas

**Evidencia vigente:** Agenda, Huerta, Retos/Desafíos y otros módulos mantienen
formatos de tarea propios; no hay un contrato común con `source`, `ownerId`,
`createdAt`/`updatedAt` ni prevención de duplicados al sincronizar.

**Estado:** **vigente**.

---

### P. MODULE-01 — Catálogo/manifiesto central de módulos

**Evidencia vigente:** no existe un manifiesto único; las listas de módulos
están distribuidas en varias partes de la aplicación.

**Estado:** **vigente**.

---

### Q. UX-01 — Descubrimiento y onboarding

**Estado:** **pendiente**. No se auditó en esta pasada; requiere prueba con
personas y revisión de búsqueda/navegación antes de proponer cambios.

---

### R. KNOW-01 — Calidad, procedencia y revisión del conocimiento

**Estado:** **pendiente**. No se auditó en esta pasada.

---

### S. Accesibilidad, compatibilidad y rendimiento

**Estado:** **pendiente**. No se auditó en esta pasada. Los techos
6400/2150/420 siguen sin reinterpretarse; requieren identificar qué mide cada
cifra antes de reutilizarla.

---

### T. CI-01 — CI, scripts y consistencia de versiones

**Cambios realizados:**
- Nuevo `npm run test:ci`: ejecuta las pruebas y todos los verificadores en
  modo de solo lectura (no regenera `min/`, plantillas ni `sw.js`).
- `check:size` se incorporó a `test:ci`; hoy pasa con los techos actuales.
- `.github/workflows/ci.yml` usa `npm run test:ci` en lugar de `npm test`.
- `npm test` se conserva para uso local y sigue regenerando artefactos antes de
  verificar.
- README aclara que `npm test` escribe archivos, documenta `test:ci` y explica
  que el portable 1.9.0 es un build anterior; el próximo build usa 1.9.1.
- Se convirtió el último `style="..."` estático
  (`src/enlaces-relacionados-modulo.js`) a una clase `su-*`, por lo que
  `check:csp2` vuelve a pasar.

**Estado:** **corregido**.

---

## 4. Archivos modificados en esta pasada

### Código

| Archivo | Cambio |
|---|---|
| `src/storage-idb.js` | Contrato real de escritura/borrado; ya no devuelve éxito si solo hay memoria. |
| `src/web-api.js` | `lastSaveState`, `replaceData` con limpieza de grupos y verificación; no adelgaza el blob si el store falló. |
| `src/core-storage.js` | Cola serializada, `saveNow`, mensajes de persistencia y `eliminarPerfil` coordinado. |
| `src/renderer.js` | Borrado de perfil coordinado, restauración con rollback, respaldo condicionado a resultado válido. |
| `src/auto-backup-modulo.js` | Eliminado el hook que fechaba el respaldo por clic. |
| `src/bitacoras-respaldo-modulo.js` | Confirmación de identidad origen/destino y persistencia verificada. |
| `src/territorio.js` | Validación contra índice, marcas de degradación, aviso visible y corrección de auto-mutación del fallback. |
| `src/data-schema.js` | Nuevo: versión de esquema, validación, normalización y migración `v0 → v1`. |
| `src/styles.css` | Estilo del aviso territorial (`#territorioAviso`). |
| `src/enlaces-relacionados-modulo.js` | Último `style=` estático convertido a clase `su-*` para `check:csp2`. |
| `main.js` | Rechazo de esquema futuro al cargar/guardar en Electron. |
| `index.html` | Carga de `min/data-schema.min.js` y contenedor del aviso territorial. |
| `package.json` | Script `test:ci` de solo lectura con `check:size`. |
| `.github/workflows/ci.yml` | El job de pruebas usa `test:ci` (sin `--fix`). |
| `README.md` | Documenta `test:ci` y aclara la versión del portable. |

### Pruebas

| Archivo | Pruebas |
|---|---:|
| `tests/helpers.cjs` | Utilidades compartidas (IDB falso, storage en memoria/fallido). |
| `tests/persistencia.test.js` | 16 |
| `tests/esquema-datos.test.js` | 8 |
| `tests/calendario-continuidad.test.js` | 4 + 1 `todo` |
| `tests/territorio-loader.test.js` | 3 |
| `tests/importacion-identidad.test.js` | 5 |
| `tests/respaldo-confirmacion.test.js` | 2 |

### Artefactos generados

- `min/*.min.js` y `min/.hashes.json` regenerados para todas las fuentes
  cambiadas, incluida la nueva `min/data-schema.min.js`.
- `web/min/*` sincronizados desde la raíz.
- `sw.js` / `web/sw.js` regenerados con la nueva entrada (407 assets, cache
  bump).

---

## 5. Riesgos residuales y decisiones requeridas

1. **CAL-01 (P0):** decidir la regla de continuidad en bisiestos. Sin esa
   decisión, el 20 de junio de cada año bisiesto sigue sin asignación.
2. **DATA-02:** la recuperación es mejor esfuerzo; una caída entre la limpieza
   del store y la escritura del blob puede requerir reimportar el respaldo.
3. **TEST-01:** falta una prueba con IndexedDB real de navegador/Electron y
   reapertura completa.
4. **MIG-01/MIG-02:** el núcleo y Huerta están cubiertos; faltan validadores
   específicos para los módulos restantes y una prueba de arranque real
   (navegador/Electron) con archivo futuro o corrupto.
5. **HUERTA-01, ACT-01, DFT-01, ELECTRON-01, MODULE-01:** sin cambios en esta
   pasada; requieren diseño funcional o migración.
6. **UX-01, KNOW-01, accesibilidad:** no auditados; no deben declararse
   resueltos.
7. **CI-01:** `test:ci` es de solo lectura y ya corre en GitHub Actions; el job
   `release` sigue publicando solo con tag firmado y no se probó en un runner
   real en esta pasada.

---

## 6. Conclusión de la Fase 0

Los riesgos P0 de integridad de datos (DATA-01, DATA-02, DATA-03, DATA-04,
DATA-05) quedaron corregidos con pruebas de regresión; BACKUP-01, IMPORT-01,
TERR-01, MIG-01 y CI-01 quedaron corregidos, y MIG-02 cubre el núcleo y Huerta.
CAL-01 sigue **vigente** y bloqueado por una decisión calendárica/cultural que
no corresponde tomar al agente.

La suite completa queda en **120 pruebas que pasan, 0 fallos y 1 `todo`**
documentado. `npm run test:ci` termina con código 0 y no escribe archivos. Los
artefactos `min/`, `web/` y `sw.js` están sincronizados. No se hizo commit ni
publicación.
