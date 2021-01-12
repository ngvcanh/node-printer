module.exports = function action_printUSB(deviceInfo){

  let { path = '0.0', width = 42, autoFind = true } = deviceInfo;
  let device;

  width = +width;
  const Printer = require('..');

  if (autoFind){
    device = new Printer.USB();
  }
  else{
    path = path.split('.');
    let vid = +path[0];
    let pid = +path[1];

    vid = '0x' + vid.toString(16);
    pid = '0x' + pid.toString(16);

    device = new Printer.USB(vid, pid);
  }

  let printer = new Printer(device, { width });

  device.open(function(){

    require('./receipt')(printer);
    
    setTimeout(function(){
      printer.close();
    }, 1000);

  });

};