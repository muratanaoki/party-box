export type GameType = 'just-one';

// ゲーム設定（バックエンドと同期）
export const GAME_CONFIGS: Record<GameType, { minPlayers: number }> = {
  'just-one': { minPlayers: 3 },
};

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

export interface JustOneGame extends GameBase {
  type: 'just-one';
  phase: 'HINTING' | 'GUESSING' | 'RESULT' | 'FINISHED';
  topic: string | null;
  answererId: string;
  hints: Hint[];
  answer: string | null;
  isCorrect: boolean | null;
  totalRounds: number;
}

export type Game = JustOneGame;

export interface RoomState {
  id: string;
  players: Player[];
  gameType: GameType;
  game: Game | null;
}
