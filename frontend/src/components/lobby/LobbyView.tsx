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

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/${gameType}/room/${roomId}`;
    await navigator.clipboard.writeText(url);
  };

  return (
    <div className="space-y-3">
      {/* Room Info */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 text-center">
        <p className="text-slate-500 text-xs mb-1">ルームID</p>
        <p className="text-2xl font-bold text-indigo-600 tracking-widest mb-2">{roomId}</p>
        <button
          onClick={handleCopyLink}
          className="text-xs text-slate-500 hover:text-indigo-600 transition-colors"
        >
          招待リンクをコピー
        </button>
      </div>

      {/* Start Game - 上に配置 */}
      <div className="space-y-2">
        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-base transition-colors shadow-sm"
          >
            ゲームを開始
          </button>
        ) : (
          <div className="text-center py-2 text-slate-500 text-sm">
            ホストがゲームを開始するのを待っています...
          </div>
        )}
        {players.length < minPlayers && (
          <p className="text-center text-amber-600 text-xs">
            あと{minPlayers - players.length}人でゲーム開始できます
          </p>
        )}
      </div>

      {/* Players */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4">
        <PlayerList players={players} currentPlayerId={currentPlayerId} />
      </div>
    </div>
  );
}
