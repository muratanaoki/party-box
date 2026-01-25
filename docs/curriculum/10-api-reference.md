# 10. WebSocket API リファレンス

## 概要

Party Box はリアルタイム通信に Socket.io を使用している。
REST API はなく、全ての通信が WebSocket イベントで行われる。

**接続先:** `ws://localhost:4000` (開発環境)

---

## 接続

### クライアント初期化

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  transports: ['websocket', 'polling'],
});

// 接続イベント
socket.on('connect', () => {
  console.log('接続成功:', socket.id);
});

socket.on('disconnect', () => {
  console.log('切断');
});
```

---

## イベント一覧

### クライアント → サーバー

| イベント | 用途 | 権限 |
|----------|------|------|
| `create-room` | 部屋を作成 | 誰でも |
| `join-room` | 部屋に参加 | 誰でも |
| `start-game` | ゲーム開始 | ホストのみ |
| `submit-hint` | ヒント提出 | 回答者以外 |
| `submit-answer` | 回答提出 | 回答者のみ |
| `next-round` | 次ラウンド | ホストのみ |
| `regenerate-topic` | お題再生成 | ホストのみ |

### サーバー → クライアント

| イベント | 用途 | 送信先 |
|----------|------|--------|
| `room-created` | 部屋作成完了 | 作成者 |
| `room-joined` | 参加完了 | 参加者 |
| `room-updated` | 状態更新 | ルーム全員 |
| `error` | エラー | 該当クライアント |

---

## イベント詳細

### `create-room`

新しい部屋を作成する。

**ペイロード:**
```typescript
{
  playerId: string;    // UUID
  playerName: string;  // 表示名
  gameType?: string;   // ゲームタイプ（デフォルト: "just-one"）
}
```

**例:**
```typescript
socket.emit('create-room', {
  playerId: '550e8400-e29b-41d4-a716-446655440000',
  playerName: 'たろう',
  gameType: 'just-one',
});
```

**レスポンス:** `room-created`

---

### `join-room`

既存の部屋に参加する。

**ペイロード:**
```typescript
{
  roomId: string;     // 4文字の部屋ID（例: "ABCD"）
  playerId: string;   // UUID
  playerName: string; // 表示名
}
```

**エラー:**
- 部屋が存在しない
- 部屋が満員

---

### `start-game`

ゲームを開始する（ホストのみ）。

**ペイロード:**
```typescript
{
  roomId: string;           // 部屋ID
  playerId: string;         // ホストのプレイヤーID
  totalRounds?: number;     // ラウンド数（デフォルト: 5）
  excludeTopics?: string[]; // 除外するお題リスト
}
```

**エラー:**
- `NotHostError`: ホストでない
- プレイヤー数不足（3人未満）

---

### `submit-hint`

ヒントを提出する（回答者以外）。

**ペイロード:**
```typescript
{
  roomId: string;   // 部屋ID
  playerId: string; // プレイヤーID
  hint: string;     // ヒント（1単語）
}
```

**エラー:**
- `HintNotSingleWordError`: 1単語でない
- `HintContainsTopicError`: お題を含む/関連しすぎる
- `InvalidPhaseError`: HINTING フェーズでない

---

### `submit-answer`

回答を提出する（回答者のみ）。

**ペイロード:**
```typescript
{
  roomId: string;   // 部屋ID
  playerId: string; // 回答者のプレイヤーID
  answer: string;   // 回答
}
```

**エラー:**
- `NotAnswererError`: 回答者でない
- `InvalidPhaseError`: GUESSING フェーズでない

---

### `next-round`

次のラウンドに進む（ホストのみ）。

**ペイロード:**
```typescript
{
  roomId: string;   // 部屋ID
  playerId: string; // ホストのプレイヤーID
}
```

**レスポンス:**
- 次ラウンドがある場合: HINTING フェーズに遷移
- 最終ラウンドの場合: FINISHED フェーズに遷移

---

### `regenerate-topic`

お題を再生成する（ホストのみ、HINTING フェーズのみ）。

**ペイロード:**
```typescript
{
  roomId: string;   // 部屋ID
  playerId: string; // ホストのプレイヤーID
}
```

---

## レスポンスイベント

### `room-updated`

部屋の状態が更新されるたびに、その部屋の全クライアントに送信される。

**ペイロード:** `RoomState`

```typescript
interface RoomState {
  id: string;
  players: Player[];
  gameType: 'just-one' | null;
  game: JustOneGame | null;
  createdAt: string;
}

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
}

interface JustOneGame {
  type: 'just-one';
  phase: 'HINTING' | 'GUESSING' | 'RESULT' | 'FINISHED';
  topic: string | null;      // 回答者には null
  answererId: string;
  hints: Hint[];
  answer: string | null;
  isCorrect: boolean | null;
  round: number;
  totalRounds: number;
  usedTopics: string[];
  roundResults: RoundResult[];
}

interface Hint {
  playerId: string;
  playerName: string;
  text: string | null;       // フェーズにより null
  isValid: boolean | null;   // AI 判定結果
}

interface RoundResult {
  round: number;
  topic: string;
  answererId: string;
  answererName: string;
  answer: string;
  isCorrect: boolean;
}
```

### プレイヤービューの変換

サーバーはプレイヤーごとに異なる状態を送信する（回答者にはお題を隠すなど）。

| フェーズ | 回答者 | その他のプレイヤー |
|----------|--------|-------------------|
| HINTING | `topic: null`, `hints: []` | `topic: 表示`, `hints: [{text: null}]` |
| GUESSING | `topic: null`, `hints: [有効のみ]` | `topic: 表示`, `hints: [有効のみ]` |
| RESULT | 全て表示 | 全て表示 |
| FINISHED | 全て表示 | 全て表示 |

---

### `error`

エラー発生時に送信される。

**ペイロード:**
```typescript
{
  message: string; // エラーメッセージ
}
```

**エラーメッセージ例:**

| メッセージ | 原因 |
|------------|------|
| `Room XXXX not found` | 存在しない部屋ID |
| `Game has not started` | ゲーム未開始 |
| `Cannot perform action in current phase` | 不正なフェーズでのアクション |
| `Only the host can perform this action` | ホスト以外が操作 |
| `ヒントは1単語で入力してください` | ヒントが複数語 |
| `ヒントにお題を含めることはできません` | ヒントがお題と関連しすぎ |
| `Only the answerer can submit an answer` | 回答者以外が回答 |

---

## シーケンス図

### ゲーム全体フロー

```
Client A (Host)        Server              Client B, C...
    │                    │                      │
    │  create-room       │                      │
    │───────────────────>│                      │
    │  room-created      │                      │
    │<───────────────────│                      │
    │  room-updated      │                      │
    │<───────────────────│                      │
    │                    │                      │
    │                    │     join-room        │
    │                    │<─────────────────────│
    │                    │     room-joined      │
    │                    │─────────────────────>│
    │  room-updated      │     room-updated     │
    │<───────────────────│─────────────────────>│
    │                    │                      │
    │  start-game        │                      │
    │───────────────────>│                      │
    │  room-updated      │     room-updated     │
    │<───────────────────│─────────────────────>│
    │                    │                      │
    │  [HINTING Phase]   │                      │
    │                    │     submit-hint      │
    │                    │<─────────────────────│
    │  room-updated      │     room-updated     │
    │<───────────────────│─────────────────────>│
    │                    │                      │
    │  [全員提出後: AI判定 → GUESSING Phase]    │
    │                    │                      │
    │  [回答者のみ]       │                      │
    │                    │     submit-answer    │
    │                    │<─────────────────────│
    │                    │                      │
    │  [RESULT Phase]    │                      │
    │  room-updated      │     room-updated     │
    │<───────────────────│─────────────────────>│
    │                    │                      │
    │  next-round        │                      │
    │───────────────────>│                      │
    │                    │                      │
    │  [HINTING or FINISHED]                    │
    │  room-updated      │     room-updated     │
    │<───────────────────│─────────────────────>│
```

---

## React での使用例

### useSocket フック

```typescript
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    socket = io('http://localhost:4000');

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('room-updated', setRoomState);
    socket.on('error', (data) => setError(data.message));

    return () => {
      socket?.disconnect();
    };
  }, []);

  const createRoom = useCallback((playerId: string, playerName: string) => {
    socket?.emit('create-room', { playerId, playerName });
  }, []);

  const joinRoom = useCallback((roomId: string, playerId: string, playerName: string) => {
    socket?.emit('join-room', { roomId, playerId, playerName });
  }, []);

  const submitHint = useCallback((roomId: string, playerId: string, hint: string) => {
    socket?.emit('submit-hint', { roomId, playerId, hint });
  }, []);

  const submitAnswer = useCallback((roomId: string, playerId: string, answer: string) => {
    socket?.emit('submit-answer', { roomId, playerId, answer });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    isConnected,
    roomState,
    error,
    createRoom,
    joinRoom,
    submitHint,
    submitAnswer,
    clearError,
  };
}
```

---

## デバッグ方法

### ブラウザ DevTools

1. **Network タブ** > WS フィルター
2. 接続を選択して Messages を確認
3. 送受信されるイベントをリアルタイムで確認

### バックエンドログ

```bash
# Docker
docker-compose logs -f backend

# ローカル
cd backend && npm run start:dev
```

---

## チェックリスト

- [ ] Socket.io の接続/切断イベントを理解している
- [ ] 各イベントのペイロード形式を理解している
- [ ] プレイヤービューの変換ルールを理解している
- [ ] エラーハンドリングの方法を理解している
- [ ] useSocket フックの実装を理解している
