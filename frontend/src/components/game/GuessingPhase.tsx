'use client';

import { useState } from 'react';
import { Player, Hint } from '@/types/game';
import { PlayerList } from '../common/PlayerList';

interface GuessingPhaseProps {
  players: Player[];
  currentPlayerId: string;
  answererId: string;
  hints: Hint[];
  round: number;
  onSubmitAnswer: (answer: string) => void;
}

export function GuessingPhase({
  players,
  currentPlayerId,
  answererId,
  hints,
  round,
  onSubmitAnswer,
}: GuessingPhaseProps) {
  const [answerInput, setAnswerInput] = useState('');
  const isAnswerer = currentPlayerId === answererId;
  const answererName = players.find((p) => p.id === answererId)?.name ?? '???';

  const validHints = hints.filter((h) => h.isValid);
  const invalidHints = hints.filter((h) => !h.isValid);

  const handleSubmit = () => {
    if (answerInput.trim()) {
      onSubmitAnswer(answerInput.trim());
      setAnswerInput('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-slate-500 text-xs">ラウンド {round}</p>
        <p className="text-slate-800 font-medium mt-1">
          {isAnswerer ? '回答してください' : `${answererName}が回答中...`}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-slate-500 text-xs mb-2">有効なヒント ({validHints.length})</p>
        <div className="flex flex-wrap gap-2">
          {validHints.map((hint, i) => (
            <div key={i} className="bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
              <p className="text-xs text-green-600">{hint.playerName}</p>
              <p className="text-slate-800 font-medium">{hint.text}</p>
            </div>
          ))}
          {validHints.length === 0 && (
            <p className="text-slate-400 text-sm">なし</p>
          )}
        </div>
      </div>

      {invalidHints.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-slate-500 text-xs mb-2">無効なヒント ({invalidHints.length})</p>
          <div className="flex flex-wrap gap-2">
            {invalidHints.map((hint, i) => (
              <div key={i} className="bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                <p className="text-xs text-red-500">{hint.playerName}</p>
                <p className="text-slate-400">***</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAnswerer && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <input
            type="text"
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            placeholder="答えを入力"
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
            maxLength={30}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            disabled={!answerInput.trim()}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-sm font-medium"
          >
            回答する
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <PlayerList players={players} currentPlayerId={currentPlayerId} answererId={answererId} />
      </div>
    </div>
  );
}
