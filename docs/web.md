# web/ solo-web — qué es producto y qué es documento

`web/` es la copia desplegable (Pages + Capacitor `webDir`). `sync-web.cjs`
solo sincroniza raíz → web/ y **respeta** estos archivos propios:

## Producto (runtime, sí se despliega)
- `server.js` — servidor estático local (seguro, gzip, anti-traversal, CSP
  fase 1). Puerta de `check:perf` y del smoke http+SW.

## Documento / ayuda local (no van a tiendas, sí al zip/Pages)
- `LEEME.txt` — cómo ver la app en PC y celular (misma WiFi).
- `Servir Web.bat` — launcher local (doble clic → server.js + navegador).
- `GUIA-CAMBIOS-MANUALES.md` — editar contenido sin compilar.

Regla: nada de lo solo-web se edita en la raíz ni lo pisa `--fix`.
