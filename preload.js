// Calendario de las 13 Lunas · Mari Küla Küyen — Copyright (C) 2026 Semillero Consciente.
// CÓDIGO bajo GNU GPLv3 o posterior (ver COPYING). Sin garantía.
// SPDX-License-Identifier: GPL-3.0-or-later
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadData: () => ipcRenderer.invoke('data:load'),
  saveData: (json) => ipcRenderer.invoke('data:save', json),
  dataPath: () => ipcRenderer.invoke('data:path'),
  exportPDF: (html) => ipcRenderer.invoke('export:pdf', html),
  createShortcut: (pngB64) => ipcRenderer.invoke('shortcut:create', pngB64),
  backupSave: (json, fileName) => ipcRenderer.invoke('backup:save', json, fileName),
  backupOpen: () => ipcRenderer.invoke('backup:open'),
  imageSave: (dataUrl, fileName) => ipcRenderer.invoke('image:save', dataUrl, fileName),
  loadDonate: () => ipcRenderer.invoke('donate:load'),
  openExternal: (url) => ipcRenderer.invoke('openExternal', url)
});
