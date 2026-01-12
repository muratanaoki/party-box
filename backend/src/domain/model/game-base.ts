export type GameType = 'one-hint';

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
  'one-hint': {
    minPlayers: 3,
    maxPlayers: 10,
    name: 'One Hint',
    description: 'AIが審判のワード推測ゲーム',
  },
};
