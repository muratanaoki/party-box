'use client';

import { useState, useRef, useMemo } from 'react';
import { Player, Hint } from '@/types/game';
import { PlayerList } from '../common/PlayerList';
import { Spinner } from '../common/Spinner';
import { getPlayerName, partitionHints } from '@/lib/game-helpers';

interface GuessingPhaseProps {
  players: Player[];
  currentPlayerId: string;
  answererId: string;
  hints: Hint[];
  round: number;
  totalRounds: number;
  onSubmitAnswer: (answer: string) => void;
}

export function GuessingPhase({
  players,
  currentPlayerId,
  answererId,
  hints,
  round,
  totalRounds,
  onSubmitAnswer,
}: GuessingPhaseProps) {
  const [answerInput, setAnswerInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isComposingRef = useRef(false);

  const isAnswerer = currentPlayerId === answererId;
  const answererName = getPlayerName(players, answererId);
  const { validHints, invalidHints } = useMemo(() => partitionHints(hints), [hints]);

  const handleSubmit = () => {
    const trimmed = answerInput.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    onSubmitAnswer(trimmed);
    setAnswerInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // IME変換中は送信しない
    if (e.key === 'Enter' && !isComposingRef.current) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
          ラウンド {round}/{totalRounds}
        </span>
        <p className="text-slate-800 font-bold text-lg mt-2">
          {isAnswerer ? '回答してください!' : `${answererName}が回答中...`}
        </p>
      </div>

      {/* Valid Hints */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5">
        <p className="text-slate-600 text-sm mb-3">有効なヒント ({validHints.length})</p>
        <div className="flex flex-wrap gap-2">
          {validHints.length > 0 ? (
            validHints.map((hint, i) => (
              <div key={i} className="bg-green-50 border border-green-200 px-4 py-2 rounded-xl">
                <p className="text-xs text-green-600 mb-0.5">{hint.playerName}</p>
                <p className="text-slate-800 font-semibold">{hint.text}</p>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-sm">有効なヒントがありません</p>
          )}
        </div>
      </div>

      {/* Invalid Hints */}
      {invalidHints.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5">
          <p className="text-slate-600 text-sm mb-3">無効なヒント ({invalidHints.length})</p>
          <div className="flex flex-wrap gap-2">
            {invalidHints.map((hint, i) => (
              <div key={i} className="bg-red-50 border border-red-200 px-4 py-2 rounded-xl">
                <p className="text-xs text-red-500 mb-0.5">{hint.playerName}</p>
                <p className="text-slate-400 font-semibold">***</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answer Input */}
      {isAnswerer && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 space-y-4">
          <input
            type="text"
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={() => { isComposingRef.current = false; }}
            placeholder="答えを入力"
            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-xl text-center font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            maxLength={30}
            disabled={isSubmitting}
          />
          <button
            onClick={handleSubmit}
            disabled={!answerInput.trim() || isSubmitting}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? <><Spinner size="sm" /> 送信中...</> : '回答する'}
          </button>
        </div>
      )}

      {/* Player List */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5">
        <PlayerList players={players} currentPlayerId={currentPlayerId} answererId={answererId} />
      </div>
    </div>
  );
}
