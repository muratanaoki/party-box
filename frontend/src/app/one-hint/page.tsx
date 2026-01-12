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
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm transition-colors">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            ゲーム選択
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">One Hint</h1>
            <p className="text-gray-500">AIが審判の協力型ワード推測ゲーム</p>
            <div className="mt-3">
              {isConnected ? (
                <span className="inline-flex items-center text-green-600 text-sm font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  接続中
                </span>
              ) : (
                <span className="inline-flex items-center text-orange-600 text-sm font-medium">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></span>
                  接続待ち...
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative">
              <span>{error}</span>
              <button
                onClick={clearError}
                className="absolute top-2 right-2 text-red-400 hover:text-red-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">表示名</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="名前を入力"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                maxLength={20}
              />
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={!playerName.trim() || !isConnected || isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors shadow-lg shadow-indigo-200 disabled:shadow-none"
            >
              {isLoading ? '作成中...' : '部屋を作成'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-400">または</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ルームIDで参加
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                  placeholder="ABCD"
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase text-gray-900 placeholder-gray-400 text-center font-mono tracking-widest"
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
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
                >
                  参加
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white/60 backdrop-blur rounded-xl p-5 text-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            遊び方
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
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
