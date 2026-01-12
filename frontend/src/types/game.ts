export type GamePhase = 'LOBBY' | 'HINTING' | 'GUESSING' | 'RESULT';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
}

export interface Hint {
  playerId: string;
  playerName: string;
  text: string | null;
  isValid: boolean;
}

export interface Game {
  phase: GamePhase;
  topic: string | null;
  answererId: string;
  hints: Hint[];
  answer: string | null;
  isCorrect: boolean | null;
  round: number;
}

export interface RoomState {
  id: string;
  players: Player[];
  game: Game | null;
}
