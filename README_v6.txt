# のぶ帳簿 v6 完成版

GitHub リポジトリ `noburin1/nobu-receipt` のルートに、
このZIP内の5ファイルを上書きアップロードしてください。

- index.html
- manifest.webmanifest
- sw.js
- worker.js
- wrangler.toml

CloudflareはGitHub連携済みのため、mainブランチへの反映後に自動デプロイされます。

Cloudflare側には Secret:
GOOGLE_VISION_API_KEY
が必要です。

既存データは localStorage キー `nobu-receipt-v3` を継続使用します。
