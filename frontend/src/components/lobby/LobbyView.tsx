'use client';

import { Player } from '@/types/game';
import { PlayerList } from '../common/PlayerList';

interface LobbyViewProps {
  roomId: string;
  players: Player[];
  currentPlayerId: string;
  isHost: boolean;
  onStartGame: () => void;
}

export function LobbyView({
  roomId,
  players,
  currentPlayerId,
  isHost,
  onStartGame,
}: LobbyViewProps) {
  const canStart = players.length >= 3;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-gray-400 mb-2">ルームID</p>
        <div className="flex items-center justify-center gap-4">
          <span className="text-4xl font-bold tracking-widest">{roomId}</span>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            リンクをコピー
          </button>
        </div>
      </div>

      <PlayerList players={players} currentPlayerId={currentPlayerId} />

      <div className="text-center">
        {players.length < 3 && (
          <p className="text-yellow-500 mb-4">
            ゲームを開始するには3人以上必要です
          </p>
        )}

        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-bold text-lg transition-colors"
          >
            ゲームを開始
          </button>
        ) : (
          <p className="text-gray-400">ホストがゲームを開始するのを待っています...</p>
        )}
      </div>
    </div>
  );
}
