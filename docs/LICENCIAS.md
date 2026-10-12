# Licencias del proyecto (nota para desarrolladoras/es)

Licencia dual — ver `LICENSE.md` (raíz):

- **Código** (Web, APK, .exe) → **GPL-3.0-or-later** (texto en `COPYING`).
- **Contenido creativo** (diseño, textos, ilustraciones de las lunas) → **CC BY-NC-SA 4.0**
  (ver `LICENCIA-CONTENIDO-CC-BY-NC-SA-4.0.md`).

## Reglas operativas

1. **Archivos nuevos de código propio**: agrégalos con el encabezado SPDX:
   `// SPDX-License-Identifier: GPL-3.0-or-later`
   (en CSS: `/* SPDX-License-Identifier: GPL-3.0-or-later */`).
   No quites avisos de copyright de terceros (`qrcode-lib.js`, `jsqr-lib.js`: MIT de sus autores, compatible con GPLv3).
2. **Contenido nuevo** (textos, imágenes, relatos): se entiende bajo CC BY-NC-SA 4.0 salvo
   indicación contraria en el propio archivo. Marca autoría y fecha.
3. **Empaquetado**: `package.json → license: "GPL-3.0-or-later"` y `build.files` debe
   incluir `COPYING`, `LICENSE.md` y `LICENCIA-CONTENIDO-CC-BY-NC-SA-4.0.md` para que
   viajen en el .exe portable. La carpeta `web/` (PWA/APK) los sincroniza vía `sync:web`.
4. **UI**: el aviso dual vive en el pie de `index.html` (`#licFooter`) y en el diálogo
   `licenciasDialog` (plantilla en `templates/`) + sección 🌐 Código Abierto
   (`open-source-modulo.js`). Si cambias textos de licencia, actualiza los tres lugares
   y regenera (`build:tpl`, `build:min`, `build:sw`, `sync:web`).
5. **Dependencias**: al agregar una, verifica que su licencia sea compatible con GPLv3
   para distribuir (MIT, Apache-2.0, BSD, LGPL: sí; revisar casos con NC/ND o EULA).
