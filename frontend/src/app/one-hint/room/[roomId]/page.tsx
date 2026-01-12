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
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">リダイレクト中...</p>
        </div>
      </main>
    );
  }

  if (!roomState) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          {error ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={() => router.push('/one-hint')}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                ロビーに戻る
              </button>
            </div>
          ) : (
            <div>
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">接続中...</p>
            </div>
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
      return <p className="text-red-600">不正なゲームタイプ</p>;
    }

    return renderOneHintGame(game);
  };

  const renderOneHintGame = (game: OneHintGame) => {
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
            onSubmitHint={handleSubmitHint}
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
            isHost={isHost}
            onNextRound={handleNextRound}
          />
        );
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/one-hint"
            className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            退出
          </Link>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="inline-flex items-center text-green-600 text-sm font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                接続中
              </span>
            ) : (
              <span className="inline-flex items-center text-orange-600 text-sm font-medium">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></span>
                再接続中...
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 relative">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="absolute top-2 right-2 text-red-400 hover:text-red-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {renderGame()}
      </div>
    </main>
  );
}
