const SerialPort = require('serialport');
const EventEmitter = require('events');
const { MutableBuffer } = require('mutable-buffer');

function Print(deviceInfo, options){

  EventEmitter.call(this);

  this.path = deviceInfo.path;

  this.device = new SerialPort(this.path, {
    baudRate: deviceInfo.baudRate || 9200,
    autoOpen: deviceInfo.autoOpen || false
  });

  this.width = options && +options.width || 42;

  this.buffer = new MutableBuffer();

}

Print.Chars = {
  EOL: '\n',
  CUT: '\x1d\x56\x00',
  ALIGN: {
    CT: '\x1b\x61\x01',
    LT: '\x1b\x61\x00',
    RT: '\x1b\x61\x02'
  },
  FONT: {
    A: '\x1b\x4d\x00',
    B: '\x1b\x4d\x01',
    C: '\x1b\x4d\x02'
  }
};

Print.prototype.newLine = function(){
  this.buffer.write(Print.Chars.EOL);
  return this;
};

Print.prototype.text = function(text){
  this.buffer.write(text);
  return this;
};

Print.prototype.textLn = function(text){
  this.buffer.write(text + Print.Chars.EOL);
  return this;
};

Print.prototype.dashedLine = function(){
  for (let i = 0; i < this.width; ++i){
    this.buffer.write('-');
  }
  return this.newLine();
};

Print.prototype.dottedLine = function(){
  for (let i = 0; i < this.width; ++i){
    this.buffer.write('.');
  }
  return this.newLine();
};

Print.prototype._formatCell = function(text, width, align){
  let emptyLength = width - text.length;
  if (!emptyLength) return text;

  if (align == 'RIGHT'){
    text = ' '.repeat(emptyLength) + text;
  }
  else if (align == 'CENTER'){
    let leftEmpty = parseInt(emptyLength / 2);
    let rightEmpty = emptyLength - leftEmpty;
    text = ' '.repeat(leftEmpty) + text + ' '.repeat(rightEmpty);
  }
  else{
    text += ' '.repeat(emptyLength);
  }

  return text;
};

Print.prototype.tableRow = function(data){
  if (!Array.isArray(data) || !data.length) return this;

  let numHasSize = 0;
  let totalSize = 0;

  let fixData = data.map(row => {
    let text = 'text' in row ? row.text.toString() : '';
    let width = -1;

    if (row && row.width && +row.width > 0){
      ++numHasSize;
      width = parseInt(this.width * row.width);
      totalSize += width;
    }

    let align = [ 'RIGHT', 'CENTER' ].indexOf(row.align) > -1 ? row.align : 'LEFT';
    return { text, width, align };
  });

  let remainNumSize = data.length - numHasSize;
  let sizeRemainCell = parseInt((this.width - totalSize) / remainNumSize);
  let maxLine = 1;

  fixData = fixData.map(row => {
    if (row.width <= 0){
      row.width = sizeRemainCell;
    }

    if (row.width <= 0){
      row.line = [''];
      return row;
    }

    let line = [];
    let textLine = row.width > 0 ? row.text : '';

    if (textLine.length){
      let arrWord = textLine.split(' ');
      let subText = '';
      let word;
      let added = false;

      do{
        word = arrWord.shift();
        
        if (word.length + subText.length + 1< row.width){
          subText += ' ' + word;
          added = false;
        }
        else{
          line.push(this._formatCell(subText, row.write, row.align));
          added = true;
          subText = '';
          if (arrWord.length) maxLine++;
        }
      }
      while(arrWord.length);

      added || line.push(this._formatCell(subText, row.width, row.align));
    }
    else{
      line.push(' '.repeat(textLine.length));
    }

    row.line = line;
    return row;
  });

  for (let i = 0; i < maxLine; ++i){
    let lineTxt = '';
    fixData.map(row => {
      console.log(row);
      lineTxt += row.line[i] || ' '.repeat(row.width)
    });console.log('line text ::', lineTxt);
    this.text(lineTxt).newLine();
  }

  return this;
};

Print.prototype.align = function(align){
  this.buffer.write(Print.Chars.ALIGN[align.toUpperCase()]);
  return this;
};

Print.prototype.font = function(type){
  this.buffer.write(Print.Chars.FONT[type.toUpperCase()]);
  return this;
};

Print.prototype.feed = function(n){
  this.buffer.write(new Array(+n || 1).fill(Print.Chars.EOL).join(''));
  return this;
}

Print.prototype.cut = function(feed){
  this.feed(+feed || 3).buffer.write(Print.Chars.CUT);
  return this;
};

Print.prototype.open = function(callback){
  this.device.open(err => typeof callback === 'function' && callback.call(this, err));
  return this;
}

Print.prototype.flush = function(callback){
  var buf = this.buffer.flush();
  this.device.write(buf, callback);
  return this;
};

Print.prototype.close = function(callback, options){
  return this.flush(() => this.device.close(callback, options));
};

module.exports = Print;