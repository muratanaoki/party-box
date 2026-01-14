'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { useSocket } from '@/hooks/useSocket';
import { getSocket } from '@/lib/socket';
import { getStorageKeys } from '@/lib/storage';

export default function JustOneLobby() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConnected, createRoom, joinRoom, error, clearError } = useSocket();

  const devId = searchParams.get('dev');
  const roomFromUrl = searchParams.get('room');
  const { PLAYER_ID_KEY, PLAYER_NAME_KEY } = getStorageKeys(devId);

  const [playerName, setPlayerName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);
  const isComposingRef = useRef(false);

  // 初期化
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
      const autoName = `Player ${devId}`;
      setPlayerName(autoName);
      localStorage.setItem(PLAYER_NAME_KEY, autoName);
    }

    if (roomFromUrl) {
      setRoomIdInput(roomFromUrl.toUpperCase());
    }
  }, [searchParams, PLAYER_ID_KEY, PLAYER_NAME_KEY, devId, roomFromUrl]);

  // URLにroomがあり、名前があれば自動参加
  useEffect(() => {
    if (roomFromUrl && playerId && playerName && isConnected && !autoJoinAttempted) {
      setAutoJoinAttempted(true);
      setIsLoading(true);
      joinRoom(roomFromUrl.toUpperCase(), playerId, playerName);
    }
  }, [roomFromUrl, playerId, playerName, isConnected, autoJoinAttempted, joinRoom]);

  // Socket イベント
  useEffect(() => {
    const socket = getSocket();
    const devParam = devId ? `?dev=${devId}` : '';

    function onRoomCreated(data: { roomId: string }) {
      setIsLoading(false);
      // Dev modeの場合、親ウィンドウにroomIdを通知
      if (devId && window.parent !== window) {
        window.parent.postMessage({ type: 'ROOM_CREATED', roomId: data.roomId }, '*');
      }
      router.push(`/just-one/room/${data.roomId}${devParam}`);
    }

    function onRoomJoined(data: { roomId: string }) {
      setIsLoading(false);
      router.push(`/just-one/room/${data.roomId}${devParam}`);
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
    if (!playerName.trim() || isLoading) return;
    localStorage.setItem(PLAYER_NAME_KEY, playerName.trim());
    setIsLoading(true);
    createRoom(playerId, playerName.trim(), 'just-one');
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomIdInput.trim() || isLoading) return;
    localStorage.setItem(PLAYER_NAME_KEY, playerName.trim());
    setIsLoading(true);
    joinRoom(roomIdInput.trim().toUpperCase(), playerId, playerName.trim());
  };

  const handleRoomIdKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isComposingRef.current) {
      e.preventDefault();
      handleJoinRoom();
    }
  };

  // Dev modeでURLにroomがあり自動参加中の場合
  if (devId && roomFromUrl && isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-600">参加中...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        {!devId && (
          <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-700 text-sm mb-6">
            ← ゲーム選択
          </Link>
        )}

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Just One</h1>
          <p className="text-slate-500 mt-2">AIが審判の協力型ワードゲーム</p>
          <div className="mt-3">
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 text-green-600 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                接続済み
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-600 text-sm">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                接続中...
              </span>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex justify-between items-center">
            <span className="text-sm">{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-600 text-lg leading-none cursor-pointer">×</button>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 space-y-5">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">あなたの名前</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="名前を入力"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              maxLength={20}
              disabled={isLoading}
            />
          </div>

          {/* Create Room */}
          <button
            onClick={handleCreateRoom}
            disabled={!playerName.trim() || !isConnected || isLoading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-semibold transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? '作成中...' : '新しい部屋を作成'}
          </button>

          {/* Divider */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-slate-400 text-sm">または</span>
            </div>
          </div>

          {/* Join Room */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">部屋IDで参加</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                onKeyDown={handleRoomIdKeyDown}
                onCompositionStart={() => { isComposingRef.current = true; }}
                onCompositionEnd={() => { isComposingRef.current = false; }}
                placeholder="ABCD"
                className="min-w-0 flex-1 px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-base font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                maxLength={4}
                disabled={isLoading}
              />
              <button
                onClick={handleJoinRoom}
                disabled={!playerName.trim() || !roomIdInput.trim() || !isConnected || isLoading}
                className="shrink-0 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? '...' : '参加'}
              </button>
            </div>
          </div>
        </div>

        {/* How to play */}
        {!devId && (
          <details className="mt-6">
            <summary className="text-slate-500 cursor-pointer hover:text-slate-700 text-sm font-medium">
              遊び方
            </summary>
            <div className="mt-3 bg-white rounded-xl border border-slate-200 p-4">
              <ol className="space-y-2 text-sm text-slate-600">
                <li className="flex gap-2">
                  <span className="text-indigo-500 font-medium">1.</span>
                  1人が回答者になり、お題を見れない
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-500 font-medium">2.</span>
                  他のプレイヤーは1単語ずつヒントを出す
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-500 font-medium">3.</span>
                  AIが重複ヒントを判定して無効化
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-500 font-medium">4.</span>
                  回答者は有効なヒントだけを見て答える
                </li>
              </ol>
            </div>
          </details>
        )}
      </div>
    </main>
  );
}
