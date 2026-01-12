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
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">リダイレクト中...</p>
      </main>
    );
  }

  if (!roomState) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        {error ? (
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/one-hint')}
              className="text-slate-500 hover:text-slate-700 text-sm"
            >
              ← ロビーに戻る
            </button>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">接続中...</p>
        )}
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
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-4 pt-2">
          <Link href="/one-hint" className="text-slate-400 hover:text-slate-600 text-sm">
            ← 退出
          </Link>
          {isConnected ? (
            <span className="text-green-600 text-xs">● 接続中</span>
          ) : (
            <span className="text-orange-500 text-xs">● 再接続中...</span>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg mb-4 text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-600 ml-2">✕</button>
          </div>
        )}

        {renderGame()}
      </div>
    </main>
  );
}
