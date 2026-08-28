のぶ帳簿 v11 FREE FINAL

OCR起動処理を修正。
- 静的ES module importを廃止し、OCRボタン押下後に動的ロード。
- 失敗時は画面に具体的な初期化エラーを表示。
- @paddleocr/paddleocr-js を 0.4.2 に固定。
- PaddleOCR公式Quick Startどおり ortOptions: { backend: "auto" } を使用。
- predict() はまず撮影した File/Blob を直接渡す。
- 横向き認識が弱い場合だけ90/270度補正を実施。
- OCR中はボタン表示を「OCR処理中…」に変更。

無料・カード不要・APIキー不要。
Google Vision / Workers AI は使用しません。
