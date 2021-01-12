module.exports = function action_printSerial(deviceInfo){

  const Printer = require('..');
  let { path = 'COM1', baudRate = 9600, width = 42 } = deviceInfo;

  width = +width;
  baudRate = +baudRate;

  let device = new Printer.Serial(path, { baudRate });
  let printer = new Printer(device, { width });

  device.open(function(){

      require('./receipt')(printer);
      
      setTimeout(function(){
        printer.close();
      }, 1000);

  });

};