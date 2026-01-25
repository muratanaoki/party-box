# 03. NestJS 基礎

## 概要

NestJS は TypeScript で書かれた Node.js のバックエンドフレームワーク。
Angular にインスパイアされた構造化されたアーキテクチャが特徴。

## なぜ NestJS を学ぶのか

- TypeScript ファーストで型安全
- DI (依存性注入) が組み込み
- モジュール構造で大規模アプリに対応
- Express/Fastify の上に構築（既存知識が活かせる）
- WebSocket、GraphQL、マイクロサービス対応

---

## コア概念

### 1. Module（モジュール）

アプリケーションの構造単位。関連する機能をグループ化する。

```typescript
@Module({
  imports: [OtherModule],      // 他のモジュールをインポート
  controllers: [AppController], // HTTPリクエストを処理
  providers: [AppService],      // ビジネスロジック
  exports: [AppService],        // 他モジュールに公開
})
export class AppModule {}
```

```
AppModule (ルート)
├── GameModule
│   ├── GameGateway (WebSocket)
│   ├── CreateRoomUseCase
│   └── InMemoryGameRepository
└── ...
```

### 2. Controller（コントローラー）

HTTP リクエストを受け取り、レスポンスを返す。

```typescript
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll(): User[] {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): User {
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto): User {
    return this.usersService.create(createUserDto);
  }
}
```

### 3. Provider / Service（プロバイダー / サービス）

ビジネスロジックを担当。DI で注入される。

```typescript
@Injectable()
export class UsersService {
  private users: User[] = [];

  findAll(): User[] {
    return this.users;
  }

  findOne(id: string): User {
    return this.users.find(user => user.id === id);
  }

  create(dto: CreateUserDto): User {
    const user = { id: uuid(), ...dto };
    this.users.push(user);
    return user;
  }
}
```

### 4. DI (Dependency Injection)

依存関係を外部から注入する仕組み。テストしやすく、疎結合になる。

```typescript
// ❌ 依存を直接作成（密結合）
class UserController {
  private service = new UserService(); // 直接インスタンス化
}

// ✅ DIで注入（疎結合）
@Controller()
class UserController {
  constructor(private service: UserService) {} // 注入される
}
```

---

## Party Box での実装

### モジュール構成

```
backend/src/infrastructure/module/
├── app.module.ts     # ルートモジュール
└── game.module.ts    # ゲーム機能モジュール
```

### game.module.ts

```typescript
@Module({
  providers: [
    // Gateway (プレゼンテーション層)
    GameGateway,

    // UseCases (アプリケーション層)
    CreateRoomUseCase,
    JoinRoomUseCase,
    StartGameUseCase,
    SubmitHintUseCase,
    SubmitAnswerUseCase,
    NextRoundUseCase,
    RegenerateTopicUseCase,

    // Repository (インフラ層) - インターフェースにバインド
    {
      provide: 'IGameRepository',
      useClass: InMemoryGameRepository,
    },

    // Service (インフラ層) - インターフェースにバインド
    {
      provide: 'IHintJudgeService',
      useClass: OpenAIHintJudgeService,
    },
  ],
})
export class GameModule {}
```

### インターフェースへのバインド

```typescript
// ドメイン層でインターフェースを定義
interface IGameRepository {
  saveRoom(room: Room): Promise<void>;
  findRoomById(roomId: string): Promise<Room | null>;
}

// インフラ層で実装
@Injectable()
class InMemoryGameRepository implements IGameRepository {
  private rooms = new Map<string, Room>();

  async saveRoom(room: Room): Promise<void> {
    this.rooms.set(room.id, room);
  }

  async findRoomById(roomId: string): Promise<Room | null> {
    return this.rooms.get(roomId) || null;
  }
}

// モジュールでバインド
{
  provide: 'IGameRepository',
  useClass: InMemoryGameRepository,
}

// UseCase で注入
@Injectable()
class CreateRoomUseCase {
  constructor(
    @Inject('IGameRepository')
    private repository: IGameRepository,
  ) {}
}
```

---

## デコレーター一覧

### クラスデコレーター

| デコレーター | 用途 |
|--------------|------|
| `@Module()` | モジュール定義 |
| `@Controller()` | コントローラー定義 |
| `@Injectable()` | DI 可能なクラス |

### メソッドデコレーター（HTTP）

| デコレーター | HTTPメソッド |
|--------------|--------------|
| `@Get()` | GET |
| `@Post()` | POST |
| `@Put()` | PUT |
| `@Patch()` | PATCH |
| `@Delete()` | DELETE |

### パラメーターデコレーター

| デコレーター | 取得対象 |
|--------------|----------|
| `@Param()` | URLパラメーター |
| `@Query()` | クエリパラメーター |
| `@Body()` | リクエストボディ |
| `@Headers()` | リクエストヘッダー |

---

## WebSocket Gateway

Party Box では HTTP ではなく WebSocket を使用。

```typescript
@WebSocketGateway({
  cors: { origin: '*' },
})
export class GameGateway {
  @WebSocketServer()
  server: Server;

  // イベントを受信
  @SubscribeMessage('create-room')
  async handleCreateRoom(
    @MessageBody() data: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.createRoomUseCase.execute(data);
    client.join(result.roomId);
    return { event: 'room-created', data: result };
  }

  // 特定のルームにブロードキャスト
  broadcastToRoom(roomId: string, event: string, data: any) {
    this.server.to(roomId).emit(event, data);
  }
}
```

---

## ライフサイクル

NestJS アプリケーションのライフサイクル:

```
1. Bootstrap (main.ts)
   └── NestFactory.create(AppModule)

2. Module 初期化
   └── imports → providers → controllers

3. アプリケーション起動
   └── app.listen(3000)

4. リクエスト処理
   └── Middleware → Guards → Interceptors → Pipes → Handler

5. シャットダウン
   └── onModuleDestroy() → onApplicationShutdown()
```

---

## ハンズオン課題

### 課題 1: モジュール構造を読む

`backend/src/infrastructure/module/game.module.ts` を読んで:
1. どんな Provider が登録されているか
2. インターフェースへのバインドがどう行われているか

### 課題 2: 新しいエンドポイントを追加

簡単な HTTP エンドポイントを追加してみよう:

```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
```

### 課題 3: Gateway のイベントを追跡

`GameGateway` で定義されているイベントを一覧化し、
各イベントがどの UseCase を呼んでいるか図示してみよう。

---

## よく使う CLI コマンド

```bash
# 新しいモジュールを生成
nest g module users

# 新しいコントローラーを生成
nest g controller users

# 新しいサービスを生成
nest g service users

# 新しい Gateway を生成
nest g gateway chat
```

---

## 参考リソース

- [NestJS 公式ドキュメント](https://docs.nestjs.com/)
- [NestJS Fundamentals Course](https://courses.nestjs.com/)
- [NestJS Discord](https://discord.gg/nestjs)

---

## チェックリスト

- [ ] Module, Controller, Provider の役割を説明できる
- [ ] DI の仕組みとメリットを理解している
- [ ] `@Injectable()` と `@Inject()` の使い方を理解している
- [ ] WebSocket Gateway の基本を理解している
- [ ] インターフェースへのバインド方法を理解している
