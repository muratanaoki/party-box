# 01. Docker の仕組み

## 概要

Docker はアプリケーションをコンテナという単位で隔離・実行する技術。
「自分の環境では動くのに...」という問題を解決し、開発から本番まで一貫した環境を提供する。

## なぜ Docker を学ぶのか

- 環境差異によるバグを防げる
- チーム全員が同じ環境で開発できる
- 本番環境と同じ構成でローカル開発できる
- CI/CD パイプラインで必須の技術

---

## コア概念

### 全体の流れ（3ステップ）

```
Dockerfile（設計図）
    ↓ docker build
イメージ（パッケージ化されたもの）
    ↓ docker run
コンテナ（実行中の状態）
```

| Docker     | 料理で例えると               |
| ---------- | ---------------------------- |
| Dockerfile | レシピ（紙）                 |
| イメージ   | 冷凍食品（パッケージ化済み） |
| コンテナ   | レンジでチンして食べてる状態 |

### 1. イメージ (Image)

**OS ごとパッケージ化されたアプリの箱**。読み取り専用。

```
イメージの中身:
┌─────────────────┐
│  あなたのコード   │
│  Node.js        │
│  Linux (OS)     │  ← OSも含まれてる！
└─────────────────┘
```

「Node.js だけ」じゃなくて「**Linux OS + Node.js**」がセットで入っている。だから「どの環境でも同じように動く」が実現できる。

**イメージはどこにある？**

- Docker Desktop の「Images」タブで確認できる
- `docker images` コマンドでも一覧表示できる

```bash
$ docker images
REPOSITORY            TAG          SIZE
party-box-backend     latest       377MB
party-box-frontend    latest       350MB
node                  20-alpine    50MB
```

### 2. コンテナ (Container)

**イメージが起動された状態**。

```
party-box-backend (イメージ)
    ↓ 起動
party-box-backend-1 (コンテナ) ← 実際に動いてるやつ
```

- Docker Desktop の「Containers」タブで確認できる
- 同じイメージから複数のコンテナを起動できる（同じ冷凍食品を何個もチンできる）

### 3. Dockerfile

イメージを作るための手順書（ただのテキストファイル）。

```dockerfile
# ベースイメージ（土台となるOS + ランタイム）
FROM node:20-alpine

# 作業ディレクトリを設定
WORKDIR /app

# 依存関係ファイルをコピー（キャッシュ効率化のため先にコピー）
COPY package*.json ./

# 依存関係をインストール
RUN npm ci

# アプリケーションコードをコピー
COPY . .

# ビルド
RUN npm run build

# ポートを公開
EXPOSE 3000

# 起動コマンド
CMD ["npm", "start"]
```

#### 各命令の意味

| 命令                    | 意味                                                   |
| ----------------------- | ------------------------------------------------------ |
| `FROM node:20-alpine`   | ベースイメージを指定（Alpine Linux + Node.js 20）      |
| `WORKDIR /app`          | 作業フォルダを `/app` に設定（`cd /app` みたいなもの） |
| `COPY package*.json ./` | ローカルの package.json をコンテナの /app にコピー     |
| `RUN npm ci`            | コンテナ内で npm ci を実行                             |
| `COPY . .`              | ローカルの全ファイルをコンテナの /app にコピー         |
| `EXPOSE 3000`           | 「このコンテナは3000番ポートを使う」という宣言         |
| `CMD ["npm", "start"]`  | コンテナ起動時に実行するコマンド                       |

#### COPY はどこからどこへ？

**あなたの PC（ローカル）→ コンテナ内** にファイルをコピーする。

```
COPY package*.json ./

あなたのPC                    コンテナ（Alpine Linux）
┌──────────────┐              ┌──────────────┐
│ backend/     │    COPY →    │ /app/        │
│  package.json│              │  package.json│
└──────────────┘              └──────────────┘
```

#### /app はどこ？

**コンテナ内の Linux のディレクトリ**。あなたの Mac の /app じゃない。

```
あなたのMac                コンテナ（別世界）
┌─────────────┐           ┌─────────────┐
│ /Users/     │           │ /app/       │  ← ここで作業
│ yourname/   │           │ /bin/       │
│ projects/   │           │ /etc/       │
└─────────────┘           └─────────────┘
   macOS                    Alpine Linux
```

#### RUN と CMD の違い

| 命令  | いつ実行？                   | 用途                     |
| ----- | ---------------------------- | ------------------------ |
| `RUN` | **イメージをビルドするとき** | インストールとか準備作業 |
| `CMD` | **コンテナを起動するとき**   | アプリを動かすコマンド   |

```dockerfile
RUN npm install          # ← ビルド時に1回だけ実行
CMD ["npm", "start"]     # ← コンテナ起動するたびに実行
```

#### ベースイメージの種類

| タグ             | ベースOS     | サイズ         |
| ---------------- | ------------ | -------------- |
| `node:20-alpine` | Alpine Linux | 約50MB（軽量） |
| `node:20`        | Debian       | 約350MB        |
| `node:20-slim`   | Debian slim  | 約80MB         |

### 4. docker-compose

複数コンテナをまとめて管理するツール。

```yaml
# docker-compose.yml
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgres://...
```

---

## Docker の仕組み（深掘り）

### レイヤー構造

Docker イメージは複数の「レイヤー」で構成される。各命令が1つのレイヤーを作る。

```
┌─────────────────────────┐
│ CMD ["npm", "start"]    │ ← Layer 5 (実行コマンド)
├─────────────────────────┤
│ COPY . .                │ ← Layer 4 (アプリコード)
├─────────────────────────┤
│ RUN npm ci              │ ← Layer 3 (依存関係)
├─────────────────────────┤
│ COPY package*.json ./   │ ← Layer 2 (package.json)
├─────────────────────────┤
│ FROM node:20-alpine     │ ← Layer 1 (ベースイメージ)
└─────────────────────────┘
```

**レイヤーキャッシュ**: 変更がないレイヤーは再利用される。だから `package.json` を先にコピーする。

### 隔離の仕組み

Docker は Linux カーネルの機能を使って隔離を実現:

| 技術          | 役割                                           |
| ------------- | ---------------------------------------------- |
| **Namespace** | プロセス、ネットワーク、ファイルシステムを分離 |
| **cgroups**   | CPU、メモリなどのリソースを制限                |
| **UnionFS**   | レイヤー化されたファイルシステム               |

VM（仮想マシン）との違い:

```
VM:     ホストOS → ハイパーバイザ → ゲストOS → アプリ
Docker: ホストOS → Docker Engine → アプリ（OSを共有）
```

→ Docker の方が軽量で起動が速い

---

## Party Box での実装

### backend/Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
```

### docker-compose.yml

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
```

---

## よく使うコマンド

```bash
# イメージをビルド
docker build -t my-app .

# コンテナを起動
docker run -p 3000:3000 my-app

# docker-compose で全サービス起動
docker-compose up

# バックグラウンドで起動
docker-compose up -d

# ログを確認
docker-compose logs -f backend

# コンテナに入る
docker exec -it <container_id> sh

# 全て停止・削除
docker-compose down
```

---

## ハンズオン課題

### 課題 1: Dockerfile を読み解く

`backend/Dockerfile` を読んで、以下の質問に答えよ:

1. なぜ `COPY package*.json ./` を `COPY . .` より先に書くのか？
2. `npm ci` と `npm install` の違いは？

### 課題 2: docker-compose で起動

```bash
# Party Box を Docker で起動してみよう
docker-compose up --build
```

ブラウザで `http://localhost:3000` にアクセスして動作確認。

### 課題 3: マルチステージビルド

本番用のより最適化された Dockerfile を書いてみよう:

```dockerfile
# ビルドステージ
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 実行ステージ（軽量）
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/main"]
```

---

## 参考リソース

- [Docker 公式ドキュメント](https://docs.docker.com/)
- [Docker Compose ドキュメント](https://docs.docker.com/compose/)
- [Dockerfile ベストプラクティス](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Play with Docker](https://labs.play-with-docker.com/) - ブラウザで Docker を試せる

---

## チェックリスト

- [ ] イメージとコンテナの違いを説明できる
- [ ] Dockerfile の各命令の意味を理解している
- [ ] レイヤーキャッシュの仕組みを理解している
- [ ] docker-compose で複数コンテナを起動できる
- [ ] マルチステージビルドのメリットを説明できる
