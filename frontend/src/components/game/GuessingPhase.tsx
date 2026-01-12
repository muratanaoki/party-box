'use client';

import { useState } from 'react';
import { Player, Hint } from '@/types/game';
import { PlayerList } from '../common/PlayerList';

interface GuessingPhaseProps {
  roomId: string;
  players: Player[];
  currentPlayerId: string;
  answererId: string;
  hints: Hint[];
  round: number;
  onSubmitAnswer: (answer: string) => void;
}

export function GuessingPhase({
  roomId,
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
        <p className="text-gray-400">ラウンド {round}</p>
        <h2 className="text-2xl font-bold mt-1">
          {isAnswerer ? '回答してください!' : '回答を待っています...'}
        </h2>
        <p className="text-gray-400 mt-2">
          回答者: <span className="text-white font-medium">{answererName}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            有効なヒント ({validHints.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {validHints.map((hint, index) => (
              <div
                key={index}
                className="bg-green-900/30 border border-green-700 px-3 py-2 rounded-lg"
              >
                <p className="text-sm text-gray-400">{hint.playerName}</p>
                <p className="text-lg font-medium">{hint.text}</p>
              </div>
            ))}
          </div>
        </div>

        {invalidHints.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">
              無効なヒント ({invalidHints.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {invalidHints.map((hint, index) => (
                <div
                  key={index}
                  className="bg-red-900/30 border border-red-700 px-3 py-2 rounded-lg"
                >
                  <p className="text-sm text-gray-400">{hint.playerName}</p>
                  <p className="text-lg font-medium text-gray-500">***</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isAnswerer && (
        <div className="space-y-3">
          <input
            type="text"
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            placeholder="答えを入力"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            maxLength={30}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            disabled={!answerInput.trim()}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            回答する
          </button>
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
