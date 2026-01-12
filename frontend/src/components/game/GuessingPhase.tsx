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
    <div className="space-y-6">
      <div className="text-center">
        <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
          ラウンド {round}
        </span>
        <h2 className="text-2xl font-bold mt-3 text-gray-900">
          {isAnswerer ? '回答してください!' : '回答を待っています...'}
        </h2>
        <p className="text-gray-500 mt-2">
          回答者: <span className="text-gray-900 font-medium">{answererName}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            有効なヒント ({validHints.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {validHints.map((hint, index) => (
              <div
                key={index}
                className="bg-green-50 border border-green-200 px-4 py-3 rounded-xl"
              >
                <p className="text-xs text-green-600 mb-1">{hint.playerName}</p>
                <p className="text-lg font-semibold text-gray-900">{hint.text}</p>
              </div>
            ))}
            {validHints.length === 0 && (
              <p className="text-gray-400 text-sm">有効なヒントがありません</p>
            )}
          </div>
        </div>

        {invalidHints.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              無効なヒント ({invalidHints.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {invalidHints.map((hint, index) => (
                <div
                  key={index}
                  className="bg-red-50 border border-red-200 px-4 py-3 rounded-xl"
                >
                  <p className="text-xs text-red-500 mb-1">{hint.playerName}</p>
                  <p className="text-lg font-semibold text-gray-400">***</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isAnswerer && (
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <input
            type="text"
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            placeholder="答えを入力"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-center text-xl"
            maxLength={30}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            disabled={!answerInput.trim()}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-colors shadow-lg shadow-purple-200 disabled:shadow-none"
          >
            回答する
          </button>
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
