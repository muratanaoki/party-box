# 08. テストツール

## 概要

テストはコードの品質を保証し、リファクタリングを安全に行うための基盤。
Party Box で使用するテストツールと手法を学ぶ。

## なぜテストを学ぶのか

- バグを早期に発見できる
- リファクタリングを安心して行える
- ドキュメントとしての役割
- CI/CD パイプラインで品質を自動チェック

---

## テストの種類

```
┌─────────────────────────────────────────┐
│              E2E Tests                   │ ← 少ない（遅い、高コスト）
│  ┌─────────────────────────────────┐    │
│  │       Integration Tests         │    │
│  │  ┌───────────────────────────┐  │    │
│  │  │      Unit Tests           │  │    │ ← 多い（速い、低コスト）
│  │  └───────────────────────────┘  │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
            テストピラミッド
```

| 種類 | 対象 | ツール |
|------|------|--------|
| Unit Test | 関数、クラス単体 | Jest |
| Integration Test | 複数モジュールの連携 | Jest + Supertest |
| E2E Test | ユーザーシナリオ全体 | Playwright |

---

## Jest 基礎

### 基本構文

```typescript
// sum.ts
export function sum(a: number, b: number): number {
  return a + b;
}

// sum.test.ts
import { sum } from './sum';

describe('sum', () => {
  it('should add two numbers', () => {
    expect(sum(1, 2)).toBe(3);
  });

  it('should handle negative numbers', () => {
    expect(sum(-1, 1)).toBe(0);
  });
});
```

### マッチャー (Matchers)

```typescript
// 等値
expect(value).toBe(3);           // 厳密等価 (===)
expect(obj).toEqual({ a: 1 });   // 深い比較

// 真偽
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// 数値
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThan(5);
expect(value).toBeCloseTo(0.3);  // 浮動小数点

// 文字列
expect(str).toMatch(/pattern/);
expect(str).toContain('substring');

// 配列
expect(arr).toContain(item);
expect(arr).toHaveLength(3);

// 例外
expect(() => fn()).toThrow();
expect(() => fn()).toThrow(Error);
expect(() => fn()).toThrow('message');

// 非同期
await expect(asyncFn()).resolves.toBe(value);
await expect(asyncFn()).rejects.toThrow();
```

### モック (Mock)

```typescript
// 関数モック
const mockFn = jest.fn();
mockFn.mockReturnValue(42);
mockFn.mockResolvedValue(42);  // Promise を返す
mockFn.mockRejectedValue(new Error());

// 呼び出し検証
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);

// モジュールモック
jest.mock('./module', () => ({
  someFunction: jest.fn().mockReturnValue('mocked'),
}));
```

### セットアップ/ティアダウン

```typescript
describe('Database tests', () => {
  beforeAll(async () => {
    // 全テスト前に1回
    await db.connect();
  });

  afterAll(async () => {
    // 全テスト後に1回
    await db.disconnect();
  });

  beforeEach(async () => {
    // 各テスト前
    await db.clear();
  });

  afterEach(() => {
    // 各テスト後
    jest.clearAllMocks();
  });
});
```

---

## NestJS でのテスト

### Testing Module

```typescript
import { Test, TestingModule } from '@nestjs/testing';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<IUserRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: 'IUserRepository',
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get('IUserRepository');
  });

  it('should find user by id', async () => {
    const user = { id: '1', name: 'Test' };
    repository.findById.mockResolvedValue(user);

    const result = await service.findById('1');

    expect(result).toEqual(user);
    expect(repository.findById).toHaveBeenCalledWith('1');
  });
});
```

### コントローラーのテスト

```typescript
describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  it('should return all users', async () => {
    const users = [{ id: '1', name: 'Test' }];
    service.findAll.mockResolvedValue(users);

    const result = await controller.findAll();

    expect(result).toEqual(users);
  });
});
```

---

## Party Box での UseCase テスト

```typescript
// submit-hint.usecase.spec.ts
describe('SubmitHintUseCase', () => {
  let useCase: SubmitHintUseCase;
  let mockRepository: jest.Mocked<IGameRepository>;
  let mockHintJudge: jest.Mocked<IHintJudgeService>;

  beforeEach(async () => {
    mockRepository = {
      findRoomById: jest.fn(),
      saveRoom: jest.fn(),
      deleteRoom: jest.fn(),
      roomExists: jest.fn(),
    };

    mockHintJudge = {
      generateTopic: jest.fn(),
      validateHintFormat: jest.fn(),
      validateHintAgainstTopic: jest.fn(),
      judgeHints: jest.fn(),
      judgeAnswer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmitHintUseCase,
        { provide: 'IGameRepository', useValue: mockRepository },
        { provide: 'IHintJudgeService', useValue: mockHintJudge },
      ],
    }).compile();

    useCase = module.get<SubmitHintUseCase>(SubmitHintUseCase);
  });

  describe('execute', () => {
    it('should throw RoomNotFoundError when room does not exist', async () => {
      mockRepository.findRoomById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          roomId: 'non-existent',
          playerId: 'player-1',
          hint: 'test',
        }),
      ).rejects.toThrow(RoomNotFoundError);
    });

    it('should submit hint successfully', async () => {
      // Arrange
      const room = createTestRoom();
      const game = createTestGame();
      room.game = game;

      mockRepository.findRoomById.mockResolvedValue(room);
      mockHintJudge.validateHintFormat.mockResolvedValue({ isValid: true });
      mockHintJudge.validateHintAgainstTopic.mockResolvedValue({ isValid: true });

      // Act
      const result = await useCase.execute({
        roomId: room.id,
        playerId: 'hinter-1',
        hint: 'test hint',
      });

      // Assert
      expect(result.room).toBeDefined();
      expect(mockRepository.saveRoom).toHaveBeenCalled();
    });

    it('should transition to GUESSING when all hints submitted', async () => {
      // Arrange
      const room = createTestRoom();
      const game = createTestGame({ hintersCount: 1 }); // ヒンター1人
      room.game = game;

      mockRepository.findRoomById.mockResolvedValue(room);
      mockHintJudge.validateHintFormat.mockResolvedValue({ isValid: true });
      mockHintJudge.validateHintAgainstTopic.mockResolvedValue({ isValid: true });
      mockHintJudge.judgeHints.mockResolvedValue([
        { playerId: 'hinter-1', isDuplicate: false },
      ]);

      // Act
      await useCase.execute({
        roomId: room.id,
        playerId: 'hinter-1',
        hint: 'test hint',
      });

      // Assert
      expect(mockHintJudge.judgeHints).toHaveBeenCalled();
      expect(room.game.phase).toBe('GUESSING');
    });
  });
});

// テストヘルパー
function createTestRoom(): Room {
  return new Room(
    'room-1',
    [
      Player.create('Guesser', true),
      Player.create('Hinter'),
    ],
  );
}

function createTestGame(options?: { hintersCount?: number }): JustOneGame {
  // ...
}
```

---

## React Testing Library

React コンポーネントのテスト。実際の DOM に近い形でテスト。

### 基本構文

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Counter', () => {
  it('should increment count on click', async () => {
    const user = userEvent.setup();

    render(<Counter />);

    // 要素を取得
    const button = screen.getByRole('button', { name: /increment/i });
    const count = screen.getByText(/count: 0/i);

    // クリック
    await user.click(button);

    // 結果を検証
    expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
  });
});
```

### クエリの種類

```typescript
// getBy* - 要素がない場合エラー
screen.getByRole('button');
screen.getByText('Hello');
screen.getByLabelText('Email');
screen.getByPlaceholderText('Enter name');
screen.getByTestId('submit-btn');

// queryBy* - 要素がない場合 null
screen.queryByRole('button');

// findBy* - 非同期、要素が現れるまで待つ
await screen.findByText('Loaded');

// *AllBy* - 複数要素を取得
screen.getAllByRole('listitem');
```

### 非同期テスト

```typescript
it('should load data', async () => {
  render(<UserProfile userId="1" />);

  // ローディング中
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // データ取得完了を待つ
  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### モックプロバイダー

```typescript
// Socket.io コンテキストをモック
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

render(
  <SocketContext.Provider value={{ socket: mockSocket }}>
    <GameRoom roomId="test-room" />
  </SocketContext.Provider>
);
```

---

## テストのベストプラクティス

### 1. AAA パターン

```typescript
it('should do something', () => {
  // Arrange (準備)
  const input = createTestInput();

  // Act (実行)
  const result = doSomething(input);

  // Assert (検証)
  expect(result).toBe(expected);
});
```

### 2. テストは独立させる

```typescript
// ❌ 悪い例: テスト間で状態を共有
let sharedState;

it('test 1', () => {
  sharedState = 'modified';
});

it('test 2', () => {
  // sharedState に依存 → テスト順序で結果が変わる
});

// ✅ 良い例: 各テストで状態をリセット
beforeEach(() => {
  // 状態をリセット
});
```

### 3. 実装ではなく振る舞いをテスト

```typescript
// ❌ 悪い例: 内部実装をテスト
expect(component.state.count).toBe(1);

// ✅ 良い例: ユーザーに見える振る舞いをテスト
expect(screen.getByText('Count: 1')).toBeInTheDocument();
```

### 4. テストデータはファクトリーで生成

```typescript
// テストファクトリー
function createTestPlayer(overrides?: Partial<Player>): Player {
  return {
    id: 'player-1',
    name: 'Test Player',
    isHost: false,
    isConnected: true,
    ...overrides,
  };
}

// 使用
const host = createTestPlayer({ isHost: true });
const disconnected = createTestPlayer({ isConnected: false });
```

---

## コードカバレッジ

```bash
# カバレッジレポートを生成
npm run test:cov

# 出力
--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
All files           |   85.71 |    75.00 |   80.00 |   85.71 |
 submit-hint.usecase|   90.00 |    80.00 |  100.00 |   90.00 |
--------------------|---------|----------|---------|---------|
```

カバレッジの目安:
- 80% 以上を目指す
- 100% にこだわりすぎない
- 重要なビジネスロジックは高カバレッジに

---

## ハンズオン課題

### 課題 1: ドメインモデルのテストを書く

`Player` クラスのテストを書いてみよう:

```typescript
describe('Player', () => {
  describe('create', () => {
    it('should create a new player with generated id', () => {
      // ...
    });
  });

  describe('disconnect', () => {
    it('should set isConnected to false', () => {
      // ...
    });
  });
});
```

### 課題 2: UseCase のテストを書く

既存の UseCase を選んで、以下のケースをテストしてみよう:
- 正常系
- 異常系（エラーケース）
- 境界値

### 課題 3: コンポーネントのテストを書く

`HintingPhase` コンポーネントのテストを書いてみよう:
- ヒント入力欄が表示されるか
- 提出ボタンをクリックすると emit されるか

---

## 参考リソース

- [Jest 公式ドキュメント](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Testing JavaScript](https://testingjavascript.com/) - Kent C. Dodds

---

## チェックリスト

- [ ] Jest の基本構文（describe, it, expect）を理解している
- [ ] マッチャーの種類と使い分けを理解している
- [ ] モックの作成と検証ができる
- [ ] NestJS の Testing Module を使ったテストが書ける
- [ ] React Testing Library でコンポーネントをテストできる
- [ ] AAA パターンでテストを構造化できる
