# Guía Clonar Territorio y Legado (semilla para quienes vendrán)

Cómo llevar este regalo a otra comuna sin depender de su autor, y cómo dejar legado a 10-30 años.

## 1. Clonar a otra comuna (30 minutos, sin programar mucho)

```bash
node scripts/nuevo-territorio.cjs maule "Maule"
# 1. Edita data/territorios/maule/territorio.json (nombre, coords, mareas, clima)
# 2. Ajusta especies, historia y cultivos del nuevo JSON
# 3. Abre con ?territorio=maule para probar
node scripts/validar-territorios.cjs
npm test
```

Reglas:
- Nunca edites `data/territorios/penco/` para adaptar otra comuna: clona, no sobrescribas.
- Formatos abiertos siempre: `.json`, `.md`, `.ogg`/`.webm` para audio/video, `.pdf` para impresos.
- Nombres claros, sin jerga. Coordenadas y fuentes (SHOA, Open-Meteo, municipio) citadas.

## 2. Cápsula del tiempo (en la app: 🎁 Regalo → Semilla)

- Cada familia deja 1 mensaje/audio para 10 años: qué sueña para el territorio.
- Queda local + exportable (`capsula-13lunas.json`). Una copia puede ir a sede vecinal en pendrive.
- Formato: `{ para, fecha, abre, texto, luna }`. Sin apellido de niños.

## 3. Respaldo comunitario (sin nube obligatoria)

1. En la app: Comunidad → App → Respaldo (exporta) / Restaurar.
2. En 🎁 Regalo → Semilla: botón "Exportar semilla" junta memorias + diario + cápsula en 1 JSON.
3. Copias: 1 en el celular, 1 en pendrive de sede/escuela, 1 impresa (kit de 1 luna) si se quiere.
4. Para archivo público serio: Internet Archive / Zenodo / Omeka S (ver docs/PROPOSITO-REGALO.md § herramientas).

## 4. Kit de 1 luna en papel (sin celular)

- En 🎁 Regalo → Puente: botón "🖨️ Imprimir luna" genera 1 hoja (luna actual, fase, siembra, 1 actividad, 1 memoria).
- Sirve para escuela sin internet, junta de vecinos y mayores sin smartphone.
- Plantilla vive en código (no suma archivo precacheado): se imprime con el diálogo del navegador.

## 5. Herramientas libres recomendadas (resumen operativo)

- Hacer y grabar: Audacity + Whisper local, OBS + Kdenlive/Shotcut, Krita/GIMP/Inkscape/Penpot.
- Aprender offline: Kolibri + Kiwix + Calibre, Zotero + Joplin.
- Territorio: QGIS + uMap + OpenStreetMap.
- Pasar archivos sin nube: Syncthing, Nextcloud, CryptPad, Jitsi/Element para conversar.
- Accesibilidad: NVDA + Lighthouse + Axe. Probar con una persona mayor real cada luna.
