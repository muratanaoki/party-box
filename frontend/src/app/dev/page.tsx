'use client';

import { useState } from 'react';

export default function DevPage() {
  const [roomId, setRoomId] = useState('');
  const [playerCount, setPlayerCount] = useState(3);
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <main className="min-h-screen bg-slate-100 p-4">
        <div className="max-w-sm mx-auto pt-12">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-800">Dev Mode</h1>
            <p className="text-slate-500 text-sm mt-1">複数プレイヤーを1画面でテスト</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">ルームID（空欄で新規）</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="ABCD"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm uppercase"
                maxLength={4}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1.5">プレイヤー数: {playerCount}人</label>
              <div className="flex gap-2">
                {[2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setPlayerCount(n)}
                    className={`flex-1 py-2 rounded-lg text-sm ${
                      playerCount === n
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStarted(true)}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium"
            >
              開始
            </button>
          </div>
        </div>
      </main>
    );
  }

  const baseUrl = roomId ? `/one-hint/room/${roomId}` : '/one-hint';

  return (
    <main className="min-h-screen bg-slate-200 p-2">
      <div className="flex items-center justify-between mb-2 px-2">
        <span className="text-slate-600 text-sm font-medium">Dev - {playerCount}人</span>
        <button
          onClick={() => setStarted(false)}
          className="text-slate-500 hover:text-slate-700 text-sm"
        >
          リセット
        </button>
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${Math.min(playerCount, 3)}, 1fr)` }}
      >
        {Array.from({ length: playerCount }, (_, i) => (
          <div key={i} className="relative bg-white rounded-lg overflow-hidden">
            <div className="absolute top-1 left-1 z-10 bg-slate-800 text-white px-2 py-0.5 rounded text-xs">
              P{i + 1}
            </div>
            <iframe
              src={`${baseUrl}?dev=${i + 1}`}
              className="w-full border-0"
              style={{ height: 'calc(50vh - 24px)' }}
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
        ))}
      </div>
    </main>
  );
}
