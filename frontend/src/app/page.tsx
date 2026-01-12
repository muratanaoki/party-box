'use client';

import Link from 'next/link';

const GAMES = [
  {
    id: 'one-hint',
    name: 'One Hint',
    description: 'AIが審判の協力型ワード推測ゲーム',
    minPlayers: 3,
    maxPlayers: 10,
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mb-6 shadow-xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Party Box</h1>
          <p className="text-gray-500">みんなで遊ぼう!</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-medium text-gray-500 text-center uppercase tracking-wider">ゲームを選択</h2>

          {GAMES.map((game) => (
            <Link
              key={game.id}
              href={`/${game.id}`}
              className="block bg-white hover:bg-gray-50 rounded-2xl transition-all shadow-lg hover:shadow-xl border border-gray-100 hover:border-indigo-200 group"
            >
              <div className="p-6 flex items-center gap-5">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                  {game.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{game.name}</h3>
                  <p className="text-gray-500 mt-1">{game.description}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {game.minPlayers}〜{game.maxPlayers}人
                  </p>
                </div>
                <div className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center text-gray-400 text-sm mt-10">
          <p>URLを共有するだけで遊べるボードゲームプラットフォーム</p>
        </div>
      </div>
    </main>
  );
}
