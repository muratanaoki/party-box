import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  IHintJudgeService,
  HintJudgmentResult,
} from '../../domain/service/i-hint-judge.service';
import { Hint } from '../../domain/model/games/one-hint/one-hint.game';

@Injectable()
export class OpenAIHintJudgeService implements IHintJudgeService {
  private readonly logger = new Logger(OpenAIHintJudgeService.name);
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async judgeHints(topic: string, hints: Hint[]): Promise<HintJudgmentResult[]> {
    if (hints.length === 0) {
      return [];
    }

    const hintTexts = hints.map((h, i) => `${i + 1}. "${h.text}"`).join('\n');

    const prompt = `あなたは「ジャストワン」というワードゲームの審判です。

お題: 「${topic}」

以下のヒントを判定してください:
${hintTexts}

判定基準:
1. お題そのものが含まれている場合は無効 (例: お題が「りんご」でヒントが「りんごジュース」は無効)
2. ヒント同士で意味が重複している場合は、両方とも無効 (例: 「車」と「自動車」は重複)
3. お題の読み方を変えただけのヒントは無効 (例: お題が「日本」でヒントが「にほん」や「ニッポン」)

各ヒントについて、以下のJSON形式で回答してください:
{
  "results": [
    {"index": 1, "valid": true/false, "reason": "理由"},
    ...
  ]
}

JSONのみを出力してください。`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'あなたはワードゲームの公正な審判です。JSON形式で回答してください。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        this.logger.warn('Empty response from OpenAI, marking all hints as valid');
        return hints.map((h) => ({ playerId: h.playerId, isValid: true }));
      }

      const parsed = JSON.parse(content) as {
        results: Array<{ index: number; valid: boolean; reason?: string }>;
      };

      return hints.map((hint, index) => {
        const result = parsed.results.find((r) => r.index === index + 1);
        return {
          playerId: hint.playerId,
          isValid: result?.valid ?? true,
          reason: result?.reason,
        };
      });
    } catch (error) {
      this.logger.error('Failed to judge hints with OpenAI', error);
      return hints.map((h) => ({ playerId: h.playerId, isValid: true }));
    }
  }
}
