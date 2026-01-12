'use client';

import { useState } from 'react';

export default function DevPage() {
  const [roomId, setRoomId] = useState('');
  const [playerCount, setPlayerCount] = useState(3);
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    setStarted(true);
  };

  if (!started) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Dev Mode</h1>
              <p className="text-gray-500">複数プレイヤーを1画面でテスト</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ルームID（空欄で新規作成）
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="例: ABCD"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase text-gray-900 placeholder-gray-400"
                  maxLength={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  プレイヤー数
                </label>
                <div className="flex items-center gap-3">
                  {[2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setPlayerCount(num)}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        playerCount === num
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {num}人
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStart}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-indigo-200"
              >
                テスト開始
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            各プレイヤーは独立したセッションで動作します
          </p>
        </div>
      </main>
    );
  }

  const baseUrl = roomId
    ? `/one-hint/room/${roomId}`
    : '/one-hint';

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <div className="flex items-center justify-between mb-4 bg-white rounded-xl shadow-sm px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Dev Mode</h1>
            <p className="text-sm text-gray-500">{playerCount}人でテスト中</p>
          </div>
        </div>
        <button
          onClick={() => setStarted(false)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          リセット
        </button>
      </div>

      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${Math.min(playerCount, 3)}, 1fr)`,
        }}
      >
        {Array.from({ length: playerCount }, (_, i) => (
          <div key={i} className="relative bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="absolute top-3 left-3 z-10 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
              Player {i + 1}
            </div>
            <iframe
              src={`${baseUrl}?dev=${i + 1}`}
              className="w-full border-0"
              style={{ height: 'calc(50vh - 48px)' }}
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
        ))}
      </div>
    </main>
  );
}
