import { Hint } from '../model/games/one-hint/one-hint.game';

export interface HintJudgmentResult {
  playerId: string;
  isValid: boolean;
  reason?: string;
}

export interface IHintJudgeService {
  judgeHints(topic: string, hints: Hint[]): Promise<HintJudgmentResult[]>;
}

export const HINT_JUDGE_SERVICE = Symbol('IHintJudgeService');
