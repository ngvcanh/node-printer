module.exports = function createReceipt(printer){
  printer
    .font('b')
    .align('RT')
    .size(1, 1)
    .textLn('210110-00123')
    .align('CT')
    .textLn('title of receipt')
    .size(0, 0)
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
      { text: ': 경남 김김ㄱ미기미미해시 창산소아ㅓ마ㅓㄴㅇㄹ;미ㅏㅓㄴㅇ람ㄴㅇㄹㄴㅇㄹㅁㄴㅇㄻㄴㅇㄻㄴㅇㄹ' }
    ], { encoding: 'EUC-KR' })
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
    .size(1,1)
    .tableRow([
      { text: 'Food 3 Food 3 Food 3 Food 3 Food 3 Food 3', width: 0.5 },
      { text: '1', width: 0.2, align: 'CENTER' },
      { text: '12,300 $', align: 'RIGHT' }
    ])
    .size(0, 0)
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
};