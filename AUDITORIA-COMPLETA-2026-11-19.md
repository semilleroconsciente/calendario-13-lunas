# Auditoría completa — Calendario de las 13 Lunas

**Repositorio:** `calendario-13-lunas` · rama `main` @ `28c0d09` ("sodoku tamaño")
**Fecha:** 2026-11-19 · **Versión auditada:** 1.9.1 (Electron portable + PWA + APK)
**Método:** solo lectura. Suite `npm run test:ci`, `npm audit`, ESLint ad-hoc (npx),
diff contra la auditoría anterior (`AUDITORIA-ESTADO-ACTUAL.md`, base `43ef758`),
revisión manual de Electron/SW/cifrado/sanitización, inventario de red y secrets.
No se modificó ningún archivo del proyecto (este informe es lo único nuevo).

---

## 0. Veredicto general

**Estado: sólido y verde.** 125/125 pruebas pasan, los 15 verificadores en verde,
`min/`+`web/`+`sw.js` sincronizados, CAL-01 (el P0 bloqueado por decisión cultural)
**resuelto** con doble DFT en bisiestos, sin hallazgos de seguridad ALTA, sin secrets,
cero telemetría y ninguna salida de datos personales del dispositivo. Las 4
vulnerabilidades de `npm audit` son moderadas y solo afectan herramientas de build
(Capacitor CLI). Los riesgos reales que quedan son de **mantenibilidad** (monolito de
10.740 líneas, presupuesto de performance al 99,5 %), **higiene** (9 commits triviales,
~100+ catches vacíos) y tres medianos de seguridad (actualizaciones sin firmar,
sanitizador HTML casero, contraseña maestra del cifrado en memoria clara).

| Dimensión | Nota | Resumen |
|---|---|---|
| Pruebas y CI | ★★★★★ | 125/125 · 15 verificadores · CI SHA-pinned con audit gate |
| Seguridad Electron | ★★★★☆ | Sandbox+contextIsolation; falta firmar updater y handler de permisos |
| Seguridad web/PWA | ★★★★★ | CSP sin `unsafe-eval`, headers endurecidos, SW same-origin |
| Privacidad | ★★★★★ | 0 telemetría; solo coords fijas + frases didácticas a Google TTS |
| Integridad de datos | ★★★★☆ | Esquema versionado, migraciones, rollback verificado; Huerta-01 vigente |
| Arquitectura | ★★★☆☆ | Carga modular limpia pero `renderer.js` 832 KB / 10.740 líneas |
| Higiene git/docs | ★★★☆☆ | 9 commits triviales; README/desactualizados en 4 puntos |
| Dependencias | ★★★★☆ | Audit verde (prod); 4 moderadas solo en cadena Capacitor CLI |

---

## 1. Verificación ejecutada (todo en verde)

| Comando | Resultado |
|---|---|
| `node --test tests/*.test.js` | **125 pruebas, 125 pasan, 0 fallos, 0 todo** (29 suites) |
| `check:csp2` | OK: 0 estáticos, 232 dinámicos (techo 232) |
| `check:tpl` | OK: 60 diálogos en bundle |
| `check:min` | OK: `min/` fresco (149 archivos) |
| `check:perf` | OK pero **al límite** (ver §8) |
| `check:size` | OK: renderer 832/1150 KB, styles 147/150 KB |
| `check:manifest` | OK: index/sw/web/package en sincronía |
| `check:sw` | OK: 411 entradas CORE reales (contador muestra 420, ver §8) |
| `check:web` | OK: `web/` en sincronía (275 compartidos) |
| `check:donate` · `check:syntax` | OK · OK (314 archivos) |
| `lint:commits` | **9 avisos** de commits triviales (ver §6) |
| `npm audit` (prod) | 4 moderadas (glob/minimatch/rimraf vía `@capacitor/cli`) |
| `npm audit` (dev) | + `fast-uri` moderada |
| ESLint ad-hoc (`npx eslint .`) | 4.568 errores `no-empty` + 15.680 avisos `no-var` (ver §7) |

### 1.1 Cierre de hallazgos de la auditoría anterior (2026-11-02)

| ID anterior | Estado hoy | Evidencia |
|---|---|---|
| **CAL-01** (hueco 20-jun bisiesto) | ✅ **RESUELTO** | `src/cal.js:34-40` — segundo DFT (`diaN:2`) cuando `year+1` es bisiesto; pruebas «no hay huecos» y «exactamente una asignación» pasan |
| DATA-01…05, BACKUP-01, IMPORT-01, MIG-01, TERR-01, CI-01 | ✅ Corregidos | Confirmado por suite (persistencia, esquema, restauración, respaldo, identidad, loader, CI) |
| **MODULE-01** (manifiesto central) | ✅ **En gran parte resuelto** | `boot-modulos.js` MODS (119 módulos) + `tests/modulos-manifiesto.test.js` exige paridad fuente↔MODS↔SW; 0 fuentes muertas en 145 |
| MIG-02 | ⚠ Parcial (como antes) | Núcleo+Huerta cubiertos; ~90 módulos sin validadores propios |
| HUERTA-01 · ACT-01 · DFT-01 · ELECTRON-01 | ⚠ **Vigentes** (sin cambio) | Referencias huérfanas Huerta, modelo de actividades, compromisos DFT, sin recuperación asistida desde `.bak` |
| UX-01 · KNOW-01 · a11y/compat/perf | ⚠ Pendientes (no auditados entonces) | Contraste WCAG AA hoy verificado por test; resto sigue abierto |

---

## 2. Seguridad — 0 hallazgos ALTA, 3 MEDIO, 8 BAJO

### MEDIO

| ID | Hallazgo | Dónde | Detalle |
|---|---|---|---|
| SEC-01 | **electron-updater sin firma ni verificación en cliente** | `main.js:75-98`, `ci.yml:64-68` | El NSIS se publica solo con `GITHUB_TOKEN`; sin `certificateFile`/`publisherName`, un release comprometido de la cuenta GitHub entrega código a clientes de escritorio sin verificación criptográfica local. Mitigado: `autoDownload:false`, diálogo explícito, `allowDowngrade:false` |
| SEC-02 | **Sanitizador HTML casero es la ruta real de producción** | `src/core-sanitize.js:59-78` | La rama DOMPurify nunca corre (DOMPurify no está en el bundle). Allowlist de 24 tags correcta pero sujeta a bypasses mXSS históricos; usada en impresión/PDF con notas de usuario. Mitigado: CSP `script-src 'none'` en la ventana PDF y `'self'` en la app |
| SEC-03 | **Contraseña maestra del cifrado en memoria clara y expuesta por API** | `src/core-cifrado.js:101-103` | `fijarClave()` guarda el password plano (no la CryptoKey derivada) y `cal13cifrado.clave()` lo devuelve a cualquier script; un XSS roba la clave de todos los respaldos cifrados. Además PBKDF2 núcleo 100k iteraciones (OWASP ≥600k; bitácoras usa 200k — inconsistente). **Hoy está dormido**: ninguna UI invoca `fijarClave()`; el cifrado operativo es el de bitácoras (200k + AES-GCM, correcto) |

### BAJO

1. PBKDF2 100k bajo estándar (`core-cifrado.js:52`) e iteraciones sin piso al descifrar bitácoras (`bitacoras-respaldo-modulo.js:423`).
2. `isSafeUrl` permite URLs protocolo-relativas `//evil.com` (`core-sanitize.js:17`) → inyección de enlaces externos, no ejecución.
3. Interpolación sin `escapeHtml` en `renderer.js:7344` (palacio de memoria) — mitigada: el campo es `<select>` fijo.
4. Sin `session.setPermissionRequestHandler` en Electron: mic/cámara se conceden sin prompt nativo en escritorio.
5. Fuga de `pdfWin` si `printToPDF` lanza (`main.js:262` — falta `destroy()` en el camino de error).
6. `style-src 'unsafe-inline'` en CSP (documentado; queda por los `style="..."` del HTML).
7. Fallback `document.write` en impresión web (`web-api.js:332`) con sanitizador regex si `sanitizeHTML` no cargó.
8. `respaldo-regalo/regalo-modulo.min.js` commiteado — excepción declarada a la política «min/ siempre regenerado».

### Positivo (verificado)

- **Electron endurecido:** `contextIsolation:true`, `nodeIntegration:false`, `sandbox:true`; `setWindowOpenHandler` deny + `openExternal` con whitelist http(s); escrituras confinadas y validadas (`esRutaPermitida`), atómicas (tmp+rename) con `.bak` y límite 15 MB; PowerShell via `-EncodedCommand` (sin inyección); preload minimalista (12 canales `invoke`).
- **CSP estricta y consistente** en 4 sitios (meta, `_headers`, `web/server.js`, `web/index.html`): `script-src 'self'` sin `unsafe-eval`; `connect-src` pincha solo open-meteo×2 + translate.google.com; HSTS preload, COOP/CORP, `X-Frame-Options`.
- **Service Worker same-origin**, sin open redirects; navegación network-first con fallback.
- **Cero telemetría y cero exfiltración:** sin `XMLHttpRequest`/`WebSocket`/`sendBeacon`/analytics. Única red externa: open-meteo con **coordenadas fijas de Penco** (no GPS del usuario) y frases de lección (no texto libre) a Google TTS — coherente con «sin rastreo», aunque TTS de Google es la única concesión de privacidad.
- **Sin secrets:** solo `donate.example.json` vacío en git; `donate.json` ignorado; el renderer además solo acepta URLs `https://` de ese archivo. CI con `pull_request` (no `_target`), permisos mínimos, actions por SHA, único token es el efímero `GITHUB_TOKEN`.
- **Importación/respaldo sólida:** `migrarYValidar` con límites (≤50 usuarios, ≤5 MB), rechazo de esquema futuro sin tocar datos, `replaceData` transaccional con verificación de lectura y rollback.
- `eval`/`new Function` **solo en scripts de build** (`verificar-paridad.cjs:8`, `test-qr-libs.cjs:10`), no en runtime — compatible con la CSP.

---

## 3. Calidad de código y arquitectura

**Higiene excepcional:** 0 código muerto (145 fuentes ↔ 119 MODS ↔ SW cruzados), 0 TODO/FIXME, 1 solo `console.log` en toda la app, 0 `eval`/`new Function`/`setTimeout("…")` en runtime, 1 `innerHTML +=` estático en todo `src/`. El trío QR (`qr-codec`/`qrcode-lib`/`jsqr-lib`) no es duplicación: codec propio + generador + decodificador, cada uno con rol y test round-trip.

**Deuda real:**

| ID | Hallazgo | Cifra |
|---|---|---|
| ARQ-01 | `renderer.js` monolito | **832 KB / 10.740 líneas** (~7,5 % del código); techo 1150 KB — `docs/arquitectura.md` ya planifica la partición (candidates `core-hogar`, `core-siembra`…) |
| ARQ-02 | Multi-módulo por archivo | `nuevos-modulos.js` 3.999 líneas; `territorio-fase2.js` 1.997; `core-calendario.js` 1.650; `matematicas-modulo.js` 1.544 |
| LINT-01 | ESLint configurado pero **no operativo** | `eslint.config.mjs` no está instalado ni corre en CI; además (a) se auto-lintea con error de parseo (`sourceType:module` en un `.mjs`), (b) `ios/**` no está en ignores y duplica hallazgos, (c) las reglas de seguridad (`no-eval`, `no-new-func`) solo existen aquí |
| LINT-02 | Catches vacíos pervasivos | ~100+ en `src/` (grep limit); 4.565 errores `no-empty` repo-wide. La mayoría defensivos (close/focus), pero algunos tragan fallos de `save()` — relevante tras las correcciones de persistencia. 15.639 avisos `no-var` (legado, cosmético) |
| SCRIPT-01 | `verificar-paridad.cjs` sin manejo de errores | `eval(src)` directo sin try/catch; un JSON ausente crashea con stack crudo (exit≠0, CI-safe pero feo) |
| TERR-02 | Validador de territorios incompleto y desconectado | `validar-territorios.cjs` exige 19 de 26 JSON y **no está en `npm test`/`test:ci`** (las 7 adiciones posteriores —actores, amenazas, apoyo-emergencia, bomberos, municipalidad, fauna-marina×2— solo las cubre el test genérico «parsea y no vacío») |

---

## 4. Dependencias y builds

- **`npm audit` prod:** 4 moderadas — cadena `glob`<14/minimatch/rimraf dentro de `@capacitor/cli` 6.x. **DEP-01:** `@capacitor/cli` (y `@capacitor/assets` como dev) son herramientas de build, no runtime; el APK es un bundle estático. Mover el CLI a `devDependencies` dejaría el audit de producción limpio; la actualización real es Capacitor 6→8 (breaking) o `npm audit fix --force`.
- **Dev:** `fast-uri` 3.0-3.1.8 moderada (vía esbuild chain), con fix no-breaking disponible.
- **Versiones consistentes:** package.json 1.9.1 = Android `versionName 1.9.1` (`versionCode 4`) = APK local 1.9.1; iOS usa variables de Xcode. `latest.yml` + electron-updater alineados con GitHub Releases.
- **CI:** `ci.yml` correcto — `test:ci` read-only, `npm audit --audit-level=high` como gate, Lighthouse informativo (`continue-on-error`), release solo con tag `refs/tags/v*` y `contents:write` acotado.
- **Binarios:** `dist-empaquetado/` (832,9 MB locales: 4 EXE, 2 APK, win-unpacked) **correctamente ignorado** por git — nunca se commitearon. `respaldo-regalo/` (0,08 MB) sí versionado a propósito: tombstone documentado de la sección «Regalo» retirada el 20-oct, con LEEME de restauración. Política de excepciones coherente.

---

## 5. Repositorio e historia

- **HIG-01:** 9 de los últimos ~15 commits son triviales (`rer`, `dfw`, `f`, `d`, `cruc`, `u`, `fd`, `khb`, `df`) — el propio `lint:commits` avisa en cada corrida. El hook `--strict` existe (`scripts/lint-commits.cjs --strict`) pero no está instalado como pre-commit. El commit que cerró toda la fase de datos se llama «rer»: la historia pierde la trazabilidad de los P0 corregidos.
- Pack de 19,2 MiB / 845 archivos rastreados — sano (los MP3 de cuentos ~0,9 MB existen duplicados en `assets/` y `web/assets/` por diseño de despliegue).
- Working tree limpio; `min/`, `web/` y `sw.js` en sincronía exacta con las fuentes.

---

## 6. Documentación (4 desincronizaciones menores)

| Dónde | Dice | Realidad |
|---|---|---|
| `README.md:75` | «17 JSON» por territorio | **26** en `penco/` |
| `docs/arquitectura.md:3-4` | 142 fuentes / 59 diálogos | **149 fuentes / 60 diálogos** |
| `README.md:64` | portable 1.9.0 «build anterior» | Localmente ya existe `Calendario 13 Lunas 1.9.1.exe` |
| `AUDITORIA-ESTADO-ACTUAL.md` | menciona job release «no probado en runner real» | Sigue siendo cierto; y el doc quedó 2 commits atrás |

Lo demás verificado: licencias duales (GPLv3 código / CC BY-NC-SA contenido) con archivos presentes, README de ejecución/build/iOS correcto, `informe-calendario.md` actualizado a 20-oct.

---

## 7. Presupuesto de performance — el semáforo está verde pero en amarillo técnico

| Métrica | Actual | Techo | Margen |
|---|---:|---:|---|
| JS raw total | 6.447 KB | 6.480 | **0,5 %** |
| gzip total | 2.163 KB | 2.220 | 2,6 % |
| index.html | 59 KB | 60 | 1,7 % |
| entradas SW CORE (mostrado) | 420 | 420 | 0 % (ver abajo) |
| styles.css | 147 KB | 150 | 2 % |

**PERF-01:** cualquier módulo nuevo rompe el gate de perf; la decisión pendiente es subir techos (documentando qué mide cada uno) o partir archivos antes. **CAL-02 (cosmético):** `build-sw.cjs:146` y `perf-budget.cjs` cuentan `'./` en **todo** el archivo (420) en vez de solo el bloque CORE (411 reales); el 420 mostrado no es la cifra real de entradas precacheadas — el check sigue siendo correcto porque compara texto completo.

---

## 8. Matriz priorizada de acción

### P1 — antes del próximo release
1. **SEC-01:** firmar el instalador NSIS (o activar atestación GitHub + `publisherName`) — la cadena de actualización es hoy el único camino de compromiso del cliente de escritorio.
2. **SEC-03:** al activar el cifrado del blob principal: derivar y retener la **CryptoKey** (no el password), subir PBKDF2 a ≥600k y unificar con el esquema de 200k de bitácoras. Mientras esté dormido, el riesgo es potencial.
3. **SEC-02:** bundlear DOMPurify para los flujos de impresión/PDF (la rama ya existe en `core-sanitize.js`, solo falta la librería).

### P2 — próximo ciclo de mantenimiento
4. **DEP-01:** mover `@capacitor/cli` a devDependencies (audit prod queda limpio); evaluar Capacitor 8 o `npm audit fix --force`; `npm audit fix` para `fast-uri`.
5. **PERF-01:** decidir techos vs partición de `renderer.js`/`nuevos-modulos.js` antes de que el gate rompa (JS al 99,5 %).
6. **TERR-02:** completar `validar-territorios.cjs` (26/26) y cablearlo a `test:ci`.
7. **LINT-01:** arreglar `eslint.config.mjs` (bloque `.mjs` con `sourceType:module`; ignores `ios/**`) y decidir si entra al CI como gate o aviso.
8. **CAL-02:** contar solo el bloque CORE en `build-sw.cjs`/`perf-budget.cjs`.
9. **Docs:** README (26 JSON, portable 1.9.1) y `docs/arquitectura.md` (149 fuentes, 60 diálogos).

### P3 — higiene continua
10. **HIG-01:** instalar `lint-commits --strict` como pre-commit; mensajes `feat:/fix:/chore:`.
11. **LINT-02:** eliminar catches vacíos de forma dirigida (empezando por los que envuelven `save()`), no masiva.
12. Bajos de seguridad: `setPermissionRequestHandler` + `pdfWin.destroy()` en catch; bloquear `//` en `isSafeUrl`; retirar el fallback `document.write`.
13. **ARQ-01/02:** continuar la partición según `docs/arquitectura.md` (candidatos ya listados).
14. Vigentes de la auditoría anterior que siguen esperando diseño funcional: HUERTA-01, ACT-01, DFT-01, ELECTRON-01, MIG-02 (validadores por módulo), UX-01, KNOW-01, a11y con lector de pantalla real.

---

## 9. Conclusión

Desde la auditoría del 2-nov el proyecto **subió de forma objetiva**: cerró su único P0
abierto (CAL-01) con una regla cultural documentada y probada, cerró MODULE-01 con un
test de paridad fuente↔MODS↔SW, mantuvo la suite en verde absoluto (125/125) y no
introdujo ningún hallazgo nuevo de severidad alta. El costo de esos commits fue de
higiene: la historia reciente es ilegible (9 commits triviales) y el presupuesto de
performance quedó al ras. La superficie de seguridad es pequeña y está bien
construida; los tres medianos que quedan (firma del updater, DOMPurify, manejo de la
contraseña maestra) son acotados y tienen ruta de remediación clara. Ninguno exige
acción inmediata hoy — pero SEC-01 debería preceder a la próxima publicación con
electron-updater activo.
