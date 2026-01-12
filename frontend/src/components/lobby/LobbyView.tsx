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
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
        <p className="text-gray-500 text-sm mb-1">ゲーム</p>
        <p className="text-xl font-bold text-gray-900 mb-4">{GAME_NAMES[gameType]}</p>
        <p className="text-gray-500 text-sm mb-2">ルームID</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl font-bold tracking-widest text-indigo-600">{roomId}</span>
          <button
            onClick={handleCopyLink}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="リンクをコピー"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <PlayerList players={players} currentPlayerId={currentPlayerId} />
      </div>

      <div className="text-center space-y-4">
        {players.length < minPlayers && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm">
            ゲームを開始するには{minPlayers}人以上必要です（現在{players.length}人）
          </div>
        )}

        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-colors shadow-lg shadow-green-200 disabled:shadow-none"
          >
            ゲームを開始
          </button>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>ホストがゲームを開始するのを待っています...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
