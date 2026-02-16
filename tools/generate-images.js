// generate-images.js
// Usage: node generate-images.js
//
// 同じフォルダに以下のファイルを配置:
//   - logo.png (or logo.jpg)              ... 会社ロゴ
//   - stamp.png (or stamp.jpg)            ... 社判スタンプ
//   - signature.png (or signature.jpg)    ... 承認者署名
//   - collector_sign.png (or .jpg)        ... Collector署名（領収書用）
//
// 見つかった画像のみ生成します。

const fs = require('fs');
const path = require('path');

function findImage(baseName) {
  var exts = ['.png', '.jpg', '.jpeg'];
  for (var i = 0; i < exts.length; i++) {
    var filePath = path.join(__dirname, baseName + exts[i]);
    if (fs.existsSync(filePath)) return filePath;
  }
  return null;
}

function toDataUri(filePath) {
  var ext = path.extname(filePath).toLowerCase();
  var mime = ext === '.png' ? 'image/png' : 'image/jpeg';
  var base64 = fs.readFileSync(filePath).toString('base64');
  return 'data:' + mime + ';base64,' + base64;
}

var images = [
  {key: 'logo', file: 'logo', label: 'ロゴ'},
  {key: 'stamp', file: 'stamp', label: 'スタンプ'},
  {key: 'signature', file: 'signature', label: '承認者署名'},
  {key: 'collectorSign', file: 'collector_sign', label: 'Collector署名'}
];

var found = images.filter(function(img) { return findImage(img.file); });
if (found.length === 0) {
  console.error('ERROR: 画像ファイルが1つも見つかりません。');
  console.error('同じフォルダに配置してください。');
  process.exit(1);
}

var lines = ['// Invoice PDF images - Generated ' + new Date().toISOString().split('T')[0]];
lines.push('var INVOICE_IMAGES = {');

images.forEach(function(img, idx) {
  var imgPath = findImage(img.file);
  var isLast = idx === images.length - 1;
  if (imgPath) {
    lines.push('  ' + img.key + ': "' + toDataUri(imgPath) + '"' + (isLast ? '' : ','));
    console.log('✓ ' + img.label + ': ' + path.basename(imgPath) + ' (' + (fs.statSync(imgPath).size / 1024).toFixed(1) + ' KB)');
  } else {
    lines.push('  ' + img.key + ': null' + (isLast ? '' : ','));
    console.log('⚠ ' + img.label + '画像なし（スキップ）');
  }
});

lines.push('};');

var outPath = path.join(__dirname, 'invoice-images.js');
fs.writeFileSync(outPath, lines.join('\n'));
var sizeMB = (fs.statSync(outPath).size / 1024).toFixed(1);
console.log('\n✓ invoice-images.js を生成しました (' + sizeMB + ' KB)');
console.log('\nkintoneのJS登録順:');
console.log('  1. pdfmake.min.js');
console.log('  2. vfs_fonts_noto.js');
console.log('  3. invoice-images.js  ← NEW');
console.log('  4. invoice-pdf.js');
