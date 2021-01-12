const { BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

module.exports = function createWindow(finishLoad_callback){

  mainWindow = new BrowserWindow({
    width: 300,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'shared', 'preload.js')
    }
  });

  mainWindow.menuBarVisible = false;

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.webContents.on('did-finish-load', finishLoad_callback || (() => {}));

  return mainWindow;

}