'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { LobbyView } from '@/components/lobby/LobbyView';
import { HintingPhase } from '@/components/game/HintingPhase';
import { GuessingPhase } from '@/components/game/GuessingPhase';
import { ResultPhase } from '@/components/game/ResultPhase';

const PLAYER_ID_KEY = 'partybox_player_id';
const PLAYER_NAME_KEY = 'partybox_player_name';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = (params.roomId as string).toUpperCase();

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
      router.push(`/?room=${roomId}`);
      return;
    }

    setPlayerId(id);
    setPlayerName(name);
  }, [roomId, router]);

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
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
              >
                トップに戻る
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

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← 退出
          </button>
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

        {!game && (
          <LobbyView
            roomId={roomId}
            players={roomState.players}
            currentPlayerId={playerId}
            isHost={isHost}
            onStartGame={handleStartGame}
          />
        )}

        {game?.phase === 'HINTING' && (
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
        )}

        {game?.phase === 'GUESSING' && (
          <GuessingPhase
            roomId={roomId}
            players={roomState.players}
            currentPlayerId={playerId}
            answererId={game.answererId}
            hints={game.hints}
            round={game.round}
            onSubmitAnswer={handleSubmitAnswer}
          />
        )}

        {game?.phase === 'RESULT' && (
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
        )}
      </div>
    </main>
  );
}
