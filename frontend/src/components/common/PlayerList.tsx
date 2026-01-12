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
    <div>
      <h3 className="text-sm font-medium text-gray-500 mb-3">
        プレイヤー ({players.length}人)
      </h3>
      <ul className="space-y-2">
        {players.map((player) => (
          <li
            key={player.id}
            className={`flex items-center justify-between px-4 py-3 rounded-xl ${
              player.id === currentPlayerId
                ? 'bg-indigo-50 border-2 border-indigo-200'
                : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  player.isConnected ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
              <span
                className={`font-medium ${player.isConnected ? 'text-gray-900' : 'text-gray-400'}`}
              >
                {player.name}
              </span>
              {player.isHost && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  ホスト
                </span>
              )}
              {player.id === currentPlayerId && (
                <span className="text-xs text-indigo-500 font-medium">(あなた)</span>
              )}
            </div>
            {answererId && player.id === answererId && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                回答者
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
