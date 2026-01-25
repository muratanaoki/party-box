# Party Box

URL を共有するだけで遊べる、リアルタイム・マルチプレイヤー・ボードゲームプラットフォーム。

## 第一弾ゲーム: Just One

協力型ワード推測ゲーム。「ジャストワン」のクローン。

### ルール

1. 1 人が「回答者」になり、お題を見れない
2. 他のプレイヤーは 1 単語ずつヒントを出す
3. **AI がヒントを判定** - 重複や無効なヒントは伏せ字になる
4. 回答者は有効なヒントだけを見て、お題を当てる

### 特徴

- **認証不要**: 名前を入力するだけで参加
- **データベース不要**: サーバーのメモリで管理（MVP）
- **AI 審判**: OpenAI GPT-4o-mini がヒントの重複・妥当性を判定

## 技術スタック

| 層             | 技術                                                 |
| -------------- | ---------------------------------------------------- |
| フロントエンド | Next.js 15, React 19, Tailwind CSS 4, Socket.io-client |
| バックエンド   | NestJS 10, Socket.io, OpenAI API                     |
| インフラ       | Docker, Docker Compose                               |

## ディレクトリ構成

```
party-box/
├── frontend/              # Next.js フロントエンド
│   └── src/
│       ├── app/           # App Router ページ
│       ├── components/    # React コンポーネント
│       ├── hooks/         # カスタムフック
│       ├── lib/           # ユーティリティ
│       └── types/         # TypeScript 型定義
├── backend/               # NestJS バックエンド (Clean Architecture)
│   └── src/
│       ├── domain/        # ドメイン層（ビジネスロジック）
│       ├── application/   # アプリケーション層（ユースケース）
│       ├── infrastructure/# インフラ層（リポジトリ・外部サービス）
│       └── presentation/  # プレゼンテーション層（Gateway）
├── docs/                  # 技術ドキュメント
├── docker-compose.yml     # コンテナ管理
└── .env                   # 環境変数 (OPENAI_API_KEY)
```

## クイックスタート

### 1. 環境変数を設定

```bash
cp .env.example .env
# .env を編集して OPENAI_API_KEY を設定
```

### 2. Docker で起動

```bash
docker-compose up
```

### 3. ブラウザでアクセス

http://localhost:3000

## 遊び方

1. 名前を入力して「部屋を作成」
2. 表示されるルーム ID（例: ABCD）を友達に共有
3. 3 人以上集まったら「ゲームを開始」
4. ヒントを出す → AI が判定 → 回答者が答える
5. 正解/不正解を確認して次のラウンドへ

## 開発

ホットリロード対応。コードを変更すると自動で反映される。

```bash
# ログを見る
docker-compose logs -f

# 停止
docker-compose down

# 個別起動（Docker なし）
cd backend && npm run start:dev
cd frontend && npm run dev
```

## ドキュメント

詳細な技術ドキュメントは `docs/` ディレクトリを参照:

- [学習ロードマップ](docs/LEARNING.md) - このプロジェクトで学べる技術カリキュラム
- [アーキテクチャ設計](docs/ARCHITECTURE.md) - システム構成、Clean Architecture

## ライセンス

MIT
