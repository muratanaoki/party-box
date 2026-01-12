# Frontend (Next.js)

Party Box のフロントエンド。ブラウザで動作するゲームUI。

## 技術

- **Next.js 15**: React フレームワーク（App Router）
- **React 19**: UI ライブラリ
- **Tailwind CSS v4**: スタイリング
- **Socket.io-client**: バックエンドとのリアルタイム通信

## ディレクトリ構成

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # 共通レイアウト
│   ├── page.tsx                # トップページ（名前入力、部屋作成/参加）
│   ├── globals.css             # グローバルスタイル
│   └── room/
│       └── [roomId]/
│           └── page.tsx        # ゲームルーム画面
│
├── components/                 # Reactコンポーネント
│   ├── common/
│   │   └── PlayerList.tsx      # プレイヤー一覧表示
│   ├── lobby/
│   │   └── LobbyView.tsx       # ロビー画面（待機中）
│   └── game/
│       ├── HintingPhase.tsx    # ヒント入力画面
│       ├── GuessingPhase.tsx   # 回答画面
│       └── ResultPhase.tsx     # 結果画面
│
├── hooks/
│   └── useSocket.ts            # Socket.io 接続管理フック
│
├── lib/
│   └── socket.ts               # Socket.io クライアント設定
│
└── types/
    └── game.ts                 # 型定義（Player, Room, Game など）
```

## 画面遷移

```
[トップページ /]
    │
    ├─ 部屋を作成 → [ゲームルーム /room/ABCD]
    │
    └─ ルームIDで参加 → [ゲームルーム /room/ABCD]


[ゲームルーム /room/ABCD]
    │
    ├─ ゲーム未開始 → LobbyView（プレイヤー一覧、開始ボタン）
    │
    └─ ゲーム中
        ├─ HINTING  → HintingPhase（お題表示、ヒント入力）
        ├─ GUESSING → GuessingPhase（ヒント一覧、回答入力）
        └─ RESULT   → ResultPhase（正解発表、次ラウンドボタン）
```

## 主要コンポーネント

### `page.tsx`（トップページ）
- 名前入力フォーム
- 「部屋を作成」ボタン
- ルームID入力 + 「参加」ボタン
- プレイヤーIDをlocalStorageに保存（再接続用）

### `room/[roomId]/page.tsx`（ゲームルーム）
- URLからルームIDを取得
- Socket.io で部屋に参加
- ゲームフェーズに応じてコンポーネント切り替え

### `useSocket.ts`（カスタムフック）
- Socket.io 接続の管理
- イベント送信関数（createRoom, joinRoom, submitHint など）
- 部屋状態（roomState）の管理

## データフロー

```
[ユーザー操作]
    ↓
[useSocket] emit('submit-hint', {...})
    ↓ WebSocket
[バックエンド] 処理
    ↓ WebSocket
[useSocket] on('room-updated', state => setRoomState(state))
    ↓
[コンポーネント] roomState を元に再描画
```

## 状態管理

- **グローバル状態なし**: useSocket フックで完結
- **localStorage**: playerId, playerName を保存（ブラウザリロード対応）

## 環境変数

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `NEXT_PUBLIC_SOCKET_URL` | バックエンドURL | `http://localhost:4000` |

## ローカル実行（Docker外）

```bash
npm install
npm run dev
```

ポート: 3000
