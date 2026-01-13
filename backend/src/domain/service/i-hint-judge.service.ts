import { Hint } from '../model/games/one-hint/one-hint.game';

export interface HintJudgmentResult {
  playerId: string;
  isValid: boolean;
  reason?: string;
}

export interface HintFormatValidation {
  isValid: boolean;
  error?: string;
}

export interface AnswerJudgment {
  isCorrect: boolean;
  reason?: string;
}

export interface IHintJudgeService {
  generateTopic(): Promise<string>;
  validateHintFormat(hint: string): Promise<HintFormatValidation>;
  validateHintAgainstTopic(topic: string, hint: string): Promise<HintFormatValidation>;
  judgeHints(topic: string, hints: Hint[]): Promise<HintJudgmentResult[]>;
  judgeAnswer(topic: string, answer: string): Promise<AnswerJudgment>;
}

export const HINT_JUDGE_SERVICE = Symbol('IHintJudgeService');
