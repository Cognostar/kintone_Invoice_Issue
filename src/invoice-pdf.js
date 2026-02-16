/**
 * Sato Kogyo Bangkok - Invoice PDF Generator for kintone (v4)
 * Full layout with logo, stamp, signature, and proper ruling lines
 */

(function() {
  'use strict';

  if (typeof pdfMake !== 'undefined') {
    pdfMake.fonts = {
      NotoSansThai: {
        normal: 'NotoSansThai-Regular.ttf',
        bold: 'NotoSansThai-Bold.ttf',
        italics: 'NotoSansThai-Regular.ttf',
        bolditalics: 'NotoSansThai-Bold.ttf'
      }
    };
  }

  var COMPANY = {
    nameTh: 'บริษัท ซาโต้ โคเกียว กรุงเทพ จำกัด (สำนักงานใหญ่)',
    nameEn: 'SATO KOGYO BANGKOK CO., LTD.',
    addressTh: '25 อาคารกรุงเทพประกันภัย/ไว.ดับยู.ซี.เอ ชั้น 20 ถนนสาทรใต้ แขวงทุ่งมหาเมฆ เขตสาทร กรุงเทพ 10120',
    addressEn1: '25 Bangkok Insurance/Y.W.C.A.Building, 20th Floor, South Sathorn Road, Khwang',
    addressEn2: 'Tungmahamek Khet Sathorn, Bangkok 10120',
    tel: 'Tel. 0-2677-4146-51   Fax : 0-2677-4152',
    taxId: '0105539060333',
    taxLabel: 'เลขประจำตัวผู้เสียภาษีอากร',
    bankName: 'บริษัท ซาโต้ โคเกียว กรุงเทพ จำกัด (SATO KOGYO BANGKOK CO., LTD.)',
    bankBranch: 'ธนาคารกรุงเทพ สาขา สวนพลู (Bangkok Bank SUANPLU Branch)',
    bankAccount: 'บัญชีออมทรัพย์ เลขที่บัญชี (Saving account & A/C No.) 200-053638-9',
    paymentNote: 'รับชำระเป็นเงินโอนเข้าบัญชีบริษัทฯ หรือ เช็คในนามบริษัทฯ เท่านั้น',
    paymentNoteEn: '(In order to receive payment, we only accept bank transfers to the company\'s account or cheque issued in the company\'s name only)'
  };

  var FIELDS = {
    customerName: 'Customer_Name',
    customerAddress: 'Customer_Address',
    customerTaxId: 'Customer_Tax_ID',
    customerBranch: 'Customer_Branch_Code',
    invoiceName: 'Invoice_Name',
    wht: 'WHT',
    wt: 'W_T',
    table: 'テーブル',
    invoiceNo: 'Invoice_No',
    invoiceDate: 'Invoice_Date',
    invoiceDesc: 'Invoice_Description',
    claimAmount: 'Claim_Amount',
    receiptNo: 'Receipt_No',
    chequeBankName: 'Cheque_Bank_Name',
    chequeBranch: 'Cheque_Branch',
    chequeNo: 'Cheque_No',
    chequeDate: 'Cheque_Date',
    poNo: 'PO_No',
    discountOnInvoice: 'Discount_on_Invoice'
  };

  function formatNumber(num) {
    if (num === null || num === undefined || num === '') return '0.00';
    var n = parseFloat(num);
    if (isNaN(n)) return '0.00';
    return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatDateEn(dateStr) {
    if (!dateStr) return '';
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    return months[parseInt(parts[1],10)-1] + ' ' + (parseInt(parts[2],10)<10?'0':'') + parseInt(parts[2],10) + ', ' + parts[0];
  }

  function numberToWords(num) {
    if (num === 0) return '(Zero Baht Only)';
    var ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    var tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    function g(n) {
      if (n===0) return '';
      if (n<20) return ones[n];
      if (n<100) return tens[Math.floor(n/10)]+(n%10?' '+ones[n%10]:'');
      return ones[Math.floor(n/100)]+' Hundred'+(n%100?' '+g(n%100):'');
    }
    var intPart = Math.floor(num), satang = Math.round((num-intPart)*100), r = '';
    if (intPart>=1000000) { r+=g(Math.floor(intPart/1000000))+' Million '; intPart%=1000000; }
    if (intPart>=1000) { r+=g(Math.floor(intPart/1000))+' Thousand '; intPart%=1000; }
    if (intPart>0) r+=g(intPart);
    r = r.trim()+' Baht';
    if (satang>0) r+=' and '+g(satang)+' Satang';
    return '('+r+' Only)';
  }

  // 罫線ヘルパー
  function hLine() {
    return { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#999999' }], margin: [0, 2, 0, 2] };
  }

  function buildPage(data, copyType, isFirst, docType) {
    var totalPrice = parseFloat(data.claimAmount)||0;
    var discount = parseFloat(data.discount)||0;
    var displayPrice = discount > 0 ? totalPrice + discount : totalPrice;
    var vatAmount = Math.round(totalPrice * 0.07 * 100) / 100;
    var totalAmount = totalPrice + vatAmount;

    // 明細行
    var descLines = (data.description||'').split('\n').filter(function(l){return l.trim()!=='';});
    if (data.poNo) {
      descLines.push('(REF. AS P/O NO.' + data.poNo + ')');
    }
    var itemRows = [['','PAYMENT FOR','']];
    for (var i=0; i<descLines.length; i++) {
      itemRows.push(['', descLines[i], i===0 ? formatNumber(displayPrice) : '']);
    }
    for (var j=itemRows.length; j<10; j++) itemRows.push(['','','']);

    var isHO = data.isHeadOffice;
    var branchText = isHO ? '' : (data.branchCode || '');
    var page = [];

    if (!isFirst) page.push({text:'',pageBreak:'before'});

    // ========== ヘッダー: ロゴ + 会社情報（左寄せ） ==========
    page.push({
      columns: [
        {
          width: 70,
          image: INVOICE_IMAGES.logo,
          fit: [65, 65]
        },
        {
          width: '*',
          stack: [
            {text: COMPANY.nameTh, fontSize: 12, bold: true},
            {text: COMPANY.nameEn, fontSize: 11, bold: true},
            {text: COMPANY.addressTh, fontSize: 7.5, margin: [0,1,0,0]},
            {text: COMPANY.addressEn1, fontSize: 7.5},
            {text: COMPANY.addressEn2, fontSize: 7.5},
            {text: COMPANY.tel + '  ' + COMPANY.taxLabel + ' ' + COMPANY.taxId, fontSize: 7.5}
          ],
          margin: [3, 0, 0, 0]
        }
      ],
      margin: [0, 0, 0, 5]
    });

    // ========== ORIGINAL/COPY（空行+中央寄せ） ==========
    page.push({text: '', margin: [0, 8, 0, 0]});
    page.push({text: copyType, fontSize: 9, bold: true, alignment: 'center', margin: [0, 0, 0, 0]});

    // ========== タイトル ==========
    if (docType === 'receipt') {
      page.push({text: 'ใบเสร็จรับเงิน / ใบกำกับภาษี', fontSize: 16, bold: true, alignment: 'center', margin: [0, 2, 0, 0]});
      page.push({text: 'RECEIPT / TAX INVOICE', fontSize: 9, alignment: 'center', margin: [0, 0, 0, 3]});
    } else {
      page.push({text: 'INVOICE / ใบแจ้งหนี้', fontSize: 16, bold: true, alignment: 'center', margin: [0, 2, 0, 0]});
      page.push({text: '(ไม่ใช่ใบกำกับภาษี)', fontSize: 9, alignment: 'center', margin: [0, 0, 0, 3]});
    }

    // ========== Invoice No / Date ==========
    page.push({
      columns: [
        {text: '', width: '*'},
        {
          width: 'auto',
          table: {
            widths: [70, 120],
            body: [
              [
                {text: (docType === 'receipt' ? 'Receipt No. :' : 'Invoice No. :'), fontSize: 9, alignment: 'right', border: [false,false,false,false]},
                {text: ' ' + (docType === 'receipt' ? (data.receiptNo||'') : (data.invoiceNo||'')), fontSize: 9, bold: true, alignment: 'left', border: [false,false,false,false]}
              ],
              [
                {text: 'Date :', fontSize: 9, alignment: 'right', border: [false,false,false,false]},
                {text: ' ' + formatDateEn(data.invoiceDate), fontSize: 9, bold: true, alignment: 'left', border: [false,false,false,false]}
              ]
            ]
          },
          layout: 'noBorders'
        }
      ],
      margin: [0, 3, 0, 8]
    });

    // ========== 顧客情報 + TAX ID（Customerと同じ高さ） ==========
    page.push({
      columns: [
        {
          width: '*',
          stack: [
            {
              columns: [
                {text: 'Customer :', width: 55, fontSize: 9, bold: true, alignment: 'right'},
                {text: '   ' + (data.customerName||''), fontSize: 9}
              ]
            },
            {
              margin: [57, 2, 0, 0],
              columns: [
                {
                  width: 'auto',
                  canvas: [
                    {type:'rect', x:0, y:0, w:10, h:10, lineWidth:0.8, lineColor:'#333333'},
                    isHO ? {type:'line', x1:2, y1:5, x2:4, y2:8, lineWidth:1.2, lineColor:'#333333'} : {},
                    isHO ? {type:'line', x1:4, y1:8, x2:9, y2:1, lineWidth:1.2, lineColor:'#333333'} : {}
                  ].filter(function(c){return c.type;}),
                  margin: [0, 0, 3, 0]
                },
                {text: 'สำนักงานใหญ่', fontSize: 8, width: 'auto', margin: [0, 0, 15, 0]},
                {
                  width: 'auto',
                  canvas: [
                    {type:'rect', x:0, y:0, w:10, h:10, lineWidth:0.8, lineColor:'#333333'},
                    !isHO ? {type:'line', x1:2, y1:5, x2:4, y2:8, lineWidth:1.2, lineColor:'#333333'} : {},
                    !isHO ? {type:'line', x1:4, y1:8, x2:9, y2:1, lineWidth:1.2, lineColor:'#333333'} : {}
                  ].filter(function(c){return c.type;}),
                  margin: [0, 0, 3, 0]
                },
                {text: 'สาขา ', fontSize: 8, width: 'auto'},
                {text: branchText, fontSize: 8, width: 'auto'}
              ]
            },
            {
              columns: [
                {text: 'Address :', width: 55, fontSize: 9, bold: true, alignment: 'right'},
                {text: '   ' + (data.address||''), fontSize: 9}
              ],
              margin: [0, 2, 0, 0]
            }
          ]
        },
        {
          width: 'auto',
          columns: [
            {text: 'TAX ID :', width: 70, fontSize: 9, bold: true, alignment: 'right'},
            {text: '   ' + (data.taxId||''), width: 120, fontSize: 9, alignment: 'left'}
          ]
        }
      ],
      margin: [0, 0, 0, 8]
    });

    // ========== 明細テーブル ==========
    var tb = [[
      {text: 'รายการ / Description', fontSize: 9, bold: true, fillColor: '#F0F0F0', alignment: 'center', colSpan: 2, border: [true,true,true,true]},
      {},
      {text: 'จำนวนเงิน / Amount', fontSize: 9, bold: true, fillColor: '#F0F0F0', alignment: 'center', border: [true,true,true,true]}
    ]];
    for (var k=0; k<itemRows.length; k++) {
      tb.push([
        {text: itemRows[k][0], fontSize: 8, border: [true,false,false,false]},
        {text: itemRows[k][1], fontSize: 8, border: [false,false,false,false]},
        {text: itemRows[k][2], fontSize: 8, alignment: 'right', border: [true,false,true,false]}
      ]);
    }
    // 合計行
    tb.push([
      {text: '', border: [true,true,false,false]},
      {text: 'รวมค่าสินค้าหรือบริการ / Total Price', fontSize: 8, border: [false,true,false,false]},
      {text: formatNumber(displayPrice), fontSize: 8, alignment: 'right', border: [true,true,true,false]}
    ]);
    // 値引き行（discount > 0 の場合のみ）
    if (discount > 0) {
      tb.push([
        {text: '', border: [true,false,false,false]},
        {text: 'ส่วนลด / Discount', fontSize: 8, border: [false,false,false,false]},
        {text: formatNumber(discount), fontSize: 8, alignment: 'right', border: [true,false,true,false]}
      ]);
      tb.push([
        {text: '', border: [true,false,false,false]},
        {text: 'มูลค่าหลังหักส่วนลด / Total Amount After Discount', fontSize: 8, border: [false,false,false,false]},
        {text: formatNumber(totalPrice), fontSize: 8, alignment: 'right', border: [true,false,true,false]}
      ]);
    }
    tb.push([
      {text: '', border: [true,false,false,false]},
      {text: 'ภาษีมูลค่าเพิ่ม / Value Added Tax (7%)', fontSize: 8, border: [false,false,false,false]},
      {text: formatNumber(vatAmount), fontSize: 8, alignment: 'right', border: [true,false,true,false]}
    ]);
    tb.push([
      {text: '', border: [true,false,false,true]},
      {text: 'จำนวนเงินรวมทั้งสิ้น / Total Amount', fontSize: 10, bold: true, border: [false,false,false,true]},
      {text: formatNumber(totalAmount), fontSize: 10, bold: true, alignment: 'right', border: [true,false,true,true]}
    ]);

    page.push({
      table: {headerRows:1, widths:[20,'*',110], body:tb},
      layout: {
        hLineWidth: function(i,node){return (i===0||i===1||i===node.table.body.length||i===node.table.body.length-3)?0.8:0.3;},
        vLineWidth: function(){return 0.5;},
        hLineColor: function(i,node){return (i===0||i===1||i===node.table.body.length)?'#333':'#CCCCCC';},
        vLineColor: function(){return '#333';}
      }
    });

    // ========== 金額英語表記 ==========
    page.push({text: numberToWords(totalAmount), fontSize: 8, italics: true, margin: [0,4,0,0]});

    // ========== 金額合計（タイ語）==========
    page.push({text: 'จำนวนเงินรวมทั้งสิ้น', fontSize: 9, bold: true, margin: [0,2,0,3]});

    // ========== WHT（W_T=Yesの場合のみ表示、領収書では非表示） ==========
    if (docType !== 'receipt' && data.showWT) {
      page.push({text: 'กรุณาหักภาษี ณ ที่จ่าย (Please deduct W/T)', fontSize: 9, margin: [0,0,0,5]});
    }

    // ========== 支払情報 ==========
    if (docType === 'receipt') {
      page.push({text: 'ชำระเงินโดย (Payment by)', fontSize: 9, bold: true, margin: [0,0,0,2]});
      page.push({
        table: {
          widths: [120, '*'],
          body: [
            [
              {text: 'เช็คธนาคาร / Bank :', fontSize: 8, border: [false,false,false,false]},
              {text: (data.chequeBankName||''), fontSize: 8, border: [false,false,false,false]}
            ],
            [
              {text: 'สาขา / Branch :', fontSize: 8, border: [false,false,false,false]},
              {text: (data.chequeBranch||''), fontSize: 8, border: [false,false,false,false]}
            ],
            [
              {text: 'เช็คเลขที่ / Cheque No. :', fontSize: 8, border: [false,false,false,false]},
              {text: (data.chequeNo||''), fontSize: 8, border: [false,false,false,false]}
            ],
            [
              {text: 'ลงวันที่ / Date :', fontSize: 8, border: [false,false,false,false]},
              {text: formatDateEn(data.chequeDate), fontSize: 8, border: [false,false,false,false]}
            ]
          ]
        },
        layout: 'noBorders',
        margin: [10,0,0,0]
      });
    } else {
      page.push({text: 'กรุณาโอนเงินเข้าบัญชี (Please transfer money to this account)', fontSize: 9, bold: true, margin: [0,0,0,2]});
      page.push({text: COMPANY.bankName, fontSize: 8, margin: [10,0,0,0]});
      page.push({text: COMPANY.bankBranch, fontSize: 8, margin: [10,0,0,0]});
      page.push({text: COMPANY.bankAccount, fontSize: 8, margin: [10,0,0,3]});
      page.push({text: COMPANY.paymentNote, fontSize: 7, margin: [10,0,0,0]});
      page.push({text: COMPANY.paymentNoteEn, fontSize: 7, margin: [10,0,0,0]});
    }

    // ========== 署名欄 ==========
    // 会社名（右寄せ）
    page.push({
      columns: [
        {width: '48%', text: ''},
        {width: '52%', text: COMPANY.nameEn, fontSize: 9, bold: true, alignment: 'center'}
      ],
      margin: [0, 8, 0, 0]
    });

    // スタンプ・署名画像（右側）
    page.push({
      columns: [
        {width: '48%', text: ''},
        {
          width: '52%',
          columns: [
            {width: '*', text: ''},
            {width: 'auto', image: INVOICE_IMAGES.stamp, fit: [75, 75], margin: [0, 0, 5, 0]},
            {width: 'auto', image: INVOICE_IMAGES.signature, fit: [85, 55], margin: [0, 10, 0, 0]},
            {width: '*', text: ''}
          ]
        }
      ],
      margin: [0, 2, 0, 0]
    });

    // Receiver罫線 ＝ Authorized Signature罫線（テーブル1行で完全同一高さ）
    page.push({
      table: {
        widths: ['48%', '52%'],
        body: [[
          {
            stack: [
              {canvas: [{type:'line', x1:20, y1:0, x2:220, y2:0, lineWidth:0.5}]},
              {text: (docType === 'receipt' ? 'ผู้รับเงิน (Collector)' : 'ผู้รับวางบิล / Receiver'), fontSize: 8, margin: [20, 3, 0, 0]}
            ],
            border: [false, false, false, false]
          },
          {
            stack: [
              {canvas: [{type:'line', x1:20, y1:0, x2:250, y2:0, lineWidth:0.5}]},
              {text: 'Authorized Signature', fontSize: 8, alignment: 'center', margin: [0, 3, 0, 0]}
            ],
            border: [false, false, false, false]
          }
        ]]
      },
      layout: 'noBorders',
      margin: [0, -10, 0, 0]
    });

    // วันที่รับ / Date（左側のみ、罫線はテキストの下）
    page.push({
      stack: [
        {text: 'วันที่รับ / Date', fontSize: 8, margin: [20, 10, 0, 0]},
        {canvas: [{type:'line', x1:80, y1:0, x2:220, y2:0, lineWidth:0.5}], margin: [0, 3, 0, 0]}
      ],
      margin: [0, 0, 0, 0]
    });

    return page;
  }

  function buildDocDefinition(record, invoiceRow, docType) {
    var customerName = record[FIELDS.invoiceName].value || record[FIELDS.customerName].value || '';
    var branchCode = record[FIELDS.customerBranch].value || '';
    var isHeadOffice = !branchCode || branchCode === '00000' || branchCode === 'สำนักงานใหญ่';
    var data = {
      invoiceNo: invoiceRow[FIELDS.invoiceNo].value || '',
      invoiceDate: invoiceRow[FIELDS.invoiceDate].value || '',
      customerName: customerName,
      description: invoiceRow[FIELDS.invoiceDesc].value || '',
      claimAmount: invoiceRow[FIELDS.claimAmount].value || '0',
      address: record[FIELDS.customerAddress].value || '',
      taxId: record[FIELDS.customerTaxId].value || '',
      branchCode: branchCode,
      isHeadOffice: isHeadOffice,
      receiptNo: invoiceRow[FIELDS.receiptNo] ? invoiceRow[FIELDS.receiptNo].value || '' : '',
      showWT: invoiceRow[FIELDS.wt] ? invoiceRow[FIELDS.wt].value === 'Yes' : true,
      chequeBankName: invoiceRow[FIELDS.chequeBankName] ? invoiceRow[FIELDS.chequeBankName].value || '' : '',
      chequeBranch: invoiceRow[FIELDS.chequeBranch] ? invoiceRow[FIELDS.chequeBranch].value || '' : '',
      chequeNo: invoiceRow[FIELDS.chequeNo] ? invoiceRow[FIELDS.chequeNo].value || '' : '',
      chequeDate: invoiceRow[FIELDS.chequeDate] ? invoiceRow[FIELDS.chequeDate].value || '' : '',
      poNo: record[FIELDS.poNo] ? record[FIELDS.poNo].value || '' : '',
      discount: invoiceRow[FIELDS.discountOnInvoice] ? invoiceRow[FIELDS.discountOnInvoice].value || '' : ''
    };

    var content = [];
    var copies = docType === 'receipt'
      ? ['ต้นฉบับ (ORIGINAL)','สำเนา (COPY)','สำเนา (COPY)','สำเนา (COPY)']
      : ['ต้นฉบับ (ORIGINAL)','สำเนา (COPY)','สำเนา (COPY)','สำเนา (COPY)','สำเนา (COPY)'];
    for (var i=0; i<copies.length; i++) {
      content = content.concat(buildPage(data, copies[i], i===0, docType));
    }

    return {
      pageSize: 'A4',
      pageMargins: [40, 25, 40, 25],
      content: content,
      defaultStyle: { font: 'NotoSansThai' }
    };
  }

  // ========== kintoneイベント ==========
  kintone.events.on('app.record.detail.show', function(event) {
    if (document.getElementById('invoice-pdf-btn') && document.getElementById('receipt-pdf-btn')) return event;
    var headerSpace = kintone.app.record.getHeaderMenuSpaceElement();
    if (!headerSpace) return event;

    if (!document.getElementById('invoice-pdf-btn')) {
      var btn = document.createElement('button');
      btn.id = 'invoice-pdf-btn';
      btn.textContent = 'Issue Invoice PDF';
      btn.style.cssText = 'padding:8px 16px;background:#2B579A;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;margin-right:8px;';
      btn.addEventListener('click', function() { generateInvoicePdf(event.record); });
      headerSpace.appendChild(btn);
    }

    if (!document.getElementById('receipt-pdf-btn')) {
      var receiptBtn = document.createElement('button');
      receiptBtn.id = 'receipt-pdf-btn';
      receiptBtn.textContent = 'Issue Receipt PDF';
      receiptBtn.style.cssText = 'padding:8px 16px;background:#388E3C;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;margin-right:8px;';
      receiptBtn.addEventListener('click', function() { generateReceiptPdf(event.record); });
      headerSpace.appendChild(receiptBtn);
    }

    return event;
  });

  function generateInvoicePdf(record) {
    var tableRows = record[FIELDS.table].value;
    if (!tableRows || tableRows.length === 0) { alert('No data in INVOICE & PAYMENT INFORMATION.'); return; }
    if (tableRows.length === 1) { downloadPdf(record, tableRows[0].value); }
    else { showInvoiceSelector(record, tableRows); }
  }

  function showInvoiceSelector(record, tableRows) {
    var existing = document.getElementById('invoice-selector-overlay');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.id = 'invoice-selector-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';
    var dialog = document.createElement('div');
    dialog.style.cssText = 'background:#fff;border-radius:8px;padding:24px;min-width:400px;max-height:70vh;overflow-y:auto;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
    var title = document.createElement('h3');
    title.textContent = 'Select Invoice to issue';
    title.style.cssText = 'margin:0 0 16px;font-size:16px;color:#333;';
    dialog.appendChild(title);

    tableRows.forEach(function(row) {
      var rd = row.value;
      var rowBtn = document.createElement('button');
      rowBtn.textContent = (rd[FIELDS.invoiceNo].value||'(No.)')+'  |  '+(rd[FIELDS.invoiceDate].value||'')+'  |  '+formatNumber(rd[FIELDS.claimAmount].value)+' THB';
      rowBtn.style.cssText = 'display:block;width:100%;padding:10px 12px;margin:4px 0;background:#f5f5f5;border:1px solid #ddd;border-radius:4px;cursor:pointer;text-align:left;font-size:13px;';
      rowBtn.onmouseover = function(){this.style.background='#e3f2fd';};
      rowBtn.onmouseout = function(){this.style.background='#f5f5f5';};
      rowBtn.addEventListener('click', function(){overlay.remove();downloadPdf(record,rd);});
      dialog.appendChild(rowBtn);
    });

    var allBtn = document.createElement('button');
    allBtn.textContent = 'Issue All Invoices';
    allBtn.style.cssText = 'display:block;width:100%;padding:10px 12px;margin:12px 0 4px;background:#2B579A;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;';
    allBtn.addEventListener('click', function(){overlay.remove();tableRows.forEach(function(row){downloadPdf(record,row.value);});});
    dialog.appendChild(allBtn);

    var cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'display:block;width:100%;padding:8px;margin:4px 0;background:none;border:1px solid #ccc;border-radius:4px;cursor:pointer;font-size:13px;color:#666;';
    cancelBtn.addEventListener('click', function(){overlay.remove();});
    dialog.appendChild(cancelBtn);

    overlay.appendChild(dialog);
    overlay.addEventListener('click', function(e){if(e.target===overlay)overlay.remove();});
    document.body.appendChild(overlay);
  }

  function downloadPdf(record, invoiceRowData) {
    try {
      var docDef = buildDocDefinition(record, invoiceRowData, 'invoice');
      var customerName = record[FIELDS.invoiceName].value || record[FIELDS.customerName].value || '';
      pdfMake.createPdf(docDef).download((invoiceRowData[FIELDS.invoiceNo].value||'invoice')+'-'+customerName+'.pdf');
    } catch(e) {
      console.error('PDF生成エラー:', e);
      alert('Error generating PDF.\n'+e.message);
    }
  }

  // ========== 領収書PDF ==========
  function generateReceiptPdf(record) {
    var tableRows = record[FIELDS.table].value;
    if (!tableRows || tableRows.length === 0) { alert('No data in INVOICE & PAYMENT INFORMATION.'); return; }
    if (tableRows.length === 1) { downloadReceiptPdf(record, tableRows[0].value); }
    else { showReceiptSelector(record, tableRows); }
  }

  function showReceiptSelector(record, tableRows) {
    var existing = document.getElementById('receipt-selector-overlay');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.id = 'receipt-selector-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';
    var dialog = document.createElement('div');
    dialog.style.cssText = 'background:#fff;border-radius:8px;padding:24px;min-width:400px;max-height:70vh;overflow-y:auto;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
    var title = document.createElement('h3');
    title.textContent = 'Select Receipt to issue';
    title.style.cssText = 'margin:0 0 16px;font-size:16px;color:#333;';
    dialog.appendChild(title);

    tableRows.forEach(function(row) {
      var rd = row.value;
      var receiptNo = rd[FIELDS.receiptNo] ? rd[FIELDS.receiptNo].value || '' : '';
      var rowBtn = document.createElement('button');
      rowBtn.textContent = (receiptNo||'(No.)')+'  |  '+(rd[FIELDS.invoiceDate].value||'')+'  |  '+formatNumber(rd[FIELDS.claimAmount].value)+' THB';
      rowBtn.style.cssText = 'display:block;width:100%;padding:10px 12px;margin:4px 0;background:#f5f5f5;border:1px solid #ddd;border-radius:4px;cursor:pointer;text-align:left;font-size:13px;';
      rowBtn.onmouseover = function(){this.style.background='#e8f5e9';};
      rowBtn.onmouseout = function(){this.style.background='#f5f5f5';};
      rowBtn.addEventListener('click', function(){overlay.remove();downloadReceiptPdf(record,rd);});
      dialog.appendChild(rowBtn);
    });

    var allBtn = document.createElement('button');
    allBtn.textContent = 'Issue All Receipts';
    allBtn.style.cssText = 'display:block;width:100%;padding:10px 12px;margin:12px 0 4px;background:#388E3C;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;';
    allBtn.addEventListener('click', function(){overlay.remove();tableRows.forEach(function(row){downloadReceiptPdf(record,row.value);});});
    dialog.appendChild(allBtn);

    var cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'display:block;width:100%;padding:8px;margin:4px 0;background:none;border:1px solid #ccc;border-radius:4px;cursor:pointer;font-size:13px;color:#666;';
    cancelBtn.addEventListener('click', function(){overlay.remove();});
    dialog.appendChild(cancelBtn);

    overlay.appendChild(dialog);
    overlay.addEventListener('click', function(e){if(e.target===overlay)overlay.remove();});
    document.body.appendChild(overlay);
  }

  function downloadReceiptPdf(record, invoiceRowData) {
    try {
      var docDef = buildDocDefinition(record, invoiceRowData, 'receipt');
      var receiptNo = invoiceRowData[FIELDS.receiptNo] ? invoiceRowData[FIELDS.receiptNo].value || '' : '';
      var customerName = record[FIELDS.invoiceName].value || record[FIELDS.customerName].value || '';
      pdfMake.createPdf(docDef).download((receiptNo||'receipt')+'-'+customerName+'.pdf');
    } catch(e) {
      console.error('PDF生成エラー:', e);
      alert('Error generating PDF.\n'+e.message);
    }
  }

})();
