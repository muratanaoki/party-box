'use client';

import { Player, RoundResult } from '@/types/game';

interface FinishedPhaseProps {
  players: Player[];
  totalRounds: number;
  roundResults: RoundResult[];
  isHost: boolean;
  onBackToLobby: () => void;
}

export function FinishedPhase({
  players,
  totalRounds,
  roundResults,
  isHost,
  onBackToLobby,
}: FinishedPhaseProps) {
  const correctCount = roundResults.filter((r) => r.isCorrect).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <span className="inline-block bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
          ゲーム終了!
        </span>
      </div>

      {/* Score Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-center shadow-lg">
        <p className="text-indigo-100 text-sm mb-1">最終結果</p>
        <p className="text-white text-5xl font-bold mb-2">
          {correctCount} / {totalRounds}
        </p>
        <p className="text-indigo-100">正解</p>
      </div>

      {/* Round Results */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5">
        <p className="text-slate-600 text-sm mb-3">ラウンド結果</p>
        <div className="space-y-2">
          {roundResults.map((result) => (
            <div
              key={result.round}
              className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                result.isCorrect ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs">R{result.round}</span>
                  <span className="font-medium text-slate-800 truncate">{result.topic}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {result.answererName}: {result.answer}
                </p>
              </div>
              <span className={`text-lg ml-2 ${result.isCorrect ? '' : 'grayscale'}`}>
                {result.isCorrect ? '⭕' : '❌'}
              </span>
            </div>
          ))}
        </div>
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
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
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
