# Cómo replicar la app en otro territorio

Los datos de cada territorio viven en `data/territorios/<id>/`.
Penco (`penco`) es el territorio de referencia.

## Crear un territorio nuevo (ej: `maule`)

Opción A — con script (recomendado):

```bash
node scripts/nuevo-territorio.cjs maule "Maule"
```

Opción B — manual:

```bash
cp -r data/territorios/penco data/territorios/maule
```

Luego:

1. Edita `data/territorios/maule/territorio.json`:
   `id`, `nombre`, `region`, `coordenadas {lat,lng}`, `lugar`, `descripcion`.
2. Edita las lunas (`lunas.json`): nombres, traducciones, descripciones
   y `siembraLunas` según tu clima local.
3. Reemplaza especies:
   `especies/aves.json`, `especies/bosque.json`,
   `especies/intermareal.json`, `especies/flora.json`.
4. Reescribe historia:
   `historia/historia.json`, `sectores.json`, `guia.json`,
   `historia-bosque.json`, `companeros-bosque.json`,
   `aves-bosque.json`, `historia-aves.json`, `historia-pesca.json`.
5. Ajusta `eventos.json` (fiestas locales), `cultivos/*.json`,
   `talleres.json`, `consejos-bosque.json`.
6. Agrega `"maule"` a `data/territorios/index.json > disponibles`.
7. Abre la app con `?territorio=maule`
   (ej: `index.html?territorio=maule` o `...pages.dev/?territorio=maule`).
   Queda guardado en `localStorage 'territorioActual'`.

## Reglas

- La **lógica** (JS/HTML/CSS) no se toca: solo los JSON.
- Cada JSON es opcional: si falta o falla, la app usa el
  fallback embebido (Penco) y sigue funcionando.
- Los relatos de vecinos (`userData().pencoSectorRelatos`, bitácoras)
  son privados por usuario y NO van en estos JSON.
- Valida tus JSON antes de publicar:
  `node scripts/validar-territorios.cjs`
