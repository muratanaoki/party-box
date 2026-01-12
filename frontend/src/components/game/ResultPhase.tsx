'use client';

import { Player, Hint } from '@/types/game';
import { PlayerList } from '../common/PlayerList';

interface ResultPhaseProps {
  roomId: string;
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
  roomId,
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
  const validHints = hints.filter((h) => h.isValid);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-gray-400">ラウンド {round} 結果</p>
        <div
          className={`mt-4 p-6 rounded-lg ${
            isCorrect
              ? 'bg-green-900/30 border border-green-700'
              : 'bg-red-900/30 border border-red-700'
          }`}
        >
          {isCorrect ? (
            <>
              <p className="text-4xl mb-2">🎉</p>
              <p className="text-2xl font-bold text-green-400">正解!</p>
            </>
          ) : (
            <>
              <p className="text-4xl mb-2">😢</p>
              <p className="text-2xl font-bold text-red-400">不正解...</p>
            </>
          )}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <div>
          <p className="text-sm text-gray-400">お題</p>
          <p className="text-2xl font-bold">{topic}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">{answererName}の回答</p>
          <p className="text-xl font-medium">{answer}</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">ヒント一覧</h3>
        <div className="space-y-2">
          {hints.map((hint, index) => (
            <div
              key={index}
              className={`flex items-center justify-between px-3 py-2 rounded ${
                hint.isValid
                  ? 'bg-green-900/20 border border-green-800'
                  : 'bg-red-900/20 border border-red-800'
              }`}
            >
              <div>
                <span className="text-sm text-gray-400">{hint.playerName}: </span>
                <span className={hint.isValid ? '' : 'text-gray-500 line-through'}>
                  {hint.text}
                </span>
              </div>
              {!hint.isValid && (
                <span className="text-xs text-red-400">重複 / 無効</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        {isHost ? (
          <button
            onClick={onNextRound}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg transition-colors"
          >
            次のラウンドへ
          </button>
        ) : (
          <p className="text-gray-400">ホストが次のラウンドを開始するのを待っています...</p>
        )}
      </div>

      <PlayerList
        players={players}
        currentPlayerId={currentPlayerId}
        answererId={answererId}
      />
    </div>
  );
}
