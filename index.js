const { app, BrowserWindow } = require('electron');
// const SerialPort = require('serialport');
const Print = require('./Print');

const print = () => {
  let p = new Print({ path: 'COM2', baudRate: 19200 }, { width: 64 });
  p.open(function(err){console.log('herere');
    p
    .font('b')
    .align('RT')
    .textLn('210110-00123')
    .align('CT')
    .textLn('title of receipt')
    .dashedLine()
    .tableRow([
      { text: 'User', width: 0.3 },
      { text: ': username' }
    ])
    .tableRow([
      { text: 'Phone', width: 0.3 },
      { text: ': 0123456789' }
    ])
    .tableRow([
      { text: 'Address', width: 0.3 },
      { text: ': address address address address address address address address address address address' }
    ])
    .dashedLine()
    .tableRow([
      { text: 'Food', width: 0.5 },
      { text: 'Qty', width: 0.2, align: 'CENTER' },
      { text: 'Amount', align: 'RIGHT' }
    ])
    .dashedLine()
    .tableRow([
      { text: 'Food 1 Food 1 Food 1 Food 1 Food 1 Food 1 Food 1 Food 1 Food 1 Food 1 Food 1 Food 1', width: 0.5 },
      { text: '1', width: 0.2, align: 'CENTER' },
      { text: '12,300 $', align: 'RIGHT' }
    ])
    .tableRow([
      { text: 'Food 2 Food 2 Food 2 Food 2 Food 2 Food 2', width: 0.5 },
      { text: '3', width: 0.2, align: 'CENTER' },
      { text: '12,300 $', align: 'RIGHT' }
    ])
    .tableRow([
      { text: 'Food 3 Food 3 Food 3 Food 3 Food 3 Food 3', width: 0.5 },
      { text: '1', width: 0.2, align: 'CENTER' },
      { text: '12,300 $', align: 'RIGHT' }
    ])
    .tableRow([
      { text: 'Ship fee', width: 0.5 },
      { text: '12,300 $', align: 'RIGHT' }
    ])
    .dashedLine()
    .tableRow([
      { text: 'Payment method', width: 0.5 },
      { text: 'COD', align: 'RIGHT' }
    ])
    .dashedLine()

    
    .feed(3)
    .cut();
    setTimeout(function(){
      p.close();
    }, 1000);
  });
};

app.whenReady().then(function(){

  let win = new BrowserWindow({
    width: 300,
    show: true,
    webPreferences: {
      nodeIntegration: true
    }
  });
  
  win.loadFile(__dirname + '\\index.html');

  win.webContents.on('did-finish-load', function(){

    print();

  });

});