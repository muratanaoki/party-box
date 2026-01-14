'use client';

import { useState } from 'react';
import { Player, GameType, GAME_CONFIGS } from '@/types/game';
import { PlayerList } from '../common/PlayerList';

interface LobbyViewProps {
  roomId: string;
  players: Player[];
  currentPlayerId: string;
  isHost: boolean;
  gameType: GameType;
  onStartGame: (totalRounds: number) => void;
}

export function LobbyView({
  roomId,
  players,
  currentPlayerId,
  isHost,
  gameType,
  onStartGame,
}: LobbyViewProps) {
  const [loops, setLoops] = useState(1);
  const minPlayers = GAME_CONFIGS[gameType].minPlayers;
  const canStart = players.length >= minPlayers;
  const totalRounds = loops * players.length;

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

      {/* Game Rules */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
        <p className="text-slate-700 font-bold text-sm mb-2 text-center">遊び方</p>
        <ol className="text-slate-600 text-xs space-y-1.5 list-decimal list-inside">
          <li>毎ラウンド、1人が<span className="font-medium text-indigo-600">回答者</span>になります</li>
          <li>回答者以外は、お題を見て<span className="font-medium text-indigo-600">ヒントを1つ</span>出します</li>
          <li><span className="font-medium text-red-500">被ったヒントは消えます</span>（同じ意味・翻訳も）</li>
          <li>回答者は残ったヒントを見てお題を当てます</li>
        </ol>
      </div>

      {/* Start Game - 上に配置 */}
      <div className="space-y-3">
        {isHost && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4">
            <div className="flex items-center justify-center gap-3">
              <span className="text-slate-600 text-sm">周回数</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLoops(Math.max(1, loops - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold transition-colors"
                >
                  -
                </button>
                <span className="w-8 text-center text-lg font-bold text-indigo-600">{loops}</span>
                <button
                  onClick={() => setLoops(loops + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold transition-colors"
                >
                  +
                </button>
              </div>
              <span className="text-slate-400 text-sm">= {totalRounds}ラウンド</span>
            </div>
          </div>
        )}
        {isHost ? (
          <button
            onClick={() => onStartGame(totalRounds)}
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
