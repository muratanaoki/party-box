'use client';

import Link from 'next/link';

const GAMES = [
  {
    id: 'one-hint',
    name: 'One Hint',
    description: 'AIが審判の協力型ワード推測ゲーム',
    minPlayers: 3,
    maxPlayers: 10,
    color: 'blue',
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Party Box</h1>
          <p className="text-gray-400">みんなで遊ぼう!</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-medium text-center">ゲームを選択</h2>

          {GAMES.map((game) => (
            <Link
              key={game.id}
              href={`/${game.id}`}
              className="block p-6 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700 hover:border-blue-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{game.name}</h3>
                  <p className="text-gray-400 mt-1">{game.description}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {game.minPlayers}〜{game.maxPlayers}人
                  </p>
                </div>
                <span className="text-2xl">→</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center text-gray-500 text-sm">
          <p>URLを共有するだけで遊べるボードゲームプラットフォーム</p>
        </div>
      </div>
    </main>
  );
}
