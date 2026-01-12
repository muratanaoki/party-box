'use client';

import Link from 'next/link';

const GAMES = [
  {
    id: 'one-hint',
    name: 'One Hint',
    description: 'AIが審判の協力型ワード推測ゲーム',
    players: '3〜10人',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-sm mx-auto pt-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Party Box</h1>
          <p className="text-slate-500 text-sm mt-1">みんなで遊べるゲーム集</p>
        </div>

        <div className="space-y-3">
          {GAMES.map((game) => (
            <Link
              key={game.id}
              href={`/${game.id}`}
              className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-800">{game.name}</h2>
                  <p className="text-slate-500 text-sm mt-0.5">{game.description}</p>
                  <p className="text-slate-400 text-xs mt-1">{game.players}</p>
                </div>
                <span className="text-slate-300">→</span>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-slate-400 text-xs mt-8">
          URLを共有するだけで遊べます
        </p>
      </div>
    </main>
  );
}
