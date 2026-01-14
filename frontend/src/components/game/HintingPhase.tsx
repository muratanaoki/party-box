'use client';

import { useState, useRef } from 'react';
import { Player, Hint } from '@/types/game';
import { PlayerList } from '../common/PlayerList';
import { Spinner } from '../common/Spinner';

interface HintingPhaseProps {
  players: Player[];
  currentPlayerId: string;
  answererId: string;
  topic: string | null;
  hints: Hint[];
  round: number;
  isHost: boolean;
  onSubmitHint: (hint: string) => void;
  onRegenerateTopic: () => void;
}

export function HintingPhase({
  players,
  currentPlayerId,
  answererId,
  topic,
  hints,
  round,
  isHost,
  onSubmitHint,
  onRegenerateTopic,
}: HintingPhaseProps) {
  const [hintInput, setHintInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isComposingRef = useRef(false);

  const isAnswerer = currentPlayerId === answererId;
  const hasSubmitted = hints.some((h) => h.playerId === currentPlayerId);
  const answererName = players.find((p) => p.id === answererId)?.name ?? '???';
  const expectedHints = players.filter((p) => p.isConnected && p.id !== answererId).length;

  const handleSubmit = () => {
    const trimmed = hintInput.trim();
    if (!trimmed || isSubmitting || hasSubmitted) return;

    setIsSubmitting(true);
    onSubmitHint(trimmed);
    setHintInput('');
    // 送信後少し待ってからisSubmittingをリセット（サーバー応答待ち）
    setTimeout(() => setIsSubmitting(false), 1000);
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
        <span className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
          ラウンド {round}
        </span>
        <p className="text-slate-600 mt-2">回答者: <span className="font-medium text-slate-800">{answererName}</span></p>
      </div>

      {isAnswerer ? (
        /* Answerer View */
        <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6 text-center">
          <p className="text-purple-800 font-bold text-lg mb-2">あなたは回答者です</p>
          <p className="text-purple-600">他のプレイヤーがヒントを出すのを待っています</p>
          <div className="mt-4 bg-purple-100 rounded-xl py-3 px-4">
            <p className="text-purple-700 text-sm">
              ヒント提出: <span className="font-bold">{hints.length} / {expectedHints}</span>
            </p>
          </div>
        </div>
      ) : (
        /* Hint Giver View */
        <div className="space-y-4">
          {/* Topic Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-center shadow-lg">
            <p className="text-indigo-100 text-sm mb-1">お題</p>
            <p className="text-white text-3xl font-bold">{topic}</p>
            {isHost && (
              <button
                onClick={onRegenerateTopic}
                className="mt-3 text-indigo-200 hover:text-white text-sm underline"
              >
                お題を出し直す
              </button>
            )}
          </div>

          {hasSubmitted ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
              <p className="text-green-700 font-bold text-lg mb-1">ヒント提出完了!</p>
              <p className="text-green-600 text-sm">
                他のプレイヤーを待っています ({hints.length}/{expectedHints})
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 space-y-4">
              {/* ヒントのルール */}
              <div className="text-xs space-y-2">
                <p className="text-slate-600 text-center">お題を連想させる<span className="font-medium">1単語</span>を出そう</p>
                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                  <p className="text-slate-500 text-center">例）お題「りんご」</p>
                  <div className="flex gap-3">
                    <div className="flex-1 bg-green-50 rounded p-2">
                      <p className="text-green-700 font-medium mb-1">◯ OK</p>
                      <p className="text-green-600">果物、赤い</p>
                      <p className="text-slate-400 mt-1">→ 連想できる</p>
                    </div>
                    <div className="flex-1 bg-red-50 rounded p-2">
                      <p className="text-red-600 font-medium mb-1">✗ NG</p>
                      <p className="text-red-500">リンゴ、ご、apple</p>
                      <p className="text-slate-400 mt-1">→ 言い換え・一部・翻訳</p>
                    </div>
                  </div>
                </div>
              </div>
              <input
                type="text"
                value={hintInput}
                onChange={(e) => setHintInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => { isComposingRef.current = true; }}
                onCompositionEnd={() => { isComposingRef.current = false; }}
                placeholder="ヒントを1単語で入力"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={30}
                disabled={isSubmitting}
              />
              <button
                onClick={handleSubmit}
                disabled={!hintInput.trim() || isSubmitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? <><Spinner size="sm" /> 送信中...</> : 'ヒントを送信'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Player List */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5">
        <PlayerList players={players} currentPlayerId={currentPlayerId} answererId={answererId} />
      </div>
    </div>
  );
}
