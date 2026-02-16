// generate-vfs.js
// Usage: node generate-vfs.js
const fs = require('fs');
const path = require('path');

const regular = path.join(__dirname, 'NotoSansThai-Regular.ttf');
const bold = path.join(__dirname, 'NotoSansThai-Bold.ttf');

if (!fs.existsSync(regular)) {
  console.error('ERROR: NotoSansThai-Regular.ttf が見つかりません。同じフォルダに配置してください。');
  process.exit(1);
}

const regularB64 = fs.readFileSync(regular).toString('base64');
const boldB64 = fs.existsSync(bold) ? fs.readFileSync(bold).toString('base64') : regularB64;

const js = `// NotoSansThai font for pdfmake - Generated ${new Date().toISOString().split('T')[0]}
this.pdfMake = this.pdfMake || {};
this.pdfMake.vfs = {
  "NotoSansThai-Regular.ttf": "${regularB64}",
  "NotoSansThai-Bold.ttf": "${boldB64}"
};
`;

const outPath = path.join(__dirname, 'vfs_fonts_noto.js');
fs.writeFileSync(outPath, js);
const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);
console.log(`✓ vfs_fonts_noto.js を生成しました (${sizeMB} MB)`);
