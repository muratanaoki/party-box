# 09. Playwright (E2E テスト)

## 概要

Playwright は Microsoft が開発した E2E (End-to-End) テストフレームワーク。
実際のブラウザを操作してユーザーシナリオをテストする。

## なぜ Playwright を学ぶのか

- 実際のユーザー操作をシミュレートできる
- クロスブラウザテスト（Chrome, Firefox, Safari）
- 自動待機機能で安定したテスト
- ビジュアルテスト、スクリーンショット比較
- CI/CD パイプラインに統合しやすい

---

## E2E テストとは

```
Unit Test          →  関数・クラス単位
Integration Test   →  複数モジュールの連携
E2E Test           →  ユーザーシナリオ全体
```

E2E テストは:
- 実際のブラウザで動作
- フロントエンドからバックエンドまで通して確認
- ユーザー視点での品質保証

---

## セットアップ

```bash
# インストール
npm init playwright@latest

# ブラウザをインストール
npx playwright install
```

### 設定ファイル

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // モバイル
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // 開発サーバーを起動
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 基本構文

### テストの書き方

```typescript
// e2e/home.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the title', async ({ page }) => {
    // ページに移動
    await page.goto('/');

    // タイトルを検証
    await expect(page).toHaveTitle(/Party Box/);

    // 要素が表示されているか
    await expect(page.getByRole('heading', { name: 'Party Box' }))
      .toBeVisible();
  });

  test('should navigate to Just One game', async ({ page }) => {
    await page.goto('/');

    // ボタンをクリック
    await page.getByRole('link', { name: 'Just One' }).click();

    // URL が変わったか
    await expect(page).toHaveURL('/just-one');
  });
});
```

### Locator（要素の取得）

```typescript
// Role ベース（推奨）
page.getByRole('button', { name: 'Submit' });
page.getByRole('textbox', { name: 'Email' });
page.getByRole('link', { name: 'Home' });

// テキストベース
page.getByText('Welcome');
page.getByText(/welcome/i);  // 正規表現

// ラベルベース
page.getByLabel('Password');
page.getByPlaceholder('Enter your name');

// テスト用属性
page.getByTestId('submit-button');

// CSS セレクタ（最終手段）
page.locator('.submit-btn');
page.locator('#email-input');
```

### アクション

```typescript
// クリック
await page.getByRole('button').click();
await page.getByRole('button').dblclick();
await page.getByRole('button').click({ button: 'right' });

// 入力
await page.getByRole('textbox').fill('Hello');
await page.getByRole('textbox').clear();
await page.getByRole('textbox').type('Hello', { delay: 100 }); // ゆっくり入力

// キーボード
await page.keyboard.press('Enter');
await page.keyboard.press('Control+A');

// 選択
await page.getByRole('combobox').selectOption('option1');
await page.getByRole('checkbox').check();
await page.getByRole('checkbox').uncheck();

// ホバー
await page.getByRole('button').hover();

// ドラッグ&ドロップ
await page.dragAndDrop('#source', '#target');
```

### アサーション

```typescript
// 可視性
await expect(page.getByRole('button')).toBeVisible();
await expect(page.getByRole('button')).toBeHidden();

// テキスト
await expect(page.getByRole('heading')).toHaveText('Welcome');
await expect(page.getByRole('heading')).toContainText('Welcome');

// 属性
await expect(page.getByRole('button')).toBeEnabled();
await expect(page.getByRole('button')).toBeDisabled();
await expect(page.getByRole('textbox')).toHaveValue('test');
await expect(page.getByRole('checkbox')).toBeChecked();

// URL
await expect(page).toHaveURL('/dashboard');
await expect(page).toHaveURL(/dashboard/);

// タイトル
await expect(page).toHaveTitle('Party Box');
```

---

## Party Box の E2E テスト例

### ゲームフローのテスト

```typescript
// e2e/just-one.spec.ts
import { test, expect, Page } from '@playwright/test';

test.describe('Just One Game', () => {
  test.describe('Room Creation', () => {
    test('should create a room and show room ID', async ({ page }) => {
      await page.goto('/just-one');

      // 名前を入力
      await page.getByPlaceholder('名前を入力').fill('Host Player');

      // 部屋を作成
      await page.getByRole('button', { name: '部屋を作成' }).click();

      // ルームIDが表示される
      await expect(page.getByText(/ルームID:/)).toBeVisible();

      // URLが変わる
      await expect(page).toHaveURL(/\/just-one\/room\/.+/);
    });
  });

  test.describe('Game Flow', () => {
    test('full game flow with 2 players', async ({ browser }) => {
      // 2つのブラウザコンテキストを作成（2人のプレイヤー）
      const hostContext = await browser.newContext();
      const guestContext = await browser.newContext();

      const hostPage = await hostContext.newPage();
      const guestPage = await guestContext.newPage();

      // ホストが部屋を作成
      await hostPage.goto('/just-one');
      await hostPage.getByPlaceholder('名前を入力').fill('Host');
      await hostPage.getByRole('button', { name: '部屋を作成' }).click();

      // ルームIDを取得
      const roomIdText = await hostPage.getByText(/ルームID:/).textContent();
      const roomId = roomIdText?.replace('ルームID: ', '');

      // ゲストが参加
      await guestPage.goto('/just-one');
      await guestPage.getByPlaceholder('名前を入力').fill('Guest');
      await guestPage.getByPlaceholder('ルームIDを入力').fill(roomId!);
      await guestPage.getByRole('button', { name: '参加' }).click();

      // 両方のプレイヤーが見える
      await expect(hostPage.getByText('Guest')).toBeVisible();
      await expect(guestPage.getByText('Host')).toBeVisible();

      // ホストがゲームを開始
      await hostPage.getByRole('button', { name: 'ゲーム開始' }).click();

      // ゲームフェーズに遷移
      await expect(hostPage.getByText(/お題:/)).toBeVisible();

      // クリーンアップ
      await hostContext.close();
      await guestContext.close();
    });
  });
});
```

### Page Object Model

大規模なテストでは Page Object パターンを使う。

```typescript
// e2e/pages/lobby.page.ts
import { Page, Locator } from '@playwright/test';

export class LobbyPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly createRoomButton: Locator;
  readonly roomIdInput: Locator;
  readonly joinButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByPlaceholder('名前を入力');
    this.createRoomButton = page.getByRole('button', { name: '部屋を作成' });
    this.roomIdInput = page.getByPlaceholder('ルームIDを入力');
    this.joinButton = page.getByRole('button', { name: '参加' });
  }

  async goto() {
    await this.page.goto('/just-one');
  }

  async createRoom(name: string) {
    await this.nameInput.fill(name);
    await this.createRoomButton.click();
  }

  async joinRoom(name: string, roomId: string) {
    await this.nameInput.fill(name);
    await this.roomIdInput.fill(roomId);
    await this.joinButton.click();
  }
}

// e2e/pages/game-room.page.ts
export class GameRoomPage {
  readonly page: Page;
  readonly startGameButton: Locator;
  readonly hintInput: Locator;
  readonly submitHintButton: Locator;
  readonly answerInput: Locator;
  readonly submitAnswerButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.startGameButton = page.getByRole('button', { name: 'ゲーム開始' });
    this.hintInput = page.getByPlaceholder('ヒントを入力');
    this.submitHintButton = page.getByRole('button', { name: '提出' });
    this.answerInput = page.getByPlaceholder('回答を入力');
    this.submitAnswerButton = page.getByRole('button', { name: '回答する' });
  }

  async startGame() {
    await this.startGameButton.click();
  }

  async submitHint(hint: string) {
    await this.hintInput.fill(hint);
    await this.submitHintButton.click();
  }

  async submitAnswer(answer: string) {
    await this.answerInput.fill(answer);
    await this.submitAnswerButton.click();
  }

  async getRoomId(): Promise<string> {
    const text = await this.page.getByText(/ルームID:/).textContent();
    return text?.replace('ルームID: ', '') || '';
  }
}

// テストで使用
test('game flow', async ({ page }) => {
  const lobbyPage = new LobbyPage(page);
  const gamePage = new GameRoomPage(page);

  await lobbyPage.goto();
  await lobbyPage.createRoom('Host');

  const roomId = await gamePage.getRoomId();
  expect(roomId).toBeTruthy();
});
```

---

## 便利な機能

### スクリーンショット

```typescript
// 特定のタイミングで撮影
await page.screenshot({ path: 'screenshot.png' });

// フルページ
await page.screenshot({ path: 'full.png', fullPage: true });

// 要素のみ
await page.getByRole('dialog').screenshot({ path: 'dialog.png' });
```

### ビジュアル回帰テスト

```typescript
test('visual regression', async ({ page }) => {
  await page.goto('/');

  // スナップショットと比較
  await expect(page).toHaveScreenshot('home.png');

  // 特定の要素
  await expect(page.getByRole('header')).toHaveScreenshot('header.png');
});
```

### トレース

```typescript
// playwright.config.ts
use: {
  trace: 'on-first-retry', // 失敗時にトレースを記録
}

// トレースビューアーで確認
// npx playwright show-trace trace.zip
```

### デバッグモード

```bash
# デバッグモードで実行
npx playwright test --debug

# 特定のテストをデバッグ
npx playwright test home.spec.ts --debug

# UIモードで実行
npx playwright test --ui
```

### API リクエストのモック

```typescript
test('mock API', async ({ page }) => {
  // APIレスポンスをモック
  await page.route('**/api/users', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 1, name: 'Mock User' }]),
    });
  });

  await page.goto('/users');
  await expect(page.getByText('Mock User')).toBeVisible();
});
```

### WebSocket のテスト

```typescript
test('websocket', async ({ page }) => {
  // WebSocket メッセージを監視
  const wsPromise = page.waitForEvent('websocket');

  await page.goto('/just-one/room/test-room');

  const ws = await wsPromise;
  console.log('WebSocket URL:', ws.url());

  // メッセージを監視
  ws.on('framesent', frame => console.log('Sent:', frame.payload));
  ws.on('framereceived', frame => console.log('Received:', frame.payload));
});
```

---

## CI/CD 統合

### GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## テスト戦略

### 何をテストするか

**E2E でテストすべきもの:**
- ユーザーの主要な操作フロー
- クリティカルなビジネスシナリオ
- 複数ページにまたがる操作

**E2E でテストしないもの:**
- 個々のコンポーネントの詳細
- エッジケース（ユニットテストで）
- 外部サービスの詳細な挙動

### Party Box での優先順位

1. **高優先度**
   - 部屋の作成と参加
   - ゲームの開始から終了までのフロー
   - リアルタイム同期

2. **中優先度**
   - お題の再生成
   - エラー表示

3. **低優先度**
   - 細かい UI の挙動

---

## ハンズオン課題

### 課題 1: 基本的なテストを書く

ホームページのテストを書いてみよう:

```typescript
test.describe('Home Page', () => {
  test('should display game list', async ({ page }) => {
    await page.goto('/');
    // Just One が表示されているか
    // ...
  });
});
```

### 課題 2: マルチプレイヤーテスト

2人のプレイヤーが参加してゲームを進めるテストを書いてみよう。

### 課題 3: Page Object を作成

`LobbyPage` と `GameRoomPage` を完成させて、テストをリファクタリングしよう。

---

## コマンド一覧

```bash
# テスト実行
npx playwright test

# 特定のファイル
npx playwright test home.spec.ts

# 特定のブラウザ
npx playwright test --project=chromium

# 並列数を指定
npx playwright test --workers=4

# ヘッドありで実行（ブラウザが見える）
npx playwright test --headed

# デバッグモード
npx playwright test --debug

# UIモード
npx playwright test --ui

# レポートを表示
npx playwright show-report

# コードジェネレーター
npx playwright codegen localhost:3000
```

---

## 参考リソース

- [Playwright 公式ドキュメント](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright VS Code Extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)

---

## チェックリスト

- [ ] Playwright のセットアップができる
- [ ] Locator の種類と使い分けを理解している
- [ ] 基本的なアクション（click, fill など）を使える
- [ ] アサーション（expect）を適切に使える
- [ ] 複数ブラウザコンテキストでマルチユーザーテストが書ける
- [ ] Page Object Model を適用できる
- [ ] CI/CD に統合できる
