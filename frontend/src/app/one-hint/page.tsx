'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { useSocket } from '@/hooks/useSocket';
import { getSocket } from '@/lib/socket';

const PLAYER_ID_KEY = 'partybox_player_id';
const PLAYER_NAME_KEY = 'partybox_player_name';

export default function OneHintLobby() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConnected, createRoom, joinRoom, error, clearError } = useSocket();

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
    }

    const roomFromUrl = searchParams.get('room');
    if (roomFromUrl) {
      setRoomIdInput(roomFromUrl.toUpperCase());
    }
  }, [searchParams]);

  useEffect(() => {
    const socket = getSocket();

    function onRoomCreated(data: { roomId: string }) {
      setIsLoading(false);
      router.push(`/one-hint/room/${data.roomId}`);
    }

    function onRoomJoined(data: { roomId: string }) {
      setIsLoading(false);
      router.push(`/one-hint/room/${data.roomId}`);
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
  }, [router]);

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
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            ← ゲーム選択に戻る
          </Link>
          <h1 className="text-4xl font-bold mt-4 mb-2">One Hint</h1>
          <p className="text-gray-400">AIが審判の協力型ワード推測ゲーム</p>
          <div className="mt-2">
            {isConnected ? (
              <span className="text-green-500 text-sm">● 接続中</span>
            ) : (
              <span className="text-red-500 text-sm">● 接続待ち...</span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded relative">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="absolute top-0 right-0 p-3"
            >
              ×
            </button>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">表示名</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="名前を入力"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              maxLength={20}
            />
          </div>

          <button
            onClick={handleCreateRoom}
            disabled={!playerName.trim() || !isConnected || isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {isLoading ? '作成中...' : '部屋を作成'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#0a0a0a] text-gray-400">または</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              ルームIDで参加
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                placeholder="ABCD"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 uppercase"
                maxLength={4}
              />
              <button
                onClick={handleJoinRoom}
                disabled={
                  !playerName.trim() ||
                  !roomIdInput.trim() ||
                  !isConnected ||
                  isLoading
                }
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                参加
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-400">
          <h3 className="font-medium text-white mb-2">遊び方</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>1人が回答者になり、お題を見れない</li>
            <li>他のプレイヤーは1単語ずつヒントを出す</li>
            <li>AIが重複ヒントを判定して無効化</li>
            <li>回答者は有効なヒントだけを見て答える</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
