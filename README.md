# Sato Kogyo Bangkok - Invoice PDF Generator for kintone

kintone受注管理アプリ上でInvoice PDFを生成するJavaScriptカスタマイズ。

## プロジェクト構成

```
sato-invoice-pdf/
├── src/
│   ├── invoice-pdf.js          # メインJS（kintoneにアップロード）
│   └── invoice-images.js       # ロゴ・署名・スタンプ画像（Base64）
├── tools/
│   ├── generate-vfs.js         # NotoSansThaiフォント → vfs_fonts_noto.js 生成
│   └── generate-images.js      # 画像 → invoice-images.js 生成
├── fonts/
│   └── (NotoSansThai-Regular.ttf, NotoSansThai-Bold.ttf を配置)
├── images/
│   └── (logo.png, signature.png, stamp.png を配置)
├── dist/                        # 生成されたファイル（.gitignore対象）
│   ├── vfs_fonts_noto.js
│   └── invoice-images.js
├── .gitignore
└── README.md
```

## kintone JS登録順

1. `pdfmake.min.js` — CDN: `https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/pdfmake.min.js`
2. `vfs_fonts_noto.js` — `tools/generate-vfs.js` で生成
3. `invoice-images.js` — `tools/generate-images.js` で生成（または `src/invoice-images.js`）
4. `invoice-pdf.js` — `src/invoice-pdf.js`

## セットアップ

### 1. フォント生成
```bash
cd fonts/
# NotoSansThai-Regular.ttf, NotoSansThai-Bold.ttf を配置
cd ../tools/
node generate-vfs.js    # → dist/vfs_fonts_noto.js
```

### 2. 画像生成（ロゴ・署名・スタンプ変更時のみ）
```bash
cd images/
# logo.png, signature.png, stamp.png を配置
cd ../tools/
node generate-images.js  # → dist/invoice-images.js
```

### 3. kintoneへデプロイ
アプリ設定 → JavaScript / CSSでカスタマイズ → 上記4ファイルを順番に登録

## 使用フィールドコード

### メインレコード
| フィールドコード | 用途 |
|---|---|
| Customer_Name | 顧客名 |
| Invoice_Name | Invoice用顧客名（優先） |
| Customer_Address | 顧客住所 |
| Customer_Tax_ID | 顧客Tax ID |
| Customer_Branch_Code | 支店コード（00000=本店） |

### サブテーブル（テーブル）
| フィールドコード | 用途 |
|---|---|
| Invoice_No | Invoice番号 |
| Invoice_Date | Invoice日付 |
| Invoice_Description | 明細（複数行テキスト） |
| Claim_Amount | 請求金額 |
| Receipt_No | 領収書番号 |
| W_T | WHT表示（Yes/No） |

## 機能
- ORIGINAL 1枚 + COPY 4枚 = 5ページ構成
- タイ語・英語混在対応（NotoSansThai）
- 会社ロゴ・署名・カンパニースタンプ埋め込み
- 自動VAT 7%計算 + 英語金額表記
- 複数Invoice選択ダイアログ
- 本店/支店自動判定
- WHT表示制御（サブテーブルのW_Tフィールド）
