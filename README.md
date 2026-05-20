# Slack 小論文自動添削Bot

高校2年生向け、毎日16時に記事とお題を自動配信し、スレッド返信を自動添削するSlack Bot。  
日本語Bot（`shoronbun-ja`）と英語Bot（`shoronbun-en`）の2アプリ構成。

---

## セットアップ手順

### 1. Slack App を2つ作成する

[api.slack.com/apps](https://api.slack.com/apps) で **日本語用・英語用それぞれ** Slack App を作成する。

各Appで以下を設定する：

#### OAuth & Permissions → Bot Token Scopes
| Scope | 用途 |
|---|---|
| `chat:write` | メッセージ投稿 |
| `channels:history` | チャンネル履歴読み取り |
| `groups:history` | プライベートチャンネル履歴 |

#### Event Subscriptions
- **Enable Events**: ON
- **Subscribe to bot events**: `app_mention`
- **Request URL**: `https://<your-server>/slack/events`

#### Workspaceにインストールして `Bot User OAuth Token` を取得する

---

### 2. 環境変数ファイルを作成する

```bash
cp .env.ja.example .env.ja
cp .env.en.example .env.en
```

`.env.ja` と `.env.en` それぞれに実際の値を記入する。

---

### 3. 起動する

```bash
# 日本語Bot（ポート3000）
npm run dev:ja

# 英語Bot（ポート3001）
npm run dev:en
```

本番環境では `npm run start:ja` / `npm run start:en` を使用し、  
`pm2` や `systemd` でプロセス管理することを推奨。

---

### 4. 今すぐ記事を手動投稿する（テスト用）

```bash
npm run post:ja
npm run post:en
```

---

## プロジェクト構造

```
src/
├── index.ts              # メインエントリ（Bolt起動 + Cronスケジューラ）
├── config.ts             # 環境変数管理
├── scheduler.ts          # 毎日16時の配信処理
├── post-now.ts           # 手動テスト投稿スクリプト
├── blocks/
│   └── article.ts        # Slack Block Kit レイアウト
├── generators/
│   ├── content.ts        # 記事・お題生成（Claude API）
│   └── feedback.ts       # 小論文添削生成（Claude API）
└── handlers/
    └── mention.ts        # app_mention イベントハンドラ
```

---

## 環境変数一覧

| 変数名 | 必須 | 説明 |
|---|---|---|
| `APP_LANG` | ✅ | `ja` または `en` |
| `SLACK_BOT_TOKEN` | ✅ | `xoxb-...` 形式のBot Token |
| `SLACK_SIGNING_SECRET` | ✅ | Slack App の Signing Secret |
| `CHANNEL_ID` | ✅ | 投稿先チャンネルID |
| `BOT_USER_ID` | 任意 | Bot の UserID（将来の拡張用） |
| `ANTHROPIC_API_KEY` | ✅ | Anthropic API キー |
| `ANTHROPIC_MODEL` | 任意 | 使用モデル（デフォルト: `claude-sonnet-4-6`） |
| `PORT` | 任意 | リッスンポート（デフォルト: `3000`） |
| `CRON_SCHEDULE` | 任意 | Cron式（デフォルト: `0 16 * * *`） |

---

## 動作フロー

```
毎日16:00 JST
  └─ Claude API でテーマ・記事・お題を生成
  └─ Slack Block Kit で整形して指定チャンネルに投稿

生徒がスレッドにメンション付きで回答
  └─ app_mention イベントを受信
  └─ スレッドの記事・お題・生徒の回答を取得
  └─ Claude API で添削文を生成
  └─ スレッドに返信
```
