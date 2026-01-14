'use client';

import Link from 'next/link';

const GAMES = [
  {
    id: 'just-one',
    name: 'Just One',
    description: 'ヒントを出し合ってお題を当てる協力ゲーム',
    players: '3〜10人',
    color: 'from-indigo-500 to-purple-600',
    icon: '💡',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-md mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Party Box
          </h1>
          <p className="text-slate-500 mt-3">
            スマホで遊べるパーティーゲーム
          </p>
        </div>

        {/* Games Grid */}
        <div className="space-y-4">
          {GAMES.map((game) => (
            <Link
              key={game.id}
              href={`/${game.id}`}
              className="block group"
            >
              <div className={`bg-gradient-to-br ${game.color} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]`}>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{game.icon}</span>
                  <div className="flex-1">
                    <h2 className="text-white text-xl font-bold">{game.name}</h2>
                    <p className="text-white/80 text-sm mt-1">{game.description}</p>
                  </div>
                  <span className="text-white/60 text-2xl group-hover:translate-x-1 transition-transform">→</span>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <span className="text-white/70 text-sm">{game.players}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Features */}
        <div className="mt-10 grid grid-cols-3 gap-3">
          <div className="text-center p-3">
            <div className="text-2xl mb-1">📱</div>
            <p className="text-slate-600 text-xs font-medium">スマホ対応</p>
          </div>
          <div className="text-center p-3">
            <div className="text-2xl mb-1">🔗</div>
            <p className="text-slate-600 text-xs font-medium">URL共有で参加</p>
          </div>
          <div className="text-center p-3">
            <div className="text-2xl mb-1">🤖</div>
            <p className="text-slate-600 text-xs font-medium">AI審判</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-xs mt-8">
          インストール不要・登録不要
        </p>
      </div>
    </main>
  );
}
