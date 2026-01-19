"use client";

import { useState, useRef, useEffect } from "react";
import { Player, Hint } from "@/types/game";
import { PlayerList } from "../common/PlayerList";
import { Spinner } from "../common/Spinner";
import { getPlayerName } from "@/lib/game-helpers";

interface HintingPhaseProps {
  players: Player[];
  currentPlayerId: string;
  answererId: string;
  topic: string | null;
  hints: Hint[];
  round: number;
  totalRounds: number;
  isHost: boolean;
  error: string | null;
  onSubmitHint: (hint: string) => void;
  onRegenerateTopic: () => void;
  onClearError: () => void;
}

export function HintingPhase({
  players,
  currentPlayerId,
  answererId,
  topic,
  hints,
  round,
  totalRounds,
  isHost,
  error,
  onSubmitHint,
  onRegenerateTopic,
  onClearError,
}: HintingPhaseProps) {
  const [hintInput, setHintInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [previousTopic, setPreviousTopic] = useState<string | null>(null);
  const isComposingRef = useRef(false);

  const isAnswerer = currentPlayerId === answererId;
  const hasSubmitted = hints.some((h) => h.playerId === currentPlayerId);
  const answererName = getPlayerName(players, answererId);
  const expectedHints = players.filter(
    (p) => p.isConnected && p.id !== answererId,
  ).length;

  // サーバーからの応答（ヒント提出完了）でisSubmittingをリセット
  useEffect(() => {
    if (hasSubmitted) {
      setIsSubmitting(false);
    }
  }, [hasSubmitted]);

  // エラー時にisSubmittingをリセット
  useEffect(() => {
    if (error) {
      setIsSubmitting(false);
    }
  }, [error]);

  // お題が変わったらローディング状態をリセット
  useEffect(() => {
    if (topic !== previousTopic) {
      setIsRegenerating(false);
      setPreviousTopic(topic);
    }
  }, [topic, previousTopic]);

  const handleRegenerateTopic = () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    onRegenerateTopic();
  };

  const handleSubmit = () => {
    const trimmed = hintInput.trim();
    if (!trimmed || isSubmitting || hasSubmitted) return;

    setIsSubmitting(true);
    onSubmitHint(trimmed);
    setHintInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // IME変換中は送信しない
    if (e.key === "Enter" && !isComposingRef.current) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <span className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
          ラウンド {round}/{totalRounds}
        </span>
        <p className="text-slate-600 mt-2">
          回答者:{" "}
          <span className="font-medium text-slate-800">{answererName}</span>
        </p>
      </div>

      {isAnswerer ? (
        /* Answerer View */
        <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6 text-center">
          <p className="text-purple-800 font-bold text-lg mb-2">
            あなたは回答者です
          </p>
          <p className="text-purple-600">
            他のプレイヤーがヒントを出すのを待っています
          </p>
          <div className="mt-4 bg-purple-100 rounded-xl py-3 px-4">
            <p className="text-purple-700 text-sm">
              ヒント提出:{" "}
              <span className="font-bold">
                {hints.length} / {expectedHints}
              </span>
            </p>
          </div>
          {isHost && hints.length === 0 && (
            <button
              onClick={handleRegenerateTopic}
              disabled={isRegenerating}
              className="mt-4 text-purple-500 hover:text-purple-700 text-sm underline cursor-pointer disabled:text-purple-300 disabled:cursor-not-allowed"
            >
              {isRegenerating
                ? "読み込み中..."
                : "お題を出し直す（他プレイヤーと相談してね）"}
            </button>
          )}
        </div>
      ) : (
        /* Hint Giver View */
        <div className="space-y-4">
          {/* Topic Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-center shadow-lg">
            <p className="text-indigo-100 text-sm mb-1">お題</p>
            <p className="text-white text-3xl font-bold">{topic}</p>
            {isHost && hints.length === 0 && (
              <button
                onClick={handleRegenerateTopic}
                disabled={isRegenerating}
                className="mt-3 text-indigo-200 hover:text-white text-sm underline cursor-pointer disabled:text-indigo-300 disabled:cursor-not-allowed"
              >
                {isRegenerating ? "読み込み中..." : "お題を出し直す"}
              </button>
            )}
          </div>

          {hasSubmitted ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
              <p className="text-green-700 font-bold text-lg mb-1">
                ヒント提出完了!
              </p>
              <p className="text-green-600 text-sm">
                他のプレイヤーを待っています ({hints.length}/{expectedHints})
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 space-y-4">
              {/* ヒントのルール */}
              <div className="text-xs space-y-2">
                <p className="text-slate-600 text-center">
                  お題を連想させる<span className="font-medium">1単語</span>
                  を出そう
                </p>
                <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
                  <div className="flex gap-2 items-start">
                    <span className="text-green-600 shrink-0">◯</span>
                    <p className="text-slate-600">
                      単語のみ（果物、赤い、丸い）
                    </p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="text-red-500 shrink-0">✗</span>
                    <p className="text-slate-600">お題そのもの・一部・翻訳</p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="text-red-500 shrink-0">✗</span>
                    <p className="text-slate-600">
                      文章・助詞付き（果物の、赤いです）
                    </p>
                  </div>
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between">
                  <p className="text-red-600 text-sm">{error}</p>
                  <button
                    onClick={onClearError}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    ✕
                  </button>
                </div>
              )}
              <input
                type="text"
                value={hintInput}
                onChange={(e) => setHintInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => {
                  isComposingRef.current = true;
                }}
                onCompositionEnd={() => {
                  isComposingRef.current = false;
                }}
                placeholder="ヒントを1単語で入力"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={30}
                disabled={isSubmitting}
              />
              <button
                onClick={handleSubmit}
                disabled={!hintInput.trim() || isSubmitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" /> 送信中...
                  </>
                ) : (
                  "ヒントを送信"
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Player List */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5">
        <PlayerList
          players={players}
          currentPlayerId={currentPlayerId}
          answererId={answererId}
        />
      </div>
    </div>
  );
}
