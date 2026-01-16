const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')

let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    resizable: false,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.loadFile(path.join(__dirname, '../src/index.html'))

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

ipcMain.handle('list-devices', async () => {
  // MOCK: aqui você depois implementa lógica real para listar HDs/pendrives
  return [
    { id: 'C', label: 'Disco Local (C:)', size: '256 GB', type: 'HD interno' },
    { id: 'D', label: 'Dados (D:)', size: '1 TB', type: 'HD interno' },
    { id: 'USB1', label: 'Pendrive (E:)', size: '32 GB', type: 'Pendrive' }
  ]
})

ipcMain.handle('start-scan', async (event, { deviceId, fileType }) => {
  // MOCK: simula busca (aqui entraria sua lógica de recuperação real)
  console.log('Iniciando scan em', deviceId, 'para', fileType)

  // Exemplo de “resultados encontrados”
  const results = [
    {
      id: 1,
      name: 'video_familia.mp4',
      type: 'Vídeo',
      size: '700 MB',
      path: deviceId + ':\\Videos\\video_familia.mp4',
      status: 'Bom'
    },
    {
      id: 2,
      name: 'musica_favorita.mp3',
      type: 'Música',
      size: '5 MB',
      path: deviceId + ':\\Musicas\\musica_favorita.mp3',
      status: 'Bom'
    },
    {
      id: 3,
      name: 'foto_viagem.jpg',
      type: 'Foto',
      size: '3 MB',
      path: deviceId + ':\\Fotos\\foto_viagem.jpg',
      status: 'Crítico'
    }
  ]

  return {
    progress: 100,
    files: results
  }
})

ipcMain.handle('choose-destination', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory']
  })
  if (result.canceled || !result.filePaths.length) {
    return null
  }
  return result.filePaths[0]
})

ipcMain.handle('recover-files', async (event, { files, destination }) => {
  // MOCK: aqui você faz a cópia real dos arquivos recuperados para "destination"
  console.log('Recuperando', files.length, 'arquivos para', destination)

  return {
    recovered: files.length,
    failed: 0
  }
})
