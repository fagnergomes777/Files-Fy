const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  listDevices: () => ipcRenderer.invoke('list-devices'),
  startScan: (deviceId, fileType) => ipcRenderer.invoke('start-scan', { deviceId, fileType }),
  chooseDestination: () => ipcRenderer.invoke('choose-destination'),
  recoverFiles: (files, destination) => ipcRenderer.invoke('recover-files', { files, destination })
})
