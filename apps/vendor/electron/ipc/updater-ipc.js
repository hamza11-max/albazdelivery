const { ipcMain } = require('electron')

function registerUpdaterIPCHandlers({
  checkForUpdates,
  startDownload,
  installUpdate,
  remindLater,
  getChannel,
  setChannel,
}) {
  ipcMain.handle('updater-check', async () => checkForUpdates())
  ipcMain.handle('updater-download', async () => startDownload())
  ipcMain.handle('updater-install', () => installUpdate())
  ipcMain.handle('updater-get-channel', () => getChannel())
  ipcMain.handle('updater-set-channel', (_event, channel) => setChannel(channel))

  ipcMain.on('start-update', () => {
    startDownload()
  })

  ipcMain.on('install-update', () => {
    installUpdate()
  })

  ipcMain.on('remind-later', () => {
    remindLater()
  })
}

module.exports = {
  registerUpdaterIPCHandlers,
}
