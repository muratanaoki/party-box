'use client';

import { useState } from 'react';

export default function DevPage() {
  const [roomId, setRoomId] = useState('');
  const [playerCount, setPlayerCount] = useState(3);
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    if (roomId.trim()) {
      setStarted(true);
    }
  };

  if (!started) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Dev Mode</h1>
            <p className="text-gray-400">複数プレイヤーを1画面でテスト</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                ルームID（空欄で新規作成から）
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="ABCD（空欄OK）"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 uppercase"
                maxLength={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                プレイヤー数: {playerCount}人
              </label>
              <input
                type="range"
                min={2}
                max={5}
                value={playerCount}
                onChange={(e) => setPlayerCount(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <button
              onClick={handleStart}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              開始
            </button>
          </div>

          <div className="text-sm text-gray-500 text-center">
            <p>各プレイヤーは別々のlocalStorageを使用</p>
            <p>（iframe sandbox）</p>
          </div>
        </div>
      </main>
    );
  }

  const baseUrl = roomId
    ? `/one-hint/room/${roomId}`
    : '/one-hint';

  return (
    <main className="min-h-screen bg-gray-900 p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Dev Mode - {playerCount} Players</h1>
        <button
          onClick={() => setStarted(false)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
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
          <div key={i} className="relative">
            <div className="absolute top-2 left-2 z-10 bg-black/70 px-2 py-1 rounded text-sm">
              Player {i + 1}
            </div>
            <iframe
              src={`${baseUrl}?dev=${i + 1}`}
              className="w-full bg-gray-800 rounded-lg border border-gray-700"
              style={{ height: 'calc(50vh - 40px)' }}
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
        ))}
      </div>
    </main>
  );
}
