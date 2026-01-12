'use client';

import { useState } from 'react';
import { Player, Hint } from '@/types/game';
import { PlayerList } from '../common/PlayerList';

interface HintingPhaseProps {
  players: Player[];
  currentPlayerId: string;
  answererId: string;
  topic: string | null;
  hints: Hint[];
  round: number;
  onSubmitHint: (hint: string) => void;
}

export function HintingPhase({
  players,
  currentPlayerId,
  answererId,
  topic,
  hints,
  round,
  onSubmitHint,
}: HintingPhaseProps) {
  const [hintInput, setHintInput] = useState('');
  const isAnswerer = currentPlayerId === answererId;
  const hasSubmitted = hints.some((h) => h.playerId === currentPlayerId);
  const answererName = players.find((p) => p.id === answererId)?.name ?? '???';

  const expectedHints = players.filter(
    (p) => p.isConnected && p.id !== answererId
  ).length;

  const handleSubmit = () => {
    if (hintInput.trim()) {
      onSubmitHint(hintInput.trim());
      setHintInput('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
          ラウンド {round}
        </span>
        <h2 className="text-2xl font-bold mt-3 text-gray-900">ヒントを出そう!</h2>
        <p className="text-gray-500 mt-2">
          回答者: <span className="text-gray-900 font-medium">{answererName}</span>
        </p>
      </div>

      {isAnswerer ? (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <p className="text-xl font-semibold text-purple-900">あなたは回答者です</p>
          <p className="text-purple-600 mt-2">
            他のプレイヤーがヒントを出すのを待ってください
          </p>
          <div className="mt-4 bg-purple-100 rounded-xl py-3 px-4">
            <p className="text-sm text-purple-700">
              ヒント提出状況: <span className="font-bold">{hints.length} / {expectedHints}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-center shadow-lg">
            <p className="text-indigo-100 text-sm">お題</p>
            <p className="text-4xl font-bold text-white mt-2">{topic}</p>
          </div>

          {hasSubmitted ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-700 font-semibold">ヒントを提出しました!</p>
              <p className="text-green-600 text-sm mt-2">
                他のプレイヤーを待っています... ({hints.length} / {expectedHints})
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
              <input
                type="text"
                value={hintInput}
                onChange={(e) => setHintInput(e.target.value)}
                placeholder="ヒントを入力 (1単語推奨)"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                maxLength={30}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <button
                onClick={handleSubmit}
                disabled={!hintInput.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
              >
                ヒントを提出
              </button>
            </div>
          )}
        </div>
      )}

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
