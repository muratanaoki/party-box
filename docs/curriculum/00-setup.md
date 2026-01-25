# 00. 環境構築

## 概要

Party Box の開発環境をセットアップする。
ローカル開発と Docker 開発の両方に対応。

---

## 必要なツール

| ツール | バージョン | 用途 |
|--------|------------|------|
| Node.js | 20+ | JavaScript ランタイム |
| npm | 10+ | パッケージマネージャー |
| Docker | 最新 | コンテナ実行環境 |
| Docker Compose | 最新 | マルチコンテナ管理 |
| VS Code | 最新 | エディタ（推奨） |

### VS Code 推奨拡張機能

```
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- Docker
- Thunder Client (API テスト用)
```

---

## セットアップ手順

### 方法 1: Docker を使用（推奨）

```bash
# 1. リポジトリをクローン
git clone <repository-url>
cd party-box

# 2. 環境変数を設定
cp .env.example .env
# .env を編集して OPENAI_API_KEY を設定

# 3. Docker で起動
docker-compose up --build

# 4. アクセス
# フロントエンド: http://localhost:3000
# バックエンド: http://localhost:4000
```

### 方法 2: ローカル起動

```bash
# 1. 環境変数を設定
cp .env.example .env
# .env を編集

# 2. バックエンド起動
cd backend
npm install
npm run start:dev

# 3. フロントエンド起動（別ターミナル）
cd frontend
npm install
npm run dev
```

---

## 環境変数

### ルートディレクトリ (`.env`)

```bash
# OpenAI API キー（必須）
OPENAI_API_KEY=sk-xxxx
```

### フロントエンド用

Next.js では `NEXT_PUBLIC_` プレフィックスを付けるとクライアントで使用可能。

```bash
# バックエンドの URL
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

---

## 開発サーバー

### ホットリロード

両方のサーバーはファイル変更を検知して自動リロードする。

| サービス | 技術 | 説明 |
|----------|------|------|
| Backend | NestJS watch mode | `nest start --watch` |
| Frontend | Turbopack | Next.js 15 のデフォルト |

### ポート

| サービス | ポート | URL |
|----------|--------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 4000 | http://localhost:4000 |

---

## 開発用テストページ

マルチプレイヤーテスト用の特別なページがある。

**URL:** `http://localhost:3000/just-one/dev`

このページは4つの iframe を表示し、それぞれ独立したプレイヤーとして動作する。
1人で複数プレイヤーの動作を確認できる。

---

## よく使うコマンド

### 開発

```bash
# Docker で起動
docker-compose up

# バックグラウンドで起動
docker-compose up -d

# ログを確認
docker-compose logs -f backend
docker-compose logs -f frontend

# 停止
docker-compose down
```

### ビルド

```bash
# バックエンド
cd backend && npm run build

# フロントエンド
cd frontend && npm run build
```

### 型チェック

```bash
# バックエンド
cd backend && npx tsc --noEmit

# フロントエンド
cd frontend && npx tsc --noEmit
```

### リント

```bash
cd backend && npm run lint
cd frontend && npm run lint
```

---

## トラブルシューティング

### Socket.io 接続エラー

**症状:** フロントエンドで「接続中...」が続く

**解決策:**
1. バックエンドが起動しているか確認
2. `NEXT_PUBLIC_SOCKET_URL` が正しいか確認
3. ブラウザの DevTools > Network > WS で接続状態を確認

### OpenAI API エラー

**症状:** ゲーム開始時やヒント提出時にエラー

**解決策:**
1. `.env` の `OPENAI_API_KEY` を確認
2. API クォータ（使用量制限）を確認
3. バックエンドログでエラー詳細を確認

### Docker メモリ不足

**症状:** コンテナがクラッシュする

**解決策:**
```bash
# Docker Desktop の設定で RAM を増やす（4GB 以上推奨）

# または、Docker を使わずローカル起動
docker-compose down
cd backend && npm run start:dev
cd frontend && npm run dev
```

### ポートが使用中

**症状:** `EADDRINUSE: address already in use`

**解決策:**
```bash
# 使用中のプロセスを確認
lsof -i :3000
lsof -i :4000

# プロセスを終了
kill -9 <PID>
```

### Docker キャッシュの問題

**症状:** 変更が反映されない

**解決策:**
```bash
# キャッシュを無視してビルド
docker-compose build --no-cache

# 全てクリア
docker-compose down -v
docker system prune -a
```

---

## プロジェクト構成

```
party-box/
├── backend/                 # NestJS バックエンド
│   ├── src/
│   │   ├── domain/          # ドメイン層
│   │   ├── application/     # アプリケーション層
│   │   ├── infrastructure/  # インフラ層
│   │   └── presentation/    # プレゼンテーション層
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                # Next.js フロントエンド
│   ├── src/
│   │   ├── app/             # App Router
│   │   ├── components/      # React コンポーネント
│   │   ├── hooks/           # カスタムフック
│   │   ├── lib/             # ユーティリティ
│   │   └── types/           # 型定義
│   ├── Dockerfile
│   └── package.json
│
├── docs/                    # ドキュメント
│   ├── ARCHITECTURE.md      # アーキテクチャ設計
│   ├── LEARNING.md          # 学習ロードマップ
│   └── curriculum/          # 学習カリキュラム
│
├── docker-compose.yml       # Docker Compose 設定
├── .env.example             # 環境変数サンプル
└── README.md
```

---

## 次のステップ

環境構築が完了したら、以下の順序で学習を進める:

1. [01-docker.md](./01-docker.md) - Docker の仕組みを理解
2. [03-nestjs.md](./03-nestjs.md) - バックエンドの基礎
3. [06-nextjs.md](./06-nextjs.md) - フロントエンドの基礎

---

## チェックリスト

- [ ] Node.js 20+ がインストールされている
- [ ] Docker がインストールされている
- [ ] OpenAI API キーを取得した
- [ ] `docker-compose up` でサービスが起動する
- [ ] http://localhost:3000 にアクセスできる
- [ ] 開発用テストページで4人プレイをテストできた
