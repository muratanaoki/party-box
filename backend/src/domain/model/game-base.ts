export type GameType = 'just-one';

export interface GameBase {
  type: GameType;
  phase: string;
  round: number;
}

export interface GameConfig {
  minPlayers: number;
  maxPlayers: number;
  name: string;
  description: string;
}

export const GAME_CONFIGS: Record<GameType, GameConfig> = {
  'just-one': {
    minPlayers: 3,
    maxPlayers: 10,
    name: 'Just One',
    description: 'AIが審判のワード推測ゲーム',
  },
};
