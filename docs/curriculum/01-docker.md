# 01. Docker の仕組み

## 目次

1. [概要](#概要)
2. [コア概念](#コア概念) - イメージ、コンテナ、Dockerfile
3. [複数コンテナの管理](#複数コンテナの管理) - docker-compose、Volume、Network
4. [レイヤーキャッシュ](#レイヤーキャッシュ) - ビルド高速化の仕組み
5. [開発時の自動反映](#開発時の自動反映) - バインドマウント + ホットリロード
6. [深掘り](#深掘り) - 隔離の仕組み、VM との違い
7. [Party Box での実装](#party-box-での実装)
8. [よく使うコマンド](#よく使うコマンド)
9. [ハンズオン課題](#ハンズオン課題)

---

## 概要

Docker はアプリケーションをコンテナという単位で隔離・実行する技術。「自分の環境では動くのに...」という問題を解決し、開発から本番まで一貫した環境を提供する。

### なぜ Docker を学ぶのか

- 環境差異によるバグを防げる
- チーム全員が同じ環境で開発できる
- 本番環境と同じ構成でローカル開発できる
- CI/CD パイプラインで必須の技術

---

## コア概念

### 全体の流れ

```
Dockerfile（設計図）
    ↓ docker build
イメージ（パッケージ化されたもの）
    ↓ docker run
コンテナ（実行中のインスタンス）
```

| Docker     | 料理で例えると               |
| ---------- | ---------------------------- |
| Dockerfile | レシピ（紙）                 |
| イメージ   | 冷凍食品（パッケージ化済み） |
| コンテナ   | レンジでチンして食べてる状態 |

### イメージ (Image)

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

**確認方法:**

```bash
$ docker images
REPOSITORY            TAG          SIZE
party-box-backend     latest       377MB
party-box-frontend    latest       350MB
node                  20-alpine    50MB
```

### コンテナ (Container)

**イメージが起動された状態（インスタンス）**。

```
party-box-backend (イメージ)
    ↓ 起動
party-box-backend-1 (コンテナ) ← 実際に動いてるやつ
```

同じイメージから複数のコンテナを起動できる（同じ冷凍食品を何個もチンできる）。

**確認方法:**

```bash
$ docker ps
CONTAINER ID   IMAGE               STATUS
abc123         party-box-backend   Up 5 minutes
```

### Dockerfile

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

**各命令の意味:**

| 命令                    | 意味                                              |
| ----------------------- | ------------------------------------------------- |
| `FROM node:20-alpine`   | ベースイメージを指定（Alpine Linux + Node.js 20） |
| `WORKDIR /app`          | 作業フォルダを `/app` に設定                      |
| `COPY package*.json ./` | ローカルの package.json をコンテナにコピー        |
| `RUN npm ci`            | コンテナ内で npm ci を実行                        |
| `COPY . .`              | ローカルの全ファイルをコンテナにコピー            |
| `EXPOSE 3000`           | 使用ポートの宣言                                  |
| `CMD ["npm", "start"]`  | コンテナ起動時に実行するコマンド                  |

**COPY の動作:**

```
あなたのPC                    コンテナ（Alpine Linux）
┌──────────────┐              ┌──────────────┐
│ backend/     │    COPY →    │ /app/        │  ← WORKDIRで指定した場所
│  package.json│              │  package.json│
└──────────────┘              └──────────────┘
```

**RUN と CMD の違い:**

| 命令  | いつ実行？             | 用途               |
| ----- | ---------------------- | ------------------ |
| `RUN` | イメージビルド時       | インストール・準備 |
| `CMD` | コンテナ起動時（毎回） | アプリ実行         |

**npm ci と npm install の違い:**

|                 | npm install         | npm ci                         |
| --------------- | ------------------- | ------------------------------ |
| 使うファイル    | package.json を見る | package-lock.json を厳密に使う |
| node_modules    | 差分更新            | 一度削除して再インストール     |
| lock との不整合 | 勝手に直す          | エラーで落ちる                 |
| 用途            | 開発時              | CI/CD・本番環境                |

`npm ci` は「lock ファイル通りに確実にインストールする」コマンド。本番・CI 環境で「あれ、バージョン違う」を防げる。

**ベースイメージの種類:**

| タグ             | ベースOS     | サイズ  |
| ---------------- | ------------ | ------- |
| `node:20-alpine` | Alpine Linux | 約50MB  |
| `node:20`        | Debian       | 約350MB |
| `node:20-slim`   | Debian slim  | 約80MB  |

---

## 複数コンテナの管理

### docker-compose

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

### Volume

**データを永続化する仕組み**。コンテナは削除すると中のデータも消えるが、Volume を使えばデータを残せる。

```yaml
services:
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data # 名前付きVolume

volumes:
  postgres_data: # ここで定義
```

**Volume の種類:**

| 種類             | 書き方                       | 用途                             |
| ---------------- | ---------------------------- | -------------------------------- |
| 名前付きVolume   | `postgres_data:/var/lib/...` | DBデータなど永続化したいもの     |
| バインドマウント | `./src:/app/src`             | ローカルのコードをコンテナに同期 |

### Network

**コンテナ間の通信を管理する仕組み**。

docker-compose を使うと、同じ `docker-compose.yml` 内のサービスは自動的に同じネットワークに入る。

```
┌─────────────────────────────────────┐
│  docker-compose network (自動作成)   │
│                                     │
│  ┌──────────┐    ┌──────────┐      │
│  │ frontend │───→│ backend  │      │
│  │          │    │ :3001    │      │
│  └──────────┘    └──────────┘      │
│                                     │
└─────────────────────────────────────┘
```

**ポイント:**

- コンテナ間は**サービス名**で通信できる（例: `http://backend:3001`）
- `localhost` ではなくサービス名を使う
- 外部に公開するポートは `ports` で指定

```yaml
services:
  frontend:
    environment:
      - API_URL=http://backend:3001 # サービス名で指定
```

---

## レイヤーキャッシュ

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

### キャッシュの仕組み

Docker は**上から順番に**各レイヤーをチェックして、変更があったレイヤー以降を全て再ビルドする。

```
ソースコードだけ変更した場合:

Layer 1: FROM         → 変わってない → キャッシュ ✓
Layer 2: COPY pkg     → 変わってない → キャッシュ ✓
Layer 3: RUN npm ci   → 変わってない → キャッシュ ✓ （時間かかる処理をスキップ！）
Layer 4: COPY . .     → ソース変わった → 再実行 ← ここから下だけやり直し
Layer 5: CMD          → ↑が変わったから → 再実行
```

だから「変わりにくいもの（package.json）を先にコピー → 変わりやすいもの（ソースコード）を後にコピー」という順番にする。

**もし順番が逆だったら:**

```dockerfile
COPY . .         # ソースコード変わったらここから再実行
RUN npm ci       # 毎回実行される...遅い
```

ビルド速度のための重要な最適化テクニック。

---

## 開発時の自動反映

開発中に「ソース変えたら自動でコンテナに反映される」のは、2つの仕組みの組み合わせ。

### 1. バインドマウント

ローカルのファイルをコンテナに同期する。

```
ローカルPC              コンテナ
./src/index.ts    ←→    /app/src/index.ts
     ↓ 編集                  ↓ 即反映
```

### 2. ホットリロード

nodemon や Next.js の開発サーバーがファイル変更を検知して、自動で再起動/リビルドする。

### 設定例

```yaml
# 開発用 docker-compose.yml
services:
  backend:
    volumes:
      - ./backend/src:/app/src # バインドマウントでソースを同期
    command: npm run start:dev # nodemon などで起動
```

**レイヤーキャッシュとの違い:**

| 仕組み             | タイミング       | 用途                       |
| ------------------ | ---------------- | -------------------------- |
| レイヤーキャッシュ | イメージビルド時 | ビルド速度の最適化         |
| バインドマウント   | 開発時           | リアルタイムのファイル同期 |

---

## 深掘り

> このセクションは理解を深めるための補足情報。最初は読み飛ばしてもOK。

### 隔離の仕組み

Docker は Linux カーネルの機能を使って隔離を実現:

| 技術          | 役割                                           |
| ------------- | ---------------------------------------------- |
| **Namespace** | プロセス、ネットワーク、ファイルシステムを分離 |
| **cgroups**   | CPU、メモリなどのリソースを制限                |
| **UnionFS**   | レイヤー化されたファイルシステム               |

### VM との比較

| 比較項目   | VM（仮想マシン）       | Docker                   |
| ---------- | ---------------------- | ------------------------ |
| 起動時間   | 数分                   | 数秒                     |
| サイズ     | 数GB〜数十GB           | 数十MB〜数百MB           |
| OS         | 各VMがフルOSを持つ     | ホストOSのカーネルを共有 |
| 隔離レベル | 強い（完全に別のOS）   | 中程度（カーネル共有）   |
| 用途       | 異なるOSを動かしたい時 | アプリの環境統一         |

VM は**ハイパーバイザー**（VMware, VirtualBox など）が管理する。Docker は OS のカーネルを共有するため軽量。

### ランタイムとは

**ランタイム（Runtime）** は「プログラムを実行するために必要な環境」のこと。

**言語ランタイム:**

| 言語       | ランタイム                    |
| ---------- | ----------------------------- |
| JavaScript | Node.js, Deno, Bun            |
| Java       | JVM (Java Virtual Machine)    |
| Python     | Python インタプリタ (CPython) |
| Go         | なし（直接バイナリになる）    |

**コンテナランタイム:**

```
Docker CLI → Docker Engine → containerd → runc → Linux Kernel
```

- **containerd**: コンテナのライフサイクル管理
- **runc**: Namespace/cgroups を使って実際に隔離

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

| コマンド                         | 説明                   |
| -------------------------------- | ---------------------- |
| `docker build -t my-app .`       | イメージをビルド       |
| `docker run -p 3000:3000 my-app` | コンテナを起動         |
| `docker images`                  | イメージ一覧           |
| `docker ps`                      | 起動中のコンテナ一覧   |
| `docker exec -it <id> sh`        | コンテナに入る         |
| `docker-compose up`              | 全サービス起動         |
| `docker-compose up -d`           | バックグラウンドで起動 |
| `docker-compose up --build`      | 再ビルドして起動       |
| `docker-compose logs -f backend` | ログを確認             |
| `docker-compose down`            | 全て停止・削除         |

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
- [ ] Volume と Network の役割を説明できる
- [ ] 開発時の自動反映の仕組みを理解している
- [ ] マルチステージビルドのメリットを説明できる
