// generate-images.js
// Usage: node generate-images.js
//
// 同じフォルダに以下のファイルを配置:
//   - logo.png (or logo.jpg)       ... 会社ロゴ
//   - signature.png (or signature.jpg) ... 署名画像
//
// 片方だけでもOKです。

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

var logoPath = findImage('logo');
var sigPath = findImage('signature');

if (!logoPath && !sigPath) {
  console.error('ERROR: logo.png/jpg または signature.png/jpg が見つかりません。');
  console.error('同じフォルダに配置してください。');
  process.exit(1);
}

var lines = ['// Invoice PDF images - Generated ' + new Date().toISOString().split('T')[0]];
lines.push('var INVOICE_IMAGES = {');

if (logoPath) {
  lines.push('  logo: "' + toDataUri(logoPath) + '",');
  console.log('✓ ロゴ: ' + path.basename(logoPath) + ' (' + (fs.statSync(logoPath).size / 1024).toFixed(1) + ' KB)');
} else {
  lines.push('  logo: null,');
  console.log('⚠ ロゴ画像なし（スキップ）');
}

if (sigPath) {
  lines.push('  signature: "' + toDataUri(sigPath) + '"');
  console.log('✓ 署名: ' + path.basename(sigPath) + ' (' + (fs.statSync(sigPath).size / 1024).toFixed(1) + ' KB)');
} else {
  lines.push('  signature: null');
  console.log('⚠ 署名画像なし（スキップ）');
}

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
