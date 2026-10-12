# Licencias — Calendario de las 13 Lunas · Mari Küla Küyen

Este proyecto usa **licencia dual**, según el tipo de obra:

| Obra | Licencia |
|---|---|
| **CÓDIGO** (Web, APK Android, .exe Windows: HTML, CSS, JS, `sw.js`, `manifest.json`, `main.js`, `preload.js`, scripts de `scripts/`, configuración de empaquetado) | **GNU General Public License v3.0 o posterior (GPLv3+)** — ver archivo `COPYING` |
| **CONTENIDO CREATIVO** (diseño, textos, relatos de las lunas, ilustraciones, iconos propios, guías, cuentos, datos territoriales redactados) | **Creative Commons Atribución-NoComercial-CompartirIgual 4.0 Internacional (CC BY-NC-SA 4.0)** — https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es |

## 1. Código: GNU GPLv3 o posterior

- Puedes **usar, estudiar, modificar y compartir** el código (Web, APK, .exe) libremente.
- Si **distribuyes** el programa (original o modificado, gratis o por un precio), debes:
  1. Mantener los avisos de copyright y de licencia,
  2. Entregar o facilitar el **código fuente correspondiente** bajo la misma licencia GPLv3,
  3. Marcar tus cambios con fecha (GPLv3 §5a),
  4. Incluir una copia de la licencia (`COPYING`).
- Las versiones modificadas deben seguir siendo **GPLv3** (copyleft fuerte): nadie puede apropiarse del código común cerrándolo (§5c).
- **Sin garantía** (§15-16): el programa se entrega "tal cual".
- Texto oficial completo: archivo **`COPYING`** incluido en este repositorio y en cada distribución. También en https://www.gnu.org/licenses/gpl-3.0.html
- Aviso SPDX en los metadatos: `GPL-3.0-or-later`.

### Cómo atribuir el código

Conserva en cada archivo (o al menos en la portada / "Acerca de"):

> Calendario de las 13 Lunas — Mari Küla Küyen (Penco, Chile).
> Copyright (C) 2026 Semillero Consciente (semilleroconsciente@gmail.com).
> Este programa es software libre: puedes redistribuirlo y/o modificarlo bajo los
> términos de la GNU General Public License v3 (o posterior).
> Ver archivo COPYING. Sin garantía alguna.

## 2. Contenido creativo: CC BY-NC-SA 4.0

Abarca: nombres y relatos de las lunas en mapuzugun, textos de guías y módulos,
cuentos, ilustraciones de las lunas, iconos y diseño propio, y los datos
territoriales redactados (`data/territorios/`).

- **BY (Atribución):** da crédito al proyecto y al autor, enlaza la licencia e indica si hiciste cambios.
- **NC (NoComercial):** no uses el contenido con fines primordialmente comerciales
  (ej: venderlo, incluirlo en publicidad de pago) sin permiso previo escrito.
  Los usos comunitarios, educativos y sin fines de lucro sí están permitidos.
- **SA (CompartirIgual):** si adaptas o remezclas el contenido, comparte tu versión
  con la **misma licencia** CC BY-NC-SA 4.0.
- Texto legal completo: https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.es
  (resumen en español: https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es).
  Ver también `LICENCIA-CONTENIDO-CC-BY-NC-SA-4.0.md`.

### Cómo atribuir el contenido

Ejemplo mínimo al reutilizar un texto o ilustración:

> "Luna 3 · texto e ilustración" — Calendario de las 13 Lunas · Mari Küla Küyen,
> © 2026 Semillero Consciente, Penco (Chile).
> Licencia CC BY-NC-SA 4.0 — https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es
> [Indicar cambios realizados, si los hay.]

## 3. Excepciones (obras de terceros incluidas)

- `qrcode-lib.js` / `jsqr-lib.js` y similares bajo licencia **MIT** de sus autores:
  se conservan sus avisos originales. La licencia MIT es compatible con GPLv3,
  por lo que el conjunto distribuido sigue siendo GPLv3 para el código propio.
- Datos de servicios externos en vivo (clima Open-Meteo, mareas SHOA) pertenecen a
  sus fuentes y se consultan bajo sus propios términos; no forman parte de esta licencia.
- Tus **notas y bitácoras personales** guardadas en tu dispositivo son **tuyas**:
  ninguna licencia del proyecto las reclama.

## 4. Dónde verlo en la app

- Portada (pie de página) y diálogo **❓ Guía → Licencias**,
  sección **🌐 Código Abierto → Licencias / Este proyecto**:
  muestran el resumen dual y los enlaces a `COPYING` y a la licencia CC.
- `package.json` declara `"license": "GPL-3.0-or-later"`.

## 5. Preguntas rápidas

- **¿Puedo copiar la app a otra comuna?** Sí. Adapta los datos territoriales y
  publica tu versión con la misma licencia dual (código GPLv3 + contenido CC BY-NC-SA 4.0),
  manteniendo el crédito. Ver `open-source-modulo.js` (pestaña Proyecto) con los 6 pasos.
- **¿Puedo cobrar por instalarla o dar un taller con ella?** Cobrar por el acto de
  distribuir copias o por servicios (instalación, taller) está permitido en ambas
  licencias; lo que no permite el componente NC es explotar comercialmente el
  *contenido creativo* (ej: vender las ilustraciones/textos como producto).
- **¿Puedo cerrar el código y venderlo como mío?** No: el copyleft GPLv3 lo impide.
  Las mejoras distribuidas deben volver libres con la misma licencia.
