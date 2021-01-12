const EventEmitter = require('events');
const util = require('util');
const usb = require('usb');
const os = require('os');

function USB(vid, pid){
  EventEmitter.call(this);

  this.device = null;

  if (vid && pid){
    this.device = usb.findByIds(vid, pid);
  }
  else if (vid){
    this.device = vid;
  }
  else{
    let devices = USB.findPrinters();
    if (devices && devices.length) this.device = devices[0];
  }

  if (!this.device) throw new Error('Can not find printer.');

  usb.on('detach', device => {
    if (device = this.device){
      this.emit('detach', device);
      this.emit('disconnect', device);
      this.device = null;
    }
  });

}

util.inherits(USB, EventEmitter);

USB.IFACE = {
  AUDIO: 0x01,
  HID: 0x03,
  PRINTER: 0x07,
  HUB: 0x09
};

USB.getListPorts = function(){
  return usb.getDeviceList();
};

USB.findPrinters = function(){
  return usb.getDeviceList().filter(function(device){
    try{
      return device.configDescriptor.interfaces.filter(function(iface){
        return iface.filter(function(conf){
          return conf.bInterfaceClass === USB.IFACE.PRINTER;
        }).length;
      }).length;
    }
    catch(e){
      return false;
    }
  });
};

USB.prototype.open = function(callback){
  let counter = 0;
  this.device.open();

  this.device.interfaces.map(iface => {
    iface.setAltSetting(iface.altSetting, () => {
      try{
        if ('win32' !== os.platform() && iface.isKernelDriverActive()){
          try{
            iface.detachKernelDriver();
          }
          catch(e){
            console.error("[ERROR] Could not detatch kernel driver: %s", e);
          }
        }

        iface.claim();
        iface.endpoints.filter(endpoint => {
          if (endpoint.direction == 'out' && !this.endpoint){
            this.endpoint = endpoint;
          }
        });

        if (this.endpoint){
          this.emit('connect', this.device);
          typeof callback === 'function' && callback(null, this);
        }
        else if (++counter === this.device.interfaces.length && !this.endpoint){
          typeof callback === 'function' && callback(new Error('Can not find endpoint from printer'));
        }
      }
      catch(e){
        typeof callback === 'function' && callback(e);
      }
    });
  });
};

USB.prototype.write = function(data, callback){
  this.emit('data', data);
  this.endpoint.transfer(data, callback);
  return this;
};

USB.prototype.close = function(callback){
  if (this.device){
    try{
      this.device.close();
      usb.removeAllListeners('detach');
      typeof callback === 'function' && callback(null);
      this.emit('close', this.device);
    }
    catch(e){
      typeof callback === 'function' && callback(e);
    }
  }
  else{
    typeof callback === 'function' && callback(null);
  }
};

module.exports = USB;