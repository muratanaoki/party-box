'use client';

import { useState, useEffect, useRef } from 'react';

export default function DevPage() {
  const [playerCount, setPlayerCount] = useState(3);
  const [started, setStarted] = useState(false);
  const [sharedRoomId, setSharedRoomId] = useState<string | null>(null);
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);

  // Player 1が部屋を作成したらroomIdを取得して他プレイヤーに共有
  useEffect(() => {
    if (!started) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'ROOM_CREATED' && event.data?.roomId) {
        setSharedRoomId(event.data.roomId);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [started]);

  if (!started) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">Dev Mode</h1>
            <p className="text-slate-400 mt-2">複数プレイヤーを1画面でテスト</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">プレイヤー数</label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setPlayerCount(n)}
                    className={`py-3 rounded-xl text-lg font-bold transition-all ${
                      playerCount === n
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {n}人
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStarted(true)}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl text-lg font-bold transition-all shadow-lg"
            >
              テスト開始
            </button>

            <p className="text-slate-500 text-sm text-center">
              Player 1で部屋を作成すると、他のプレイヤーは自動で参加します
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Player 1は新規作成、Player 2以降はsharedRoomIdがあればそこに参加
  const getPlayerUrl = (index: number) => {
    const devParam = `dev=${index + 1}`;
    if (index === 0) {
      // Player 1は常にロビーから開始（部屋作成）
      return `/one-hint?${devParam}`;
    } else if (sharedRoomId) {
      // 他プレイヤーはroomIdがあれば直接参加
      return `/one-hint?room=${sharedRoomId}&${devParam}`;
    } else {
      // roomIdがまだない場合はロビーで待機
      return `/one-hint?${devParam}`;
    }
  };

  return (
    <main className="h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <span className="text-white font-bold">Dev Mode</span>
          <span className="text-slate-400 text-sm">{playerCount}人テスト中</span>
          {sharedRoomId && (
            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm">
              Room: {sharedRoomId}
            </span>
          )}
        </div>
        <button
          onClick={() => {
            setStarted(false);
            setSharedRoomId(null);
          }}
          className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
        >
          リセット
        </button>
      </div>

      {/* Player Grid - 横並び */}
      <div
        className="flex-1 grid gap-2 p-2"
        style={{
          gridTemplateColumns: `repeat(${playerCount}, 1fr)`,
          gridTemplateRows: '1fr',
        }}
      >
        {Array.from({ length: playerCount }, (_, i) => (
          <div
            key={i === 0 ? 'player-1' : `${i}-${sharedRoomId || 'none'}`}
            className="relative bg-slate-800 rounded-lg overflow-hidden flex flex-col"
          >
            {/* Player Label */}
            <div className={`px-3 py-1.5 text-sm font-medium ${
              i === 0
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-700 text-slate-300'
            }`}>
              Player {i + 1} {i === 0 && '(ホスト)'}
            </div>

            {/* Iframe */}
            <iframe
              ref={(el) => { iframeRefs.current[i] = el; }}
              src={getPlayerUrl(i)}
              className="flex-1 w-full border-0 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
        ))}
      </div>
    </main>
  );
}
