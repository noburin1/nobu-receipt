のぶ帳簿 v7 FREE
Google Cloud Visionを完全に廃止。
Google APIキー・Google Cloud Billing・カード登録は不要です。

OCR: Cloudflare Workers AI / Gemma 4 26B
Cloudflare公式のWorkers Freeプランの無料AI枠を利用します。
wrangler.toml の [ai] binding = "AI" により自動接続します。

GitHub repoルートへ以下を上書き:
index.html
worker.js
sw.js
manifest.webmanifest
wrangler.toml

mainへCommitすると既存のGitHub→Cloudflare連携で自動デプロイされます。
既存帳簿データは localStorage nobu-receipt-v3 を継続します。
