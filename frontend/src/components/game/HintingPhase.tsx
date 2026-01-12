'use client';

import { useState } from 'react';
import { Player, Hint } from '@/types/game';
import { PlayerList } from '../common/PlayerList';

interface HintingPhaseProps {
  roomId: string;
  players: Player[];
  currentPlayerId: string;
  answererId: string;
  topic: string | null;
  hints: Hint[];
  round: number;
  onSubmitHint: (hint: string) => void;
}

export function HintingPhase({
  roomId,
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
        <p className="text-gray-400">ラウンド {round}</p>
        <h2 className="text-2xl font-bold mt-1">ヒントを出そう!</h2>
        <p className="text-gray-400 mt-2">
          回答者: <span className="text-white font-medium">{answererName}</span>
        </p>
      </div>

      {isAnswerer ? (
        <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-6 text-center">
          <p className="text-xl">あなたは回答者です</p>
          <p className="text-gray-400 mt-2">
            他のプレイヤーがヒントを出すのを待ってください
          </p>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              ヒント提出状況: {hints.length} / {expectedHints}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6 text-center">
            <p className="text-gray-400 text-sm">お題</p>
            <p className="text-3xl font-bold mt-2">{topic}</p>
          </div>

          {hasSubmitted ? (
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-center">
              <p className="text-green-400">ヒントを提出しました!</p>
              <p className="text-gray-400 text-sm mt-2">
                他のプレイヤーを待っています... ({hints.length} / {expectedHints})
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={hintInput}
                onChange={(e) => setHintInput(e.target.value)}
                placeholder="ヒントを入力 (1単語推奨)"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                maxLength={30}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <button
                onClick={handleSubmit}
                disabled={!hintInput.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                ヒントを提出
              </button>
            </div>
          )}
        </div>
      )}

      <PlayerList
        players={players}
        currentPlayerId={currentPlayerId}
        answererId={answererId}
      />
    </div>
  );
}
