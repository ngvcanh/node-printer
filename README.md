# node-printer
Printer driver for POS with NodeJS

## The features coming soon

- Print qrcode
- Print barcode
- Print images

## About package

This repository uses a module that communicates with the printer port.

This module is rewritten based on a module on github and it has removed features such as: print qrcode, print barcode, print images.

Link module github: https://github.com/song940/node-escpos

New features in this module:

- Fixed the width of the paper size when changing font size.
- Determining the number of bytes of letters with different types of letters prevents overflow on the line.
- Auto line break by space in table, auto line break for words with too long character count.
- Reconstructing table is simpler and won't break when changing character type and font size.

Primary file of module: `./index.js`;

Libraries inside module:

- Class `Printer` - Make a printer driver to send data to device.
- Class `Printer.Serial` - Make a device via Serial port.
- Class `Printer.USB` - Make a device via USB port.
- Property `Printer.Chars` - Contains special characters of printer.

## Sometime delay

I search for solutions myself and find the libraries that people share to combine or rewrite as I desire.

So sometimes I often stop a project to code what I need.

If you want me to develop additional code, leave an issue with your wishes I will try to code
