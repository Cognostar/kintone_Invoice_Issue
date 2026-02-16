# CLAUDE.md - Project Context for Claude Code

## Project Overview
kintone JavaScript customization for generating Invoice PDFs at Sato Kogyo Bangkok Co., Ltd.
Uses pdfmake library with NotoSansThai font for Thai/English bilingual invoice generation.

## Architecture
- `src/invoice-pdf.js` — Main kintone customization (IIFE pattern, no build step)
- `src/invoice-images.js` — Base64-encoded images (logo, stamp, signature)
- `tools/generate-vfs.js` — Font file generator (Node.js script)
- `tools/generate-images.js` — Image file generator (Node.js script)

## Key Conventions
- All JS files use ES5 syntax (kintone compatibility, no arrow functions, no let/const)
- pdfmake library loaded via CDN, fonts via custom vfs file
- Field codes follow snake_case naming (e.g., Customer_Name, Invoice_No)
- Subtable field code is 'テーブル' (Japanese, not renamed)
- Branch code '00000' = Head office (สำนักงานใหญ่)

## kintone App
- App: Receive Order Management App
- Space: Accounts Receivable (顧客からの受注関連)
- Domain: satobkk.cybozu.com

## Dependencies
- pdfmake 0.2.10 (CDN)
- NotoSansThai font (Google Fonts)

## Testing
Deploy to kintone → Open record detail → Click 「請求書PDF発行」 button
Verify: Logo, company info, customer info, line items, amounts, stamp, signature, ruling lines

## Future TODO
- Receipt (領収書) PDF generation
- Auto-attach generated PDF to kintone attachment field
- Support for branch office display (สาขา + branch number)
