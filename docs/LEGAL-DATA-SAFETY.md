# Legal · Data Safety (Play) + Checklist Ley 21.719 — Calendario 13 Lunas

> Estado: Fase 1-2 implementadas (2026-10-14). Este archivo es guía operativa, no va a la app.

## 1. Lo implementado hoy (Fase 1-2)

- `legal/terminos.html`, `legal/privacidad.html`, `legal/cookies.html` (standalone, offline, CSP `script-src 'none'`)
  + espejos en `web/legal/` + precache en `sw.js` CORE + `sitemap.xml` + footer `index.html#licFooter`.
- `legal-modulo.js` (Comunidad → ⚖️ Legal): resumen + links + Exportar + Borrar todo + aceptación `cal13-legal-v1`.
- `onboarding-modulo.js` → `cal13-onboarding-v2` (5 pasos, incluye paso ⚖️ Legal; se re-muestra 1 vez).
- `scripts/sync-web.cjs` + `scripts/build-sw.cjs` + `package.json` (`legal/*.html`) actualizados.
- Verificado: `check:min`, `check:sw`, `check:web`, `check:syntax` OK.

## 2. Play Console · Data Safety (cuando publiques el APK)

URL política: `https://calendario-13-lunas.pages.dev/legal/privacidad.html`

Respuestas sugeridas (ajusta si agregas analytics/cuentas):

- ¿Recoge o comparte datos? **Sí (limitado)** — la app consulta clima (Open-Meteo) y donaciones
  (MercadoPago/PayPal). Las bitácoras NO salen del dispositivo.
- Tipos recogidos: **Ubicación aproximada** (comuna Penco para clima, opcional), **IDs de dispositivo /
  diagnósticos** por el OS/tienda (no por nosotros). Salud/ciclo/finanzas: **solo en dispositivo,
  no se recogen ni comparten** (marca "No se recoge" para esos tipos).
- Compartido con terceros: Open-Meteo (clima), MercadoPago/PayPal (donación), Cloudflare (hosting).
- Cifrado en tránsito: sí (HTTPS). Eliminación: sí (botón Borrar + desinstalar).
- Menores: app familiar, sin cuentas; el adulto supervisa.

## 3. Checklist Ley 21.719 (exigible 01-12-2026) — 6 semanas

- [ ] Designar responsable de datos (nombre + correo en `legal/privacidad.html` — hoy: Semillero).
- [ ] Procedimiento ARCOP 15 días: bandeja semilleroconsciente@gmail.com + plantilla respuesta.
- [ ] Registro interno de tratamiento (1 hoja: qué, dónde, por qué, hasta cuándo).
- [ ] Revisar proveedores: Open-Meteo, Cloudflare, MercadoPago, PayPal, GitHub (links a sus políticas OK).
- [ ] Contratos/encargos si externalizas (hoy no hay encargados con acceso a bitácoras: declarar).
- [ ] Brechas: protocolo (contener, evaluar riesgo, notificar Agencia + afectados si hay riesgo alto).
- [ ] Revisión anual de estos textos por abogado (anotar fecha próxima: oct-2027).
- [ ] SII: si las donaciones se vuelven habituales, consultar tributación / personalidad jurídica.

## 4. Disclaimers salud — estado

Ya con descargo: medic, lawen, firstAid, psico, menstrual, breath, violence, metodos, nutri (básico).
Pendiente fino (no bloquea, mejora): tarot/astro/numerología/oráculo → agregar "contenido simbólico,
sin validez predictiva"; natación/duelo/adicciones → reforzar "busca ayuda profesional".
Recomendación: hacerlo en la próxima tanda de contenido, 1 línea por template.

## 5. Comandos de verificación

```
npm run build:min -- --fix   # tras editar src/*-modulo.js
npm run build:sw -- --fix    # tras tocar index.html / boot-modulos.js / legal/
npm run sync:web -- --fix    # propaga a web/ (Capacitor + Pages)
node scripts/minify.cjs --check && node scripts/build-sw.cjs && node scripts/sync-web.cjs && node scripts/check-syntax.cjs
```
