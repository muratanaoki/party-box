'use client';

import { Player, GameType } from '@/types/game';
import { PlayerList } from '../common/PlayerList';

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
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="text-center">
          <p className="text-slate-500 text-xs mb-1">ルームID</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-slate-800 tracking-widest">{roomId}</span>
            <button
              onClick={handleCopyLink}
              className="text-slate-400 hover:text-slate-600 text-xs"
              title="リンクをコピー"
            >
              コピー
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <PlayerList players={players} currentPlayerId={currentPlayerId} />
      </div>

      <div className="space-y-3">
        {players.length < minPlayers && (
          <p className="text-amber-600 text-sm text-center">
            あと{minPlayers - players.length}人必要です
          </p>
        )}

        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg font-medium transition-colors"
          >
            ゲームを開始
          </button>
        ) : (
          <p className="text-slate-500 text-sm text-center">
            ホストの開始を待っています...
          </p>
        )}
      </div>
    </div>
  );
}
