const { app, ipcMain } = require('electron');
const createWindow = require('./createWindow');
const channels = require('./shared/channels');
const { Serial, USB } = require('..');

let mainWindow;

const finishLoad_callback = function(event){
  Serial.getListPorts().then(listPorts => {
    event.sender.send(channels.DEVICE_PORTS, {
      COM: listPorts,
      USB: USB.findPrinters().map(device => ({ 
        deviceAddress: device.deviceAddress, 
        portNumbers: device.portNumbers,
        idVendor: device.deviceDescriptor.idVendor,
        idProduct: device.deviceDescriptor.idProduct
      }))
    });
  });
};

app.whenReady().then(() => {
  mainWindow = createWindow(finishLoad_callback);

  ipcMain.on(channels.PRINT_SERIAL, function(event, data){
    event.preventDefault();
    require('./action.serial')(data);
  });

  ipcMain.on(channels.PRINT_USB, function(event, data){
    event.preventDefault();
    require('./action.usb')(data);
  });

});
app.on('activate', () => !mainWindow && (mainWindow = createWindow(finishLoad_callback)));