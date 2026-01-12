'use client';

import { Player, Hint } from '@/types/game';
import { PlayerList } from '../common/PlayerList';

interface ResultPhaseProps {
  players: Player[];
  currentPlayerId: string;
  answererId: string;
  topic: string | null;
  hints: Hint[];
  answer: string | null;
  isCorrect: boolean | null;
  round: number;
  isHost: boolean;
  onNextRound: () => void;
}

export function ResultPhase({
  players,
  currentPlayerId,
  answererId,
  topic,
  hints,
  answer,
  isCorrect,
  round,
  isHost,
  onNextRound,
}: ResultPhaseProps) {
  const answererName = players.find((p) => p.id === answererId)?.name ?? '???';

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-slate-500 text-xs">ラウンド {round} 結果</p>
      </div>

      <div className={`rounded-xl p-6 text-center ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
        <p className="text-4xl mb-2">{isCorrect ? '🎉' : '😢'}</p>
        <p className="text-white text-xl font-bold">{isCorrect ? '正解!' : '不正解...'}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
        <p className="text-slate-500 text-xs">お題</p>
        <p className="text-slate-800 text-xl font-bold mt-1">{topic}</p>
        <div className="border-t border-slate-100 mt-3 pt-3">
          <p className="text-slate-500 text-xs">{answererName}の回答</p>
          <p className="text-slate-700 font-medium mt-1">{answer}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-slate-500 text-xs mb-2">ヒント一覧</p>
        <div className="space-y-1.5">
          {hints.map((hint, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                hint.isValid ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <div>
                <span className="text-slate-500">{hint.playerName}: </span>
                <span className={hint.isValid ? 'text-slate-800' : 'text-slate-400 line-through'}>
                  {hint.text}
                </span>
              </div>
              <span className={`text-xs ${hint.isValid ? 'text-green-600' : 'text-red-500'}`}>
                {hint.isValid ? '有効' : '無効'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {isHost ? (
        <button
          onClick={onNextRound}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
        >
          次のラウンドへ
        </button>
      ) : (
        <p className="text-slate-500 text-sm text-center">ホストの操作を待っています...</p>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <PlayerList players={players} currentPlayerId={currentPlayerId} answererId={answererId} />
      </div>
    </div>
  );
}
