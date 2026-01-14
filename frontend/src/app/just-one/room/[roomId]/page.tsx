'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSocket } from '@/hooks/useSocket';
import { LobbyView } from '@/components/lobby/LobbyView';
import { HintingPhase } from '@/components/game/HintingPhase';
import { GuessingPhase } from '@/components/game/GuessingPhase';
import { ResultPhase } from '@/components/game/ResultPhase';
import { FinishedPhase } from '@/components/game/FinishedPhase';
import { JustOneGame } from '@/types/game';
import { getStorageKeys } from '@/lib/storage';

export default function JustOneRoomPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = (params.roomId as string).toUpperCase();

  const devId = searchParams.get('dev');
  const { PLAYER_ID_KEY, PLAYER_NAME_KEY } = getStorageKeys(devId);

  const {
    isConnected,
    roomState,
    error,
    joinRoom,
    startGame,
    submitHint,
    submitAnswer,
    nextRound,
    regenerateTopic,
    clearError,
  } = useSocket();

  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem(PLAYER_ID_KEY);
    const name = localStorage.getItem(PLAYER_NAME_KEY);

    if (!id || !name) {
      const devParam = devId ? `&dev=${devId}` : '';
      router.push(`/just-one?room=${roomId}${devParam}`);
      return;
    }

    setPlayerId(id);
    setPlayerName(name);
  }, [roomId, router, PLAYER_ID_KEY, PLAYER_NAME_KEY, devId]);

  useEffect(() => {
    if (isConnected && playerId && playerName && !hasJoined) {
      joinRoom(roomId, playerId, playerName);
      setHasJoined(true);
    }
  }, [isConnected, playerId, playerName, roomId, joinRoom, hasJoined]);

  if (!playerId || !playerName) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-600">リダイレクト中...</p>
        </div>
      </main>
    );
  }

  if (!roomState) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center p-4">
        {error ? (
          <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-sm">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-xl">!</span>
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/just-one')}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← ロビーに戻る
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-600">接続中...</p>
          </div>
        )}
      </main>
    );
  }

  const currentPlayer = roomState.players.find((p) => p.id === playerId);
  const isHost = currentPlayer?.isHost ?? false;
  const game = roomState.game;

  const handleStartGame = (totalRounds: number) => startGame(roomId, playerId, totalRounds);
  const handleSubmitHint = (hint: string) => submitHint(roomId, playerId, hint);
  const handleSubmitAnswer = (answer: string) => submitAnswer(roomId, playerId, answer);
  const handleNextRound = () => nextRound(roomId, playerId);
  const handleRegenerateTopic = () => regenerateTopic(roomId, playerId);

  const renderGame = () => {
    if (!game) {
      return (
        <LobbyView
          roomId={roomId}
          players={roomState.players}
          currentPlayerId={playerId}
          isHost={isHost}
          gameType={roomState.gameType}
          onStartGame={handleStartGame}
        />
      );
    }

    if (game.type !== 'just-one') {
      return <p className="text-red-600">不正なゲームタイプ</p>;
    }

    return renderJustOneGame(game);
  };

  const renderJustOneGame = (game: JustOneGame) => {
    switch (game.phase) {
      case 'HINTING':
        return (
          <HintingPhase
            players={roomState.players}
            currentPlayerId={playerId}
            answererId={game.answererId}
            topic={game.topic}
            hints={game.hints}
            round={game.round}
            isHost={isHost}
            onSubmitHint={handleSubmitHint}
            onRegenerateTopic={handleRegenerateTopic}
          />
        );
      case 'GUESSING':
        return (
          <GuessingPhase
            players={roomState.players}
            currentPlayerId={playerId}
            answererId={game.answererId}
            hints={game.hints}
            round={game.round}
            onSubmitAnswer={handleSubmitAnswer}
          />
        );
      case 'RESULT':
        return (
          <ResultPhase
            players={roomState.players}
            currentPlayerId={playerId}
            answererId={game.answererId}
            topic={game.topic}
            hints={game.hints}
            answer={game.answer}
            isCorrect={game.isCorrect}
            round={game.round}
            totalRounds={game.totalRounds}
            isHost={isHost}
            onNextRound={handleNextRound}
          />
        );
      case 'FINISHED':
        return (
          <FinishedPhase
            players={roomState.players}
            totalRounds={game.totalRounds}
            isHost={isHost}
            onBackToLobby={() => router.push('/just-one')}
          />
        );
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-md mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          {!devId && (
            <Link href="/just-one" className="text-slate-500 hover:text-slate-700 text-sm">
              ← 退出
            </Link>
          )}
          {devId && <div />}
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 text-green-600 text-xs">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              接続中
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-amber-600 text-xs">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
              再接続中...
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex justify-between items-center">
            <span className="text-sm">{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
          </div>
        )}

        {renderGame()}
      </div>
    </main>
  );
}
