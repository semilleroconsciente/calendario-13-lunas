'use strict';
// ============================================================================
// tests/territorio-loader.test.js — TERR-01.
//
// Comprueba que el loader no mezcle territorios en silencio: un id no listado
// vuelve al default marcado como degradado y un fallback por archivo queda
// registrado en Territorio.origen/motivo.
// Uso: node --test tests/  (o npm test)
// ============================================================================
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { leerFuente, memoriaStorage } = require('./helpers.cjs');

const ARCHIVOS = [
  'territorio.json', 'lunas.json', 'especies/aves.json', 'especies/bosque.json',
  'especies/intermareal.json', 'especies/flora.json', 'historia/historia.json',
  'historia/sectores.json', 'historia/guia.json', 'historia/historia-bosque.json',
  'historia/companeros-bosque.json', 'historia/aves-bosque.json',
  'historia/historia-aves.json', 'historia/historia-pesca.json',
  'especies/fauna-marina.json', 'historia/historia-fauna-marina.json',
  'eventos.json', 'cultivos/asociaciones.json', 'cultivos/preparados.json',
  'talleres.json', 'municipalidad.json', 'bomberos.json', 'apoyo-emergencia.json',
  'consejos-bosque.json', 'actores.json', 'amenazas.json',
];

function contenidoCompleto(id, nombre) {
  const mapa = {};
  for (const f of ARCHIVOS) mapa[f] = {};
  mapa['territorio.json'] = {
    id,
    nombre,
    coordenadas: { lat: -36.6, lng: -72.9 },
    intro: { lugar: 'Lugar ' + nombre },
  };
  mapa['lunas.json'] = {
    estaciones: {}, lunas: [], dft: {}, siembraFases: {},
    siembraLunas: {}, efemeridesLocales: {}, animo: [],
  };
  mapa['especies/aves.json'] = [{ nombre: 'ave-' + id }];
  mapa['especies/bosque.json'] = [{ nombre: 'bosque-' + id }];
  mapa['especies/intermareal.json'] = { especies: [], consejos: [] };
  mapa['especies/flora.json'] = { intro: '', especies: [], links: [] };
  mapa['eventos.json'] = { comuna: [], astronomicos: [] };
  mapa['consejos-bosque.json'] = [];
  return mapa;
}

function cargarLoader(opciones) {
  const opts = opciones || {};
  const archivos = opts.archivos || {};
  const indice = opts.indice || { default: 'penco', disponibles: ['penco'] };
  const aviso = { hidden: true, textContent: '' };
  const sb = {
    console,
    localStorage: memoriaStorage(),
    location: { search: opts.search || '' },
    aviso,
    document: {
      dispatchEvent: () => {},
      addEventListener: () => {},
      getElementById: (id) => (id === 'territorioAviso' ? aviso : null),
    },
    CustomEvent: class CustomEvent {
      constructor(type, init) { this.type = type; this.detail = init && init.detail; }
    },
    fetch: async (url) => {
      let limpio = String(url).replace(/^data\/territorios\//, '');
      // Quita el id del territorio: penco/especies/aves.json -> especies/aves.json
      const conId = /^[^/]+\/(.+)$/.exec(limpio);
      if (conId) limpio = conId[1];
      if (limpio === 'index.json') return { ok: true, json: async () => indice };
      if (Object.prototype.hasOwnProperty.call(archivos, limpio)) {
        return { ok: true, json: async () => archivos[limpio] };
      }
      return { ok: false, status: 404, json: async () => null };
    },
  };
  sb.window = sb;
  sb.PENCO = { lat: -36.6, lng: -72.9 };
  sb.ESTACIONES = {};
  sb.MOONS = [];
  sb.DFT = {};
  sb.INTRO = { lugar: 'Penco' };
  sb.MOODS = [];
  sb.EFEMERIDES = {};
  sb.SIEMBRA = {};
  sb.SIEMBRA_LUNAS = {};
  sb.AVES_PENCO = [{ nombre: 'ave-fallback-penco' }];
  sb.BOSQUE_NATIVO_PENCO = [{ nombre: 'bosque-fallback-penco' }];
  sb.INTERMAREAL_PENCO = [];
  sb.CONSEJOS_INTERMAREAL = [];
  sb.CONSEJOS_BOSQUE = [];
  sb.EVENTOS_COMUNA_PENCO = [];
  sb.EVENTOS_ASTRONOMICOS = {};
  sb.ASOCIACIONES_CULTIVOS = {};
  sb.PREPARADOS_ORGANICOS = {};
  vm.createContext(sb);
  vm.runInContext(leerFuente('territorio.js'), sb, { filename: 'territorio.js' });
  return sb;
}

describe('Loader territorial: aislamiento y fallback identificado', () => {
  it('carga un territorio alternativo completo sin marcar degradación', async () => {
    const sb = cargarLoader({
      search: '?territorio=otro',
      indice: { default: 'penco', disponibles: ['penco', 'otro'] },
      archivos: contenidoCompleto('otro', 'Otro'),
    });
    await sb.window.Territorio.listo;
    assert.equal(sb.window.Territorio.id, 'otro');
    assert.equal(sb.window.Territorio.degradado, false);
    assert.equal(sb.window.Territorio.datos.territorio.nombre, 'Otro');
    assert.equal(sb.window.Territorio.datos.aves[0].nombre, 'ave-otro');
    assert.equal(sb.aviso.hidden, true, 'sin degradación no debe mostrarse el aviso');
  });

  it('un id no listado vuelve al default y queda marcado (no mezcla silenciosa)', async () => {
    const sb = cargarLoader({
      search: '?territorio=fantasma',
      indice: { default: 'penco', disponibles: ['penco'] },
      archivos: contenidoCompleto('penco', 'Penco'),
    });
    await sb.window.Territorio.listo;
    assert.equal(sb.window.Territorio.id, 'penco');
    assert.equal(sb.window.Territorio.solicitado, 'fantasma');
    assert.equal(sb.window.Territorio.degradado, true);
    assert.equal(sb.window.Territorio.motivo, 'territorio-no-listado');
    assert.equal(sb.aviso.hidden, false, 'la degradación debe avisarse en la interfaz');
    assert.ok(sb.aviso.textContent.indexOf('fantasma') >= 0, sb.aviso.textContent);
  });

  it('un archivo faltante se identifica como fallback y marca degradación', async () => {
    const archivos = contenidoCompleto('penco', 'Penco');
    delete archivos['especies/aves.json'];
    const sb = cargarLoader({
      search: '?territorio=penco',
      indice: { default: 'penco', disponibles: ['penco'] },
      archivos,
    });
    await sb.window.Territorio.listo;
    assert.equal(sb.window.Territorio.origen.AVES_PENCO, 'fallback');
    assert.equal(sb.window.Territorio.degradado, true);
    assert.ok(sb.window.Territorio.motivo.indexOf('AVES_PENCO') >= 0, 'motivo: ' + sb.window.Territorio.motivo);
    assert.equal(sb.window.Territorio.datos.aves[0].nombre, 'ave-fallback-penco');
    assert.equal(sb.aviso.hidden, false);
    assert.ok(sb.aviso.textContent.indexOf('respaldo integrado') >= 0, sb.aviso.textContent);
  });
});
