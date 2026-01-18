const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
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

function createMenu() {
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Sair',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { label: 'Desfazer', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Refazer', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: 'Cortar', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copiar', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Colar', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Selecionar Tudo', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: 'Exibir',
      submenu: [
        { label: 'Recarregar', accelerator: 'F5', role: 'reload' },
        { label: 'Forçar Recarregar', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: 'Ferramentas de Desenvolvimento', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Tela Cheia', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Janela',
      submenu: [
        { label: 'Minimizar', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: 'Maximizar', role: 'maximize' },
        { label: 'Fechar', accelerator: 'CmdOrCtrl+W', role: 'close' }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre Filesfy',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Sobre Filesfy',
              message: 'Filesfy - Recuperação de Dados',
              detail: 'Versão 1.0.0\n\nUma aplicação de desktop para recuperação segura de arquivos deletados.\n\n© 2026 Filesfy Inc. Todos os direitos reservados.'
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
  createWindow()
  createMenu()
})

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
