のぶ帳簿 v9 FREE FINAL

この版は Google Cloud Vision / Workers AI / 外部OCR API を使いません。
Google Billing、カード登録、APIキー、モデル利用規約への追加同意は不要です。

OCR方式:
PaddleOCR公式ブラウザSDK + PP-OCRv5 日本語
ブラウザ内で推論します。
初回のみJavaScript/WASM/モデルファイルをネットから読み込みます。

GitHub repo rootへ以下6ファイルを上書き:
index.html
manifest.webmanifest
sw.js
worker.js
wrangler.toml
README_v9_FREE_FINAL.txt

既存帳簿データは localStorage key "nobu-receipt-v3" を継続使用します。
