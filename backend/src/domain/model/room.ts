import { Player } from './player';
import { GameType } from './game-base';
import { Game } from './games';

export interface Room {
  id: string;
  players: Player[];
  gameType: GameType;
  game: Game | null;
  createdAt: Date;
}

export function createRoom(id: string, host: Player, gameType: GameType = 'just-one'): Room {
  return {
    id,
    players: [host],
    gameType,
    game: null,
    createdAt: new Date(),
  };
}

export function addPlayerToRoom(room: Room, player: Player): Room {
  if (room.players.some((p) => p.id === player.id)) {
    return room;
  }
  return {
    ...room,
    players: [...room.players, player],
  };
}

export function updatePlayerConnection(
  room: Room,
  playerId: string,
  isConnected: boolean,
): Room {
  return {
    ...room,
    players: room.players.map((p) =>
      p.id === playerId ? { ...p, isConnected } : p,
    ),
  };
}

export function getHost(room: Room): Player | undefined {
  return room.players.find((p) => p.isHost);
}

export function generateRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
