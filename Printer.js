const EventEmitter = require('events');
const { MutableBuffer } = require('mutable-buffer');
const iconv = require('iconv-lite');

function encoding(text, encode){
  if (!encode) return text;
  return iconv.encode(text, encode);
};

function textLength(text){
  return Buffer.byteLength(text, encode || 'utf-8');
}

function Printer(device, options){
  
  if (typeof device.write !== 'function'){
    throw new Error('Device must be a write function.');
  }

  EventEmitter.call(this);

  this.device = device;

  this.width = options && +options.width || 42;

  this.buffer = new MutableBuffer();

  this.encoding = '';

  this._size = [ 0, 0 ];

}

Printer.Chars = {
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
  },
  LINESPACE: {
    DEFAULT: '\x1b\x32',
    SET: '\x1b\x33'
  }
};

Printer.prototype.encode = function(encode){
  this.encoding = encode;
  return this;
}

Printer.prototype.getWidth = function(){
  return this.width / (this._size[0] + 1);
};

Printer.prototype.size = function(width, height){
  width = +width;
  height = +height;

  width = width < 0 ? 0 : width;
  height = height < 0 ? 0 : height;

  width = width > 7 ? 7 : width;
  height = height > 7 ? 7 : height;

  this._size = [ width, height ];

  //return this.text('\x1d\x21' + String.fromCharCode(width * 16 + height));

  value = width * 16 + height;
  value = value.toString(16);

  value.length % 2 === 0 || (value = '0' + value);
  return this.text(Buffer.from('1d21' + value, 'hex'));
};

Printer.prototype.lineSpace = function(n){
  if (n === undefined || n === null) {
    this.buffer.write(Printer.Chars.LINESPACE.DEFAULT);
  } else {
    this.buffer.write(Printer.Chars.LINESPACE.SET);
    this.buffer.writeUInt8(n);
  }
  return this;
};

Printer.prototype.newLine = function(){
  this.buffer.write(Printer.Chars.EOL);
  return this;
};

Printer.prototype.text = function(text, encode){
  this.buffer.write(encoding(text, encode || this.encoding));
  return this;
};

Printer.prototype.textLn = function(text, encode){
  return this.text(text, encode).newLine();
};

Printer.prototype.dashedLine = function(){
  return this.textLn('-'.repeat(this.getWidth()));
};

Printer.prototype.dottedLine = function(){
  return this.textLn('.'.repeat(this.getWidth()));
};

Printer.prototype._formatCell = function(text, width, align){
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

Printer.prototype.tableRow = function(data, options){
  if (!Array.isArray(data) || !data.length) return this;
  let { encoding: encode = this.encoding } = options || {}, numHasSize = 0, totalSize = 0;

  data = data.map(row => {
    let text = 'text' in row ? row.text.toString() : '', width = -1
    , align = [ 'RIGHT', 'CENTER' ].indexOf(row.align) > -1 ? row.align : 'LEFT';

    if (row && row.width && +row.width > 0){
      ++numHasSize;
      width = parseInt(this.getWidth() * row.width);
      totalSize += width;
    }

    return { text, width, align };
  });

  let remainNumSize = data.length - numHasSize
  , sizeRemainCell = parseInt((this.getWidth() - totalSize) / remainNumSize)
  , maxLine = 1;

  data = data.map(row => {
    row.width <= 0 && (row.width = sizeRemainCell);

    if (row.width <= 0){
      row.line = [''];
      return row;
    }

    let line = [], textLine = row.width > 0 ? row.text : '';

    if (textLine.length){
      let arrWord = textLine.split(' '), subText = [], word, added = false;

      do{
        word = arrWord.shift();
        let currentLength = textLength(subText.join(' '), encode)
        , wordLength = textLength(word.length, encode);
        
        if (wordLength + currentLength + 1 < row.width){
          subText.push(word);
          added = false;
        }
        else if (wordLength > row.width){
          currentLength > 0 && line.push(subText.join(' '));
          subText = [];
          let wordSplit = '';

          for (let i = 0; i < word.length; ++i){
            if (textLength(word[i], encode) + textLength(wordSplit, encode) <= row.width){
              wordSplit += word[i];
            }
            else{
              wordSplit.length && line.push(wordSplit);
              wordSplit = word[i];
            }
          }

          added = true;
        }
        else{
          line.push(this._formatCell(subText.join(' '), row.width, row.align));
          added = true;
          subText = [];
        }
      }
      while(arrWord.length);

      if (!added){
        subText = subText.join(' ');
        subText.length && line.push(this._formatCell(subText, row.width, row.align));
      }
    }
    else{
      line.push(' '.repeat(textLine.length));
    }

    line.length > maxLine && (maxLine = line.length);
    row.line = line;

    return row;
  });

  let lineTxt, i = 0;

  for (i = 0; i < maxLine; ++i){
    lineTxt = '';
    
    data.map(row => {
      let length = row.line[i] ? row.line[i].length : 0;
      lineTxt += (row.line[i] || '') + ' '.repeat(row.width - length);
    });

    this.textLn(lineTxt, encode);
  }

  return this;
};

Printer.prototype.align = function(align){
  this.buffer.write(Printer.Chars.ALIGN[align.toUpperCase()]);
  return this;
};

Printer.prototype.font = function(type){
  this.buffer.write(Printer.Chars.FONT[type.toUpperCase()]);
  return this;
};

Printer.prototype.feed = function(n){
  this.buffer.write(new Array(+n || 1).fill(Printer.Chars.EOL).join(''));
  return this;
}

Printer.prototype.cut = function(feed){
  this.feed(+feed || 3).buffer.write(Printer.Chars.CUT);
  return this;
};

Printer.prototype.open = function(callback){
  this.device.open(err => typeof callback === 'function' && callback.call(this, err));
  return this;
}

Printer.prototype.flush = function(callback){
  var buf = this.buffer.flush();
  this.device.write(buf, callback);
  return this;
};

Printer.prototype.close = function(callback, options){
  return this.flush(() => this.device.close(callback, options));
};

module.exports = Printer;