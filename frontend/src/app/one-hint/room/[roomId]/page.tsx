'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSocket } from '@/hooks/useSocket';
import { LobbyView } from '@/components/lobby/LobbyView';
import { HintingPhase } from '@/components/game/HintingPhase';
import { GuessingPhase } from '@/components/game/GuessingPhase';
import { ResultPhase } from '@/components/game/ResultPhase';
import { OneHintGame } from '@/types/game';

const getStorageKeys = (devId: string | null) => {
  const suffix = devId ? `_dev${devId}` : '';
  return {
    PLAYER_ID_KEY: `partybox_player_id${suffix}`,
    PLAYER_NAME_KEY: `partybox_player_name${suffix}`,
  };
};

export default function OneHintRoomPage() {
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
      router.push(`/one-hint?room=${roomId}${devParam}`);
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
      <main className="flex min-h-screen items-center justify-center">
        <p>リダイレクト中...</p>
      </main>
    );
  }

  if (!roomState) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-center">
          {error ? (
            <div className="space-y-4">
              <p className="text-red-400">{error}</p>
              <button
                onClick={() => router.push('/one-hint')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
              >
                ロビーに戻る
              </button>
            </div>
          ) : (
            <p>接続中...</p>
          )}
        </div>
      </main>
    );
  }

  const currentPlayer = roomState.players.find((p) => p.id === playerId);
  const isHost = currentPlayer?.isHost ?? false;
  const game = roomState.game;

  const handleStartGame = () => startGame(roomId, playerId);
  const handleSubmitHint = (hint: string) => submitHint(roomId, playerId, hint);
  const handleSubmitAnswer = (answer: string) =>
    submitAnswer(roomId, playerId, answer);
  const handleNextRound = () => nextRound(roomId, playerId);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/one-hint/room/${roomId}`;
    navigator.clipboard.writeText(url);
  };

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

    if (game.type !== 'one-hint') {
      return <p>不正なゲームタイプ</p>;
    }

    return renderOneHintGame(game);
  };

  const renderOneHintGame = (game: OneHintGame) => {
    switch (game.phase) {
      case 'HINTING':
        return (
          <HintingPhase
            roomId={roomId}
            players={roomState.players}
            currentPlayerId={playerId}
            answererId={game.answererId}
            topic={game.topic}
            hints={game.hints}
            round={game.round}
            onSubmitHint={handleSubmitHint}
          />
        );
      case 'GUESSING':
        return (
          <GuessingPhase
            roomId={roomId}
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
            roomId={roomId}
            players={roomState.players}
            currentPlayerId={playerId}
            answererId={game.answererId}
            topic={game.topic}
            hints={game.hints}
            answer={game.answer}
            isCorrect={game.isCorrect}
            round={game.round}
            isHost={isHost}
            onNextRound={handleNextRound}
          />
        );
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/one-hint"
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← 退出
          </Link>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="text-green-500 text-sm">● 接続中</span>
            ) : (
              <span className="text-red-500 text-sm">● 再接続中...</span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-6 relative">
            <span>{error}</span>
            <button onClick={clearError} className="absolute top-0 right-0 p-3">
              ×
            </button>
          </div>
        )}

        {renderGame()}
      </div>
    </main>
  );
}
