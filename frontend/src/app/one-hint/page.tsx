'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { useSocket } from '@/hooks/useSocket';
import { getSocket } from '@/lib/socket';

const getStorageKeys = (devId: string | null) => {
  const suffix = devId ? `_dev${devId}` : '';
  return {
    PLAYER_ID_KEY: `partybox_player_id${suffix}`,
    PLAYER_NAME_KEY: `partybox_player_name${suffix}`,
  };
};

export default function OneHintLobby() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConnected, createRoom, joinRoom, error, clearError } = useSocket();

  const devId = searchParams.get('dev');
  const { PLAYER_ID_KEY, PLAYER_NAME_KEY } = getStorageKeys(devId);

  const [playerName, setPlayerName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let id = localStorage.getItem(PLAYER_ID_KEY);
    if (!id) {
      id = uuidv4();
      localStorage.setItem(PLAYER_ID_KEY, id);
    }
    setPlayerId(id);

    const savedName = localStorage.getItem(PLAYER_NAME_KEY);
    if (savedName) {
      setPlayerName(savedName);
    } else if (devId) {
      setPlayerName(`Player ${devId}`);
    }

    const roomFromUrl = searchParams.get('room');
    if (roomFromUrl) {
      setRoomIdInput(roomFromUrl.toUpperCase());
    }
  }, [searchParams, PLAYER_ID_KEY, PLAYER_NAME_KEY, devId]);

  useEffect(() => {
    const socket = getSocket();
    const devParam = devId ? `?dev=${devId}` : '';

    function onRoomCreated(data: { roomId: string }) {
      setIsLoading(false);
      router.push(`/one-hint/room/${data.roomId}${devParam}`);
    }

    function onRoomJoined(data: { roomId: string }) {
      setIsLoading(false);
      router.push(`/one-hint/room/${data.roomId}${devParam}`);
    }

    function onError() {
      setIsLoading(false);
    }

    socket.on('room-created', onRoomCreated);
    socket.on('room-joined', onRoomJoined);
    socket.on('error', onError);

    return () => {
      socket.off('room-created', onRoomCreated);
      socket.off('room-joined', onRoomJoined);
      socket.off('error', onError);
    };
  }, [router, devId]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      return;
    }
    localStorage.setItem(PLAYER_NAME_KEY, playerName.trim());
    setIsLoading(true);
    createRoom(playerId, playerName.trim(), 'one-hint');
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomIdInput.trim()) {
      return;
    }
    localStorage.setItem(PLAYER_NAME_KEY, playerName.trim());
    setIsLoading(true);
    joinRoom(roomIdInput.trim().toUpperCase(), playerId, playerName.trim());
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-sm mx-auto pt-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-slate-400 hover:text-slate-600 text-sm">
            ← 戻る
          </Link>
          {isConnected ? (
            <span className="text-green-600 text-xs">● 接続中</span>
          ) : (
            <span className="text-orange-500 text-xs">● 接続中...</span>
          )}
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">One Hint</h1>
          <p className="text-slate-500 text-sm mt-1">AIが審判の協力型ワードゲーム</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg mb-4 text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-600 ml-2">✕</button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">名前</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="あなたの名前"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              maxLength={20}
            />
          </div>

          <button
            onClick={handleCreateRoom}
            disabled={!playerName.trim() || !isConnected || isLoading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isLoading ? '作成中...' : '新しい部屋を作成'}
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-white text-slate-400 text-xs">または</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">ルームIDで参加</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                placeholder="ABCD"
                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase text-center font-mono tracking-wider"
                maxLength={4}
              />
              <button
                onClick={handleJoinRoom}
                disabled={!playerName.trim() || !roomIdInput.trim() || !isConnected || isLoading}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                参加
              </button>
            </div>
          </div>
        </div>

        <details className="mt-4 text-sm">
          <summary className="text-slate-500 cursor-pointer hover:text-slate-700">遊び方を見る</summary>
          <ol className="mt-3 space-y-1.5 text-slate-600 pl-4 list-decimal list-inside">
            <li>1人が回答者になり、お題を見れない</li>
            <li>他のプレイヤーは1単語ずつヒントを出す</li>
            <li>AIが重複ヒントを判定して無効化</li>
            <li>回答者は有効なヒントだけを見て答える</li>
          </ol>
        </details>
      </div>
    </main>
  );
}
