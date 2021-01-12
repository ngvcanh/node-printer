const EventEmitter = require('events');
const util = require('util');

function Serial(path, options, callback){
  
  EventEmitter.call(this);
  this.path = path;

  this.options = {
    baudRate: 9600,
    autoOpen: false
  };

  if (typeof options === 'function'){
    callback = options;
  }
  else{
    Object.assign(this.options, options);
  }

  const SerialPort = require('serialport');
  this.device = new SerialPort(this.path, this.options, callback);

  var self = this;
  this.device.on('close', function(){
    self.emit('disconnect', self.device);
  });
}

util.inherits(Serial, EventEmitter);

Serial.prototype.open = function(callback){
  this.device.open(callback);
  return this;
};

Serial.prototype.close = function(callback){
  var self = this;

  this.device.drain(function(){
    self.device.flush(function(err){
      setTimeout(function() {
        err ? callback && callback(err, self.device) : 
        self.device.close(function(err){
          self.device = null;
          return callback && callback(err, self.device);
        });
      }, "number" === typeof timeout && 0 < timeout ? timeout : 0);
    });
  });

  return this;
};

Serial.prototype.write = function(data, callback){
  this.device.write(data, callback);
  return this;
};

Serial.prototype.read = function(callback){
  this.device.on('data', callback);
  return this;
};

Serial.getListPorts = function(){
  return require('serialport').list().catch(() => []);
};

module.exports = Serial;