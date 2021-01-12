const { contextBridge, ipcRenderer } = require('electron');
const channels = require('./channels');

contextBridge.exposeInMainWorld('PrinterApi', {

    channels,

    request: function(channel, data){
      ipcRenderer.send(channel, data);
    },

    response: function(channel, callback){
      ipcRenderer.on(channel, callback);
    },

    responseOnce: function(channel, callback){
      ipcRenderer.once(channel, callback);
    }

});