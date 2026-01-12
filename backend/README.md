# Backend (NestJS)

Party Box のバックエンド。WebSocket でリアルタイム通信し、ゲームロジックとAI判定を担当。

## 技術

- **NestJS**: Node.js フレームワーク
- **Socket.io**: リアルタイム双方向通信
- **OpenAI API**: ヒントの重複判定（GPT-4o-mini）
- **Clean Architecture**: ドメイン駆動設計

## ディレクトリ構成

```
src/
├── domain/                      # ドメイン層（純粋なTypeScript、フレームワーク非依存）
│   ├── model/
│   │   ├── player.ts            # プレイヤー情報
│   │   ├── room.ts              # 部屋の管理
│   │   ├── game-base.ts         # ゲーム基底インターフェース & GameType
│   │   └── games/               # ゲーム別ディレクトリ
│   │       ├── index.ts         # Game 型のエクスポート
│   │       └── one-hint/
│   │           └── one-hint.game.ts  # One Hint ゲームロジック
│   ├── repository/
│   │   └── i-game.repository.ts
│   └── service/
│       └── i-hint-judge.service.ts
│
├── application/                 # アプリケーション層（ユースケース）
│   ├── usecase/
│   │   ├── create-room.usecase.ts
│   │   ├── join-room.usecase.ts
│   │   ├── start-game.usecase.ts
│   │   ├── submit-hint.usecase.ts
│   │   ├── submit-answer.usecase.ts
│   │   └── next-round.usecase.ts
│   └── dto/
│       └── game-action.dto.ts
│
├── infrastructure/              # インフラ層（技術的詳細）
│   ├── repository/
│   │   └── in-memory-game.repository.ts
│   ├── service/
│   │   └── openai-hint-judge.service.ts
│   └── module/
│       ├── app.module.ts
│       └── game.module.ts
│
├── presentation/                # プレゼンテーション層
│   └── gateway/
│       └── game.gateway.ts
│
└── main.ts
```

## 新しいゲームを追加する方法

### 1. GameType に追加

```typescript
// domain/model/game-base.ts
export type GameType = 'one-hint' | 'new-game';

export const GAME_CONFIGS: Record<GameType, GameConfig> = {
  'one-hint': { ... },
  'new-game': {
    minPlayers: 2,
    maxPlayers: 8,
    name: 'New Game',
    description: '新しいゲームの説明',
  },
};
```

### 2. ゲームロジックを作成

```
domain/model/games/new-game/
└── new-game.game.ts
```

```typescript
// new-game.game.ts
import { GameBase } from '../../game-base';

export interface NewGame extends GameBase {
  type: 'new-game';
  phase: 'PHASE1' | 'PHASE2' | 'RESULT';
  // ゲーム固有のフィールド
}

export function createNewGame(...): NewGame { ... }
```

### 3. games/index.ts を更新

```typescript
export * from './one-hint/one-hint.game';
export * from './new-game/new-game.game';

import { OneHintGame } from './one-hint/one-hint.game';
import { NewGame } from './new-game/new-game.game';

export type Game = OneHintGame | NewGame;
```

### 4. StartGameUseCase を更新

```typescript
private createGameByType(gameType: GameType, ...) {
  switch (gameType) {
    case 'one-hint':
      return createOneHintGame(...);
    case 'new-game':
      return createNewGame(...);
  }
}
```

### 5. Gateway の transformRoomForPlayer を更新

```typescript
switch (room.game.type) {
  case 'one-hint':
    return this.transformOneHintGameForPlayer(room.game, playerId);
  case 'new-game':
    return this.transformNewGameForPlayer(room.game, playerId);
}
```

### 6. ゲーム固有のユースケースを追加

必要に応じて `application/usecase/` に新しいユースケースを作成。

## Socket.io イベント

| イベント名 | 方向 | 説明 |
|-----------|------|------|
| `create-room` | Client → Server | 部屋作成（gameType指定可能） |
| `join-room` | Client → Server | 部屋参加 |
| `start-game` | Client → Server | ゲーム開始（ホストのみ） |
| `submit-hint` | Client → Server | ヒント提出（One Hint用） |
| `submit-answer` | Client → Server | 回答提出（One Hint用） |
| `next-round` | Client → Server | 次ラウンド（ホストのみ） |
| `room-updated` | Server → Client | 部屋状態のブロードキャスト |
| `error` | Server → Client | エラー通知 |

## ローカル実行（Docker外）

```bash
npm install
npm run start:dev
```

ポート: 4000
