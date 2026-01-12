'use client';

import { Player, GameType } from '@/types/game';
import { PlayerList } from '../common/PlayerList';

const GAME_NAMES: Record<GameType, string> = {
  'one-hint': 'One Hint',
};

const MIN_PLAYERS: Record<GameType, number> = {
  'one-hint': 3,
};

interface LobbyViewProps {
  roomId: string;
  players: Player[];
  currentPlayerId: string;
  isHost: boolean;
  gameType: GameType;
  onStartGame: () => void;
}

export function LobbyView({
  roomId,
  players,
  currentPlayerId,
  isHost,
  gameType,
  onStartGame,
}: LobbyViewProps) {
  const minPlayers = MIN_PLAYERS[gameType];
  const canStart = players.length >= minPlayers;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/${gameType}/room/${roomId}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-gray-400 mb-1">ゲーム</p>
        <p className="text-xl font-bold mb-4">{GAME_NAMES[gameType]}</p>
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
        {players.length < minPlayers && (
          <p className="text-yellow-500 mb-4">
            ゲームを開始するには{minPlayers}人以上必要です
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
