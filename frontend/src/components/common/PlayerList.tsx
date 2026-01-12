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
      <p className="text-slate-500 text-xs mb-2">プレイヤー ({players.length}人)</p>
      <div className="space-y-1.5">
        {players.map((player) => (
          <div
            key={player.id}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
              player.id === currentPlayerId
                ? 'bg-indigo-50 border border-indigo-200'
                : 'bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${player.isConnected ? 'bg-green-500' : 'bg-slate-300'}`} />
              <span className={player.isConnected ? 'text-slate-800' : 'text-slate-400'}>
                {player.name}
              </span>
              {player.isHost && (
                <span className="text-xs text-amber-600">ホスト</span>
              )}
              {player.id === currentPlayerId && (
                <span className="text-xs text-indigo-500">あなた</span>
              )}
            </div>
            {answererId && player.id === answererId && (
              <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">回答者</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
