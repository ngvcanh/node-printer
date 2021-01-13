const EventEmitter = require('events');
const { MutableBuffer } = require('mutable-buffer');
const iconv = require('iconv-lite');

function encoding(text, encode){
  if (!encode) return text;
  return iconv.encode(text, encode);
};

function textLength(text, encode){
  return Buffer.byteLength(encoding(text.toString(), encode));
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

Printer.prototype.spaceRepeat = function(length){
	length = +length;
	if (length <= 0) return '';
	return ' '.repeat(length);
};

Printer.prototype._formatCell = function(text, spaces, align){
  if (!spaces) return text;

  if (align == 'RIGHT'){
    text = spaces + text;
  }
  else if (align == 'CENTER'){
    let leftSpaces = spaces.substr(0, parseInt(spaces.length / 2)) ;
    let rightSpaces = spaces.substr(leftSpaces.length);
    text = leftSpaces + text + rightSpaces;
  }
  else{
    text += spaces;
  }

  return text;
};

Printer.prototype.tableRow = function(data, options){
  if (!Array.isArray(data) || !data.length) return this;
  let { encoding: encode = this.encoding } = options || {}, numHasSize = 0, totalSize = 0;

  data = data.map(cell => {
    let text = '', align = 'LEFT', width = 0;
    if (!cell || typeof cell !== 'object' || Array.isArray(cell)) return { text, align, width };

    'text' in cell && (text = cell.text + '');
    [ 'RIGHT', 'CENTER' ].indexOf(cell.align) && (align = cell.align);

    if (+cell.width > 0){
      ++numHasSize;
      width = parseInt(this.getWidth() * +cell.width);
      totalSize += width;
    }

    return { text, align, width };
  });

  let remainNumSize = data.length - numHasSize
  , sizeRemainCell = Math.floor((this.getWidth() - totalSize) / remainNumSize)
  , maxLine = 1;

  data = data.map(cell => {
    cell.width <= 0 && (cell.width = sizeRemainCell);
    cell.line = [];

    if (cell.width <= 0){
      cell.width = 0;
      return cell;
    }

    if (!cell.text.length) return cell;

    let arrWord = cell.text.split(' '), line = [], i = 0;

    for (; i < arrWord.length; ++i){
      let word = arrWord[i]
      , newStr = line.concat([ word ]).join(' ')
      , newLineLength = textLength(newStr, encode);

      if (newLineLength < cell.width){
        line.push(word);
      }
      else if (newLineLength == cell.width){
        cell.line.push(newStr);
        line = [];
      }
      else{
        let wordLength = textLength(word, encode);
        
        cell.line.push(line.join(' '));
        line = [];

        if (wordLength >= cell.width){
          
          for (let j = 0; j = word.length; ++j){
            let char = word[j]
            , newCharLength = textLength(line.join('') + char, encode);
            
            if (newCharLength == cell.width){
              cell.line.push(line.join('') + char);
              line = [];
            }
            else if (newCharLength < cell.width){
              line.push(char);
            }
            else{
              cell.line.push(line.join(''));
              line = [ char ];
            }

            if (j == word.length - 1 && line.join('').length){
              line = [ line.join('') ];
            }
          }
        }
        else{
          line.push(word); 
        }
      }

      if (i == arrWord.length - 1 && line.join(' ').length){
        cell.line.push(line.join(' '));
      }
    }

    cell.line.length > maxLine && (maxLine = cell.line.length);
    return cell;
  });

  let lineTxt, i = 0, sizeRow;

  for (; i < maxLine; ++i){
    lineTxt = '';
    sizeRow = 0;
    
    data.map(cell => {
      sizeRow += cell.width;

      let textCell = cell.line[i] ? cell.line[i] : ''
      , txtLength = textLength(lineTxt + textCell, encode)
      , spaces = '';
      
      while(txtLength < sizeRow){
        spaces += ' ';
        txtLength = textLength(lineTxt + textCell + spaces, encode)
      }

      if (txtLength > sizeRow) spaces = spaces.substr(0, spaces.length - 1);
      lineTxt += this._formatCell(textCell, spaces, cell.align);
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