'use client';

import { Player } from '@/types/game';

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string;
  answererId?: string;
}

export function PlayerList({
  players,
  currentPlayerId,
  answererId,
}: PlayerListProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-3">
        プレイヤー ({players.length}人)
      </h3>
      <ul className="space-y-2">
        {players.map((player) => (
          <li
            key={player.id}
            className={`flex items-center justify-between px-3 py-2 rounded ${
              player.id === currentPlayerId
                ? 'bg-blue-900/30 border border-blue-700'
                : 'bg-gray-700/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  player.isConnected ? 'bg-green-500' : 'bg-gray-500'
                }`}
              />
              <span
                className={player.isConnected ? 'text-white' : 'text-gray-500'}
              >
                {player.name}
              </span>
              {player.isHost && (
                <span className="text-xs bg-yellow-600 text-yellow-100 px-1.5 py-0.5 rounded">
                  ホスト
                </span>
              )}
              {player.id === currentPlayerId && (
                <span className="text-xs text-blue-400">(あなた)</span>
              )}
            </div>
            {answererId && player.id === answererId && (
              <span className="text-xs bg-purple-600 text-purple-100 px-2 py-0.5 rounded">
                回答者
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
