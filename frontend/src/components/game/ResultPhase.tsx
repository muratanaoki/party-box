'use client';

import { useState } from 'react';
import { Player, Hint } from '@/types/game';
import { PlayerList } from '../common/PlayerList';
import { Spinner } from '../common/Spinner';
import { getPlayerName } from '@/lib/game-helpers';

interface ResultPhaseProps {
  players: Player[];
  currentPlayerId: string;
  answererId: string;
  topic: string | null;
  hints: Hint[];
  answer: string | null;
  isCorrect: boolean | null;
  round: number;
  totalRounds: number;
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
  totalRounds,
  isHost,
  onNextRound,
}: ResultPhaseProps) {
  const [isLoading, setIsLoading] = useState(false);
  const answererName = getPlayerName(players, answererId);
  const isLastRound = round >= totalRounds;

  const handleNextRound = () => {
    setIsLoading(true);
    onNextRound();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <span className="inline-block bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">
          ラウンド {round}/{totalRounds} 結果
        </span>
      </div>

      {/* Result Banner */}
      <div className={`rounded-2xl p-8 text-center shadow-lg ${
        isCorrect
          ? 'bg-gradient-to-br from-green-400 to-emerald-500'
          : 'bg-gradient-to-br from-red-400 to-rose-500'
      }`}>
        <p className="text-5xl mb-3">{isCorrect ? '🎉' : '😢'}</p>
        <p className="text-white text-2xl font-bold">{isCorrect ? '正解!' : '不正解...'}</p>
      </div>

      {/* Topic & Answer */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5">
        <div className="text-center pb-4 border-b border-slate-100">
          <p className="text-slate-500 text-sm mb-1">お題</p>
          <p className="text-slate-800 text-2xl font-bold">{topic}</p>
        </div>
        <div className="text-center pt-4">
          <p className="text-slate-500 text-sm mb-1">{answererName}の回答</p>
          <p className="text-slate-700 text-xl font-semibold">{answer}</p>
        </div>
      </div>

      {/* Hints */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5">
        <p className="text-slate-600 text-sm mb-3">ヒント一覧</p>
        <div className="space-y-2">
          {hints.map((hint, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                hint.isValid ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <div>
                <span className="text-slate-500 text-sm">{hint.playerName}: </span>
                <span className={`font-medium ${hint.isValid ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                  {hint.text}
                </span>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                hint.isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
              }`}>
                {hint.isValid ? '有効' : '無効'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Next Round */}
      {isHost ? (
        <button
          onClick={handleNextRound}
          disabled={isLoading}
          className={`w-full py-4 text-white rounded-xl font-bold text-lg transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed ${
            isLastRound
              ? 'bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300'
              : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300'
          }`}
        >
          {isLoading ? (
            <><Spinner size="sm" /> 読み込み中...</>
          ) : (
            isLastRound ? '結果を見る' : '次のラウンドへ'
          )}
        </button>
      ) : (
        <div className="text-center py-4 text-slate-500 flex items-center justify-center gap-2">
          <Spinner size="sm" />
          {isLastRound
            ? 'ホストが結果画面を表示するのを待っています...'
            : 'ホストが次のラウンドを開始するのを待っています...'}
        </div>
      )}

      {/* Player List */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5">
        <PlayerList players={players} currentPlayerId={currentPlayerId} answererId={answererId} />
      </div>
    </div>
  );
}
