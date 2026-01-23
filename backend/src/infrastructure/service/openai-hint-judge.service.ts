import { Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";
import {
  IHintJudgeService,
  HintJudgmentResult,
  HintFormatValidation,
} from "../../domain/service/i-hint-judge.service";
import { Hint } from "../../domain/model/games/just-one/just-one.game";
import {
  TOPIC_CATEGORIES,
  FALLBACK_TOPICS,
  SYSTEM_PROMPTS,
  USER_PROMPTS,
} from "./prompts/just-one.prompts";

@Injectable()
export class OpenAIHintJudgeService implements IHintJudgeService {
  private readonly logger = new Logger(OpenAIHintJudgeService.name);
  private readonly openai: OpenAI;
  private readonly model = "gpt-4.1-mini"; // 全機能で使用（高速・低コスト）

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateTopic(excludeTopics: string[] = []): Promise<string> {
    this.logger.log(
      `Generating topic... (excludeTopics: ${excludeTopics.length})`,
    );
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const topic = await this.tryGenerateTopic(excludeTopics);
      this.logger.log(`Generated topic attempt ${attempt + 1}: "${topic}"`);
      if (topic && !excludeTopics.includes(topic)) {
        this.logger.log(`Topic generation successful: "${topic}"`);
        return topic;
      }
      this.logger.warn(
        `Topic generation failed or duplicate, retrying (${attempt + 1}/${maxRetries})`,
      );
    }

    // リトライ失敗時はフォールバック
    const fallback = this.getFallbackTopic(excludeTopics);
    this.logger.warn(`Using fallback topic: "${fallback}"`);
    return fallback;
  }

  private async tryGenerateTopic(
    excludeTopics: string[],
  ): Promise<string | null> {
    // カテゴリをランダムに選ぶ（重複を減らすため具体的に）
    const category =
      TOPIC_CATEGORIES[Math.floor(Math.random() * TOPIC_CATEGORIES.length)];

    // ランダムな数字でバリエーションを出す
    const randomNum = Math.floor(Math.random() * 100) + 1;

    const prompt = USER_PROMPTS.generateTopic(category, randomNum, excludeTopics);

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPTS.GENERATE_TOPIC,
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 20,
        temperature: 1.2, // より多様性を出す
      });

      const content = response.choices[0]?.message?.content?.trim();
      // "null"文字列や空文字はnullとして扱う
      if (!content || content === "null" || content === "undefined") {
        return null;
      }
      // フレーズ（「の」「な」「と」「や」を含む）は無効
      if (/[のなとや]/.test(content) && content.length > 4) {
        this.logger.warn(`Rejected phrase: "${content}"`);
        return null;
      }
      // スペースを含む場合は無効
      if (/\s/.test(content)) {
        this.logger.warn(`Rejected phrase with space: "${content}"`);
        return null;
      }
      return content;
    } catch (error) {
      this.logger.error(
        `Failed to generate topic from OpenAI: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  async validateHintFormat(hint: string): Promise<HintFormatValidation> {
    const prompt = USER_PROMPTS.validateFormat(hint);

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPTS.VALIDATE_FORMAT },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 60,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return { isValid: true };
      }

      const parsed = JSON.parse(content) as { valid: boolean; error?: string };
      return {
        isValid: parsed.valid,
        error: parsed.error,
      };
    } catch (error) {
      this.logger.error("Failed to validate hint format", error);
      return { isValid: true };
    }
  }

  private getFallbackTopic(excludeTopics: string[] = []): string {
    const available = FALLBACK_TOPICS.filter((w) => !excludeTopics.includes(w));
    if (available.length === 0) {
      return FALLBACK_TOPICS[Math.floor(Math.random() * FALLBACK_TOPICS.length)];
    }
    return available[Math.floor(Math.random() * available.length)];
  }

  async validateHintAgainstTopic(
    topic: string,
    hint: string,
  ): Promise<HintFormatValidation> {
    // === コードチェック（AI不要）===

    // 1. 完全一致
    if (hint === topic) {
      return { isValid: false, error: "お題と同じです" };
    }

    // 2. ヒントがお題を含む（山→富士山✗）
    if (hint.includes(topic)) {
      return { isValid: false, error: "お題の文字を含んでいます" };
    }

    // 3. お題がヒントを含む（携帯電話→携帯✗、りんご→りん✗）
    if (topic.includes(hint) && hint.length >= 2) {
      return { isValid: false, error: "お題の一部です" };
    }

    // === AIチェック（意味的判定のみ）===
    // 表記違い（猫=ねこ）、翻訳（犬=dog）のみをチェック

    const prompt = USER_PROMPTS.validateAgainstTopic(topic, hint);

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPTS.VALIDATE_AGAINST_TOPIC },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 100,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return { isValid: true };
      }

      const parsed = JSON.parse(content) as { valid: boolean; error?: string };
      return {
        isValid: parsed.valid,
        error: parsed.error,
      };
    } catch (error) {
      this.logger.error("Failed to validate hint against topic", error);
      return { isValid: true };
    }
  }

  async judgeHints(
    _topic: string,
    hints: Hint[],
  ): Promise<HintJudgmentResult[]> {
    if (hints.length === 0) {
      return [];
    }

    const hintTexts = hints.map((h, i) => `${i + 1}. "${h.text}"`).join("\n");
    const prompt = USER_PROMPTS.judgeHints(hintTexts);

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPTS.JUDGE_HINTS },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        this.logger.warn(
          "Empty response from OpenAI, marking all hints as valid",
        );
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
      this.logger.error("Failed to judge hints with OpenAI", error);
      return hints.map((h) => ({ playerId: h.playerId, isValid: true }));
    }
  }

  async judgeAnswer(
    topic: string,
    answer: string,
  ): Promise<{ isCorrect: boolean; reason?: string }> {
    const prompt = USER_PROMPTS.judgeAnswer(topic, answer);

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPTS.JUDGE_ANSWER },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 50,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        // フォールバック: シンプルな比較
        const normalizedAnswer = answer.trim().toLowerCase();
        const normalizedTopic = topic.trim().toLowerCase();
        return { isCorrect: normalizedAnswer === normalizedTopic };
      }

      const parsed = JSON.parse(content) as {
        correct: boolean;
        reason?: string;
      };
      return {
        isCorrect: parsed.correct,
        reason: parsed.reason,
      };
    } catch (error) {
      this.logger.error("Failed to judge answer with OpenAI", error);
      // フォールバック: シンプルな比較
      const normalizedAnswer = answer.trim().toLowerCase();
      const normalizedTopic = topic.trim().toLowerCase();
      return { isCorrect: normalizedAnswer === normalizedTopic };
    }
  }
}
