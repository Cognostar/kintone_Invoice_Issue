# CLAUDE.md - Project Context for Claude Code

## Project Overview
kintone JavaScript customization for generating Invoice and Receipt PDFs at Sato Kogyo Bangkok Co., Ltd.
Uses pdfmake library with NotoSansThai font for Thai/English bilingual document generation.

## Architecture
- `src/invoice-pdf.js` — Main kintone customization: Invoice & Receipt PDF generation (IIFE pattern, no build step)
- `src/invoice-images.js` — Base64-encoded images (logo, stamp, signature, collectorSign)
- `src/vfs_fonts_noto.js` — NotoSansThai font virtual file system for pdfmake
- `src/JS_URL.txt` — CDN URL reference for kintone JS/CSS settings
- `tools/generate-vfs.js` — Font file generator (Node.js script)
- `tools/generate-images.js` — Image file generator (Node.js script, supports logo/stamp/signature/collector_sign)
- `Original_Docs/Invoice.xlsx` — Excel invoice template (reference)
- `Original_Docs/Receipt.xlsx` — Excel receipt template (reference)
- `Original_Docs/Discount.xlsx` — Excel discount invoice template (reference)
- `Original_Docs/Discount_Pic.png` — kintone subtable screenshot with Discount_on_Invoice field
- `Original_Docs/Collector_Sign.png` — Collector signature image (source for collectorSign)

## Key Conventions
- All JS files use ES5 syntax (kintone compatibility, no arrow functions, no let/const)
- pdfmake library loaded via CDN, fonts via custom vfs file
- Field codes follow snake_case naming (e.g., Customer_Name, Invoice_No)
- Subtable field code is 'テーブル' (Japanese, not renamed)
- Branch code '00000' = Head office (สำนักงานใหญ่)
- buildPage() uses docType parameter ('invoice' or 'receipt') for conditional rendering
- UI text (buttons, dialogs, alerts) must be in English — app users are Thai staff
- PDF filename format: "{InvoiceNo}-{CustomerName}.pdf" / "{ReceiptNo}-{CustomerName}.pdf"

## Discount Display Logic
When Discount_on_Invoice has a value, PDF shows a "marked-up then discounted" view:
- displayPrice = Claim_Amount + Discount (shown as item amount and Total Price)
- ส่วนลด / Discount row shows the discount amount
- มูลค่าหลังหักส่วนลด / Total Amount After Discount row shows Claim_Amount
- VAT 7% is calculated on Claim_Amount (post-discount), not displayPrice
- Final Total Amount = Claim_Amount + VAT (unchanged from non-discount case)
- When Discount_on_Invoice is empty/zero, these rows are hidden (same as before)

## kintone App
- App: Receive Order Management App
- Space: Accounts Receivable (顧客からの受注関連)
- Domain: satobkk.cybozu.com

## kintone Main Record Fields
- PO_No — Purchase Order number (auto-appended to PDF description as REF. AS P/O NO.)

## kintone Subtable Fields (テーブル)
- Invoice_No, Invoice_Date, Invoice_Description, Claim_Amount, Receipt_No, W_T
- Cheque_Bank_Name, Cheque_Branch, Cheque_No, Cheque_Date
- Discount_on_Invoice — Discount amount for display on PDF
- Received_Date — Payment received date (auto-displayed on Receipt PDF)
- Invoice_Due_Date — Due date (auto-displayed on Invoice PDF, hidden on Receipt)

## Dependencies
- pdfmake 0.2.10 (CDN)
- NotoSansThai font (Google Fonts)

## Testing
Deploy to kintone → Open record detail
- Invoice: Click "Issue Invoice PDF" button (blue)
- Receipt: Click "Issue Receipt PDF" button (green)
Verify: Logo, company info, customer info, line items, amounts, stamp, signature, ruling lines
- Invoice: 5 copies, bank transfer info, "ผู้รับวางบิล / Receiver"
- Receipt: 4 copies, cheque info, "ผู้รับเงิน (Collector)", Tax Invoice title, Collector signature, received date

## pdfmake Layout Notes
- Text spacing: Use `margin: [left, top, right, bottom]` instead of prepending space characters (pdfmake ignores leading spaces in text)
- Invoice No./Date/Due Date block: `widths: [55, 85]` positions at ~73% from left (right 27% of page)
- Customer/Address values: `margin: [10, 0, 0, 0]` for indent from label
- สำนักงานใหญ่/สาขา checkboxes: `margin: [65, 2, 0, 0]` to align with Customer Name value

## Future TODO
- Auto-attach generated PDF to kintone attachment field
- Support for branch office display (สาขา + branch number)
