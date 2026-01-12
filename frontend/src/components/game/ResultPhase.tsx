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
    <div className="space-y-6">
      <div className="text-center">
        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
          ラウンド {round} 結果
        </span>
        <div
          className={`mt-4 p-8 rounded-2xl ${
            isCorrect
              ? 'bg-gradient-to-br from-green-400 to-emerald-500'
              : 'bg-gradient-to-br from-red-400 to-rose-500'
          } shadow-lg`}
        >
          {isCorrect ? (
            <>
              <p className="text-5xl mb-3">🎉</p>
              <p className="text-3xl font-bold text-white">正解!</p>
            </>
          ) : (
            <>
              <p className="text-5xl mb-3">😢</p>
              <p className="text-3xl font-bold text-white">不正解...</p>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
        <div className="text-center pb-4 border-b border-gray-100">
          <p className="text-sm text-gray-500 mb-1">お題</p>
          <p className="text-3xl font-bold text-gray-900">{topic}</p>
        </div>
        <div className="text-center pt-2">
          <p className="text-sm text-gray-500 mb-1">{answererName}の回答</p>
          <p className="text-2xl font-semibold text-gray-700">{answer}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">ヒント一覧</h3>
        <div className="space-y-2">
          {hints.map((hint, index) => (
            <div
              key={index}
              className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                hint.isValid
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div>
                <span className="text-sm text-gray-500">{hint.playerName}: </span>
                <span className={`font-medium ${hint.isValid ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                  {hint.text}
                </span>
              </div>
              {hint.isValid ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">有効</span>
              ) : (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">重複/無効</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        {isHost ? (
          <button
            onClick={onNextRound}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-colors shadow-lg shadow-indigo-200"
          >
            次のラウンドへ
          </button>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>ホストが次のラウンドを開始するのを待っています...</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <PlayerList
          players={players}
          currentPlayerId={currentPlayerId}
          answererId={answererId}
        />
      </div>
    </div>
  );
}
