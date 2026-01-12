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
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-slate-500 text-xs">ラウンド {round}</p>
        <p className="text-slate-800 font-medium mt-1">回答者: {answererName}</p>
      </div>

      {isAnswerer ? (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <p className="text-purple-800 font-medium">あなたは回答者です</p>
          <p className="text-purple-600 text-sm mt-1">ヒントを待っています...</p>
          <p className="text-purple-500 text-xs mt-2">{hints.length} / {expectedHints}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-indigo-600 rounded-xl p-4 text-center">
            <p className="text-indigo-200 text-xs">お題</p>
            <p className="text-white text-2xl font-bold mt-1">{topic}</p>
          </div>

          {hasSubmitted ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-green-700 font-medium">提出済み</p>
              <p className="text-green-600 text-sm mt-1">他のプレイヤーを待っています ({hints.length}/{expectedHints})</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <input
                type="text"
                value={hintInput}
                onChange={(e) => setHintInput(e.target.value)}
                placeholder="ヒントを入力"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={30}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <button
                onClick={handleSubmit}
                disabled={!hintInput.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-sm font-medium"
              >
                提出
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <PlayerList players={players} currentPlayerId={currentPlayerId} answererId={answererId} />
      </div>
    </div>
  );
}
