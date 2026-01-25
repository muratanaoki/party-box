# 06. Next.js 基礎

## 概要

Next.js は React ベースのフルスタックフレームワーク。
SSR、SSG、API Routes など、モダンな Web 開発に必要な機能が揃っている。

## なぜ Next.js を学ぶのか

- React エコシステムの事実上の標準
- SSR/SSG でパフォーマンスと SEO を両立
- App Router で最新の React パターンを活用
- Vercel との統合で簡単デプロイ

---

## コア概念

### App Router vs Pages Router

Next.js 13 以降、2つのルーティング方式がある:

| 項目 | App Router (推奨) | Pages Router |
|------|-------------------|--------------|
| ディレクトリ | `app/` | `pages/` |
| コンポーネント | Server Components デフォルト | Client Components のみ |
| レイアウト | ネスト可能な `layout.tsx` | `_app.tsx` のみ |
| データ取得 | async/await | getServerSideProps 等 |

**Party Box は App Router を使用**

### ファイルベースルーティング

```
app/
├── page.tsx              → /
├── layout.tsx            → 全ページ共通レイアウト
├── globals.css           → グローバルスタイル
└── just-one/
    ├── page.tsx          → /just-one
    └── room/
        └── [roomId]/
            └── page.tsx  → /just-one/room/abc123
```

- `page.tsx` - ルートのメインコンテンツ
- `layout.tsx` - 共通レイアウト（ネスト可能）
- `[param]` - 動的ルート
- `loading.tsx` - ローディング UI
- `error.tsx` - エラー UI
- `not-found.tsx` - 404 ページ

---

## Server Components vs Client Components

### Server Components (デフォルト)

サーバーで実行され、HTML としてクライアントに送られる。

```typescript
// app/users/page.tsx (Server Component)
async function UsersPage() {
  // サーバーで直接データを取得
  const users = await db.users.findMany();

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

export default UsersPage;
```

**メリット:**
- バンドルサイズが小さい（JS を送らない）
- 直接 DB にアクセス可能
- シークレットを安全に扱える

**制限:**
- useState, useEffect が使えない
- ブラウザ API が使えない
- イベントハンドラが使えない

### Client Components

`"use client"` を付けると、従来の React コンポーネントになる。

```typescript
// components/Counter.tsx
"use client";

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

**使い所:**
- useState, useEffect を使う
- イベントハンドラを使う
- ブラウザ API を使う
- サードパーティライブラリ（Socket.io など）

### 使い分けの指針

```
┌─────────────────────────────────────────┐
│             Server Component            │
│  ┌───────────────────────────────────┐  │
│  │  データ取得、レイアウト、静的部分 │  │
│  │                                   │  │
│  │  ┌───────────────────────────┐    │  │
│  │  │   Client Component       │    │  │
│  │  │   インタラクティブ部分   │    │  │
│  │  └───────────────────────────┘    │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## データ取得パターン

### Server Component でのデータ取得

```typescript
// app/posts/page.tsx
async function PostsPage() {
  // 直接 fetch（自動的にキャッシュされる）
  const res = await fetch('https://api.example.com/posts');
  const posts = await res.json();

  return <PostList posts={posts} />;
}
```

### キャッシュ制御

```typescript
// キャッシュしない（毎回取得）
fetch(url, { cache: 'no-store' });

// 時間ベースの再検証
fetch(url, { next: { revalidate: 60 } }); // 60秒ごとに再検証

// タグベースの再検証
fetch(url, { next: { tags: ['posts'] } });
// revalidateTag('posts') で無効化
```

### Client Component でのデータ取得

```typescript
"use client";

import useSWR from 'swr';

function Profile() {
  const { data, error, isLoading } = useSWR('/api/user', fetcher);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;
  return <div>Hello {data.name}!</div>;
}
```

---

## Party Box での実装

### ディレクトリ構成

```
frontend/src/
├── app/
│   ├── layout.tsx        # ルートレイアウト
│   ├── page.tsx          # ホーム（ゲーム選択）
│   ├── globals.css
│   └── just-one/
│       ├── page.tsx      # ロビー
│       └── room/
│           └── [roomId]/
│               └── page.tsx  # ゲームルーム
├── components/
│   ├── common/
│   ├── lobby/
│   └── game/
├── hooks/
│   └── useSocket.ts
├── lib/
│   ├── socket.ts
│   └── storage.ts
└── types/
    └── game.ts
```

### ルートレイアウト

```typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
```

### 動的ルート

```typescript
// app/just-one/room/[roomId]/page.tsx
interface Props {
  params: Promise<{ roomId: string }>;
}

export default async function RoomPage({ params }: Props) {
  const { roomId } = await params;

  return <GameRoom roomId={roomId} />;
}
```

### Client Component での Socket.io 使用

```typescript
// components/game/GameRoom.tsx
"use client";

import { useSocket } from '@/hooks/useSocket';

export function GameRoom({ roomId }: { roomId: string }) {
  const {
    isConnected,
    roomState,
    joinRoom,
    submitHint,
  } = useSocket();

  useEffect(() => {
    if (isConnected && !roomState) {
      joinRoom(roomId, playerName);
    }
  }, [isConnected, roomId]);

  if (!roomState) {
    return <Loading />;
  }

  return (
    <div>
      {/* ゲーム UI */}
    </div>
  );
}
```

---

## ルーティングと画面遷移

### Link コンポーネント

```typescript
import Link from 'next/link';

function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/just-one">Just One</Link>
      <Link href={`/just-one/room/${roomId}`}>
        Enter Room
      </Link>
    </nav>
  );
}
```

### プログラマティック遷移

```typescript
"use client";

import { useRouter } from 'next/navigation';

function CreateRoomButton() {
  const router = useRouter();

  const handleCreate = async () => {
    const roomId = await createRoom();
    router.push(`/just-one/room/${roomId}`);
  };

  return <button onClick={handleCreate}>Create Room</button>;
}
```

---

## 環境変数

```bash
# .env.local（ローカル開発用）
OPENAI_API_KEY=sk-xxx           # サーバーのみ
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001  # クライアントにも公開
```

```typescript
// サーバー側
const apiKey = process.env.OPENAI_API_KEY;

// クライアント側（NEXT_PUBLIC_ プレフィックス必須）
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
```

---

## メタデータ

```typescript
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Party Box',
  description: 'オンラインパーティーゲーム',
};

// 動的メタデータ
// app/just-one/room/[roomId]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { roomId } = await params;
  return {
    title: `Room ${roomId} | Party Box`,
  };
}
```

---

## ハンズオン課題

### 課題 1: ルーティングを追跡

`frontend/src/app/` の構造を読んで、URL パスとコンポーネントの対応を表にまとめよう。

### 課題 2: Server vs Client を識別

`frontend/src/components/` 内のコンポーネントを見て:
1. `"use client"` があるものを一覧化
2. なぜ Client Component にしているのか理由を考える

### 課題 3: 新しいページを追加

`/about` ページを追加してみよう:

```typescript
// app/about/page.tsx
export default function AboutPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">About Party Box</h1>
      <p>マルチプレイヤーパーティーゲームプラットフォーム</p>
    </div>
  );
}
```

---

## よく使う機能

### Image コンポーネント

```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Party Box"
  width={200}
  height={100}
  priority  // LCP の画像に付ける
/>
```

### ローディング UI

```typescript
// app/just-one/loading.tsx
export default function Loading() {
  return <div>Loading...</div>;
}
```

### エラーハンドリング

```typescript
// app/just-one/error.tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

## 参考リソース

- [Next.js 公式ドキュメント](https://nextjs.org/docs)
- [App Router](https://nextjs.org/docs/app)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Learn Next.js](https://nextjs.org/learn) - 公式チュートリアル

---

## チェックリスト

- [ ] App Router のファイルベースルーティングを理解している
- [ ] Server Components と Client Components の違いを説明できる
- [ ] `"use client"` を付けるべき場面を判断できる
- [ ] 動的ルート `[param]` の使い方を理解している
- [ ] 環境変数の `NEXT_PUBLIC_` プレフィックスの意味を理解している
