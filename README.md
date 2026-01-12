# Party Box

URLを共有するだけで遊べる、リアルタイム・ボードゲームプラットフォーム。

## 第一弾ゲーム: One Hint

協力型ワード推測ゲーム。「ジャストワン」のクローン。

### ルール
1. 1人が「回答者」になり、お題を見れない
2. 他のプレイヤーは1単語ずつヒントを出す
3. **AIがヒントを判定** - 重複や無効なヒントは伏せ字になる
4. 回答者は有効なヒントだけを見て、お題を当てる

### 特徴
- **認証不要**: 名前を入力するだけで参加
- **データベース不要**: サーバーのメモリで管理（MVP）
- **AI審判**: OpenAI GPT-4o-mini がヒントの重複を判定

## 技術スタック

| 層 | 技術 |
|----|------|
| フロントエンド | Next.js 15, React 19, Tailwind CSS, Socket.io-client |
| バックエンド | NestJS, Socket.io, OpenAI API |
| インフラ | Docker, Docker Compose |

## ディレクトリ構成

```
party-box/
├── frontend/          # Next.js フロントエンド
├── backend/           # NestJS バックエンド (Clean Architecture)
├── docker-compose.yml # コンテナ管理
└── .env               # 環境変数 (OPENAI_API_KEY)
```

## 起動方法

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
2. 表示されるルームID（例: ABCD）を友達に共有
3. 3人以上集まったら「ゲームを開始」
4. ヒントを出す → AIが判定 → 回答者が答える
5. 正解/不正解を確認して次のラウンドへ

## 開発

ホットリロード対応。コードを変更すると自動で反映される。

```bash
# ログを見る
docker-compose logs -f

# 停止
docker-compose down
```
