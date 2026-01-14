'use client';

import { Player } from '@/types/game';

interface FinishedPhaseProps {
  players: Player[];
  totalRounds: number;
  isHost: boolean;
  onBackToLobby: () => void;
}

export function FinishedPhase({
  players,
  totalRounds,
  isHost,
  onBackToLobby,
}: FinishedPhaseProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <span className="inline-block bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
          ゲーム終了!
        </span>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-center">
        <p className="text-slate-600 mb-2">全 {totalRounds} ラウンド完了</p>
        <p className="text-2xl font-bold text-indigo-600 mb-4">
          お疲れさまでした!
        </p>
        <div className="text-6xl mb-4">🎉</div>
      </div>

      {/* Players */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5">
        <p className="text-slate-600 text-sm text-center mb-3">参加者</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {players.map((player) => (
            <span
              key={player.id}
              className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm"
            >
              {player.name}
            </span>
          ))}
        </div>
      </div>

      {/* Back to Lobby */}
      {isHost ? (
        <button
          onClick={onBackToLobby}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors"
        >
          ロビーに戻る
        </button>
      ) : (
        <div className="text-center py-2 text-slate-500 text-sm">
          ホストがロビーに戻るのを待っています...
        </div>
      )}
    </div>
  );
}
