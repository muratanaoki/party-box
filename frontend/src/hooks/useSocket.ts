'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket';
import { RoomState, GameType } from '@/types/game';

interface UseSocketReturn {
  isConnected: boolean;
  roomState: RoomState | null;
  error: string | null;
  createRoom: (playerId: string, playerName: string, gameType?: GameType) => void;
  joinRoom: (roomId: string, playerId: string, playerName: string) => void;
  startGame: (roomId: string, playerId: string) => void;
  submitHint: (roomId: string, playerId: string, hint: string) => void;
  submitAnswer: (roomId: string, playerId: string, answer: string) => void;
  nextRound: (roomId: string, playerId: string) => void;
  clearError: () => void;
}

export function useSocket(): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onRoomUpdated(state: RoomState) {
      setRoomState(state);
    }

    function onError(data: { message: string }) {
      setError(data.message);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room-updated', onRoomUpdated);
    socket.on('error', onError);

    connectSocket();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room-updated', onRoomUpdated);
      socket.off('error', onError);
      disconnectSocket();
    };
  }, []);

  const createRoom = useCallback(
    (playerId: string, playerName: string, gameType?: GameType) => {
      const socket = getSocket();
      socket.emit('create-room', { playerId, playerName, gameType });
    },
    []
  );

  const joinRoom = useCallback(
    (roomId: string, playerId: string, playerName: string) => {
      const socket = getSocket();
      socket.emit('join-room', { roomId, playerId, playerName });
    },
    []
  );

  const startGame = useCallback((roomId: string, playerId: string) => {
    const socket = getSocket();
    socket.emit('start-game', { roomId, playerId });
  }, []);

  const submitHint = useCallback(
    (roomId: string, playerId: string, hint: string) => {
      const socket = getSocket();
      socket.emit('submit-hint', { roomId, playerId, hint });
    },
    []
  );

  const submitAnswer = useCallback(
    (roomId: string, playerId: string, answer: string) => {
      const socket = getSocket();
      socket.emit('submit-answer', { roomId, playerId, answer });
    },
    []
  );

  const nextRound = useCallback((roomId: string, playerId: string) => {
    const socket = getSocket();
    socket.emit('next-round', { roomId, playerId });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isConnected,
    roomState,
    error,
    createRoom,
    joinRoom,
    startGame,
    submitHint,
    submitAnswer,
    nextRound,
    clearError,
  };
}
