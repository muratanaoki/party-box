export type GameType = 'one-hint';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
}

export interface GameBase {
  type: GameType;
  phase: string;
  round: number;
}

export interface Hint {
  playerId: string;
  playerName: string;
  text: string | null;
  isValid: boolean;
}

export interface OneHintGame extends GameBase {
  type: 'one-hint';
  phase: 'HINTING' | 'GUESSING' | 'RESULT';
  topic: string | null;
  answererId: string;
  hints: Hint[];
  answer: string | null;
  isCorrect: boolean | null;
}

export type Game = OneHintGame;

export interface RoomState {
  id: string;
  players: Player[];
  gameType: GameType;
  game: Game | null;
}
