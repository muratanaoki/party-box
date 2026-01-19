import { Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";
import {
  IHintJudgeService,
  HintJudgmentResult,
  HintFormatValidation,
} from "../../domain/service/i-hint-judge.service";
import { Hint } from "../../domain/model/games/just-one/just-one.game";

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
    // カテゴリをランダムに選ぶ
    const categories = [
      "食べ物",
      "動物",
      "場所",
      "道具",
      "乗り物",
      "スポーツ",
      "体の部位",
      "職業",
      "イベント",
      "楽器",
      "服",
      "キャラクター",
      "家電",
      "植物",
      "お菓子",
      "文房具",
      "おもちゃ",
      "家具",
      "飲み物",
      "国",
      "虫",
      "野菜",
      "果物",
      "魚",
      "鳥",
      "料理",
      "建物",
      "天気",
      "色",
    ];
    const category = categories[Math.floor(Math.random() * categories.length)];

    const excludeNote =
      excludeTopics.length > 0
        ? `\n使用禁止: ${excludeTopics.slice(-30).join("、")}`
        : "";

    // バリエーションを出すためにランダムな条件を追加
    const variations = [
      "定番の",
      "みんなが知ってる",
      "日常でよく見る",
      "子供も知ってる",
      "テレビでよく見る",
      "身近な",
      "人気の",
      "有名な",
      "",
      "",
      "",
    ];
    const variation = variations[Math.floor(Math.random() * variations.length)];

    const prompt = `「${category}」の中から、${variation}単語を1つ。ただし定番すぎるもの（犬、猫、りんご、バナナ等）は避けて。専門用語・マイナーすぎるものは禁止。単語のみ出力。${excludeNote}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "日本語の名詞を1つだけ出力。説明不要。",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 15,
        temperature: 1.0,
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
    const prompt = `「${hint}」は1単語ですか？

## OKな例（1単語として認める）
- 名詞、形容詞、動詞: 「猫」「赤い」「走る」
- 固有名詞: 「ピカチュウ」「東京タワー」「スターバックス」
- 複合語: 「目覚まし時計」「携帯電話」

## NGな例（1単語ではない）
- 助詞付き: 「猫の」「りんごは」「海へ」「友達と」
- 助動詞付き: 「赤いです」「走ります」
- 2語以上: 「とても甘い」「大きな犬」
- 文章: 「りんごは赤い」

JSON形式: {"valid":true/false,"error":"NGの場合の理由"}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: "1単語チェッカー。JSON出力のみ。" },
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
    const fallbackWords = [
      "りんご",
      "電車",
      "猫",
      "太陽",
      "学校",
      "傘",
      "カレー",
      "海",
      "時計",
      "本",
      "桜",
      "雨",
      "犬",
      "月",
      "山",
      "パン",
      "ドラえもん",
      "ピカチュウ",
      "アンパンマン",
      "サンタクロース",
    ];
    const available = fallbackWords.filter((w) => !excludeTopics.includes(w));
    if (available.length === 0) {
      return fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
    }
    return available[Math.floor(Math.random() * available.length)];
  }

  async validateHintAgainstTopic(
    topic: string,
    hint: string,
  ): Promise<HintFormatValidation> {
    const prompt = `お題「${topic}」にヒント「${hint}」は有効？

無効条件（厳密にこれだけ）:
1. お題と完全に同じ/表記違い（猫=ねこ=ネコ）
2. お題の文字列を含む（山→富士山、電車→電車賃）
3. お題の一部の文字（りんご→りん、携帯電話→携帯）
4. お題の直接翻訳（犬→dog、猫→cat、海→sea/ocean）

有効な例（これらは許可）:
- 連想語: 屋根→家、瓦、建物、ホーム（直接翻訳ではない）
- 関連語: 海→波、砂浜、夏
- 同カテゴリ: 犬→柴犬、プードル

「翻訳」とは同じ意味の外国語への直訳のみ。連想や関連は翻訳ではない。
迷ったら必ず有効にする。
{"valid":true/false,"error":"無効理由"}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: "JSON出力のみ" },
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

    const prompt = `ヒント重複チェック:
${hintTexts}

重複=無効（両方消える）:
- 同じ/表記違い（猫=ねこ）
- 同義語（車=自動車）
- 翻訳（犬=dog）

重複じゃない（両方有効）:
- 派生語（王子と王女）
- 関連語（暑いと夏）

迷ったら有効。
{"results":[{"index":1,"valid":true/false,"reason":"理由"}...]}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: "JSON出力のみ" },
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
    const prompt = `お題「${topic}」に回答「${answer}」は正解？

正解: 同じ意味（表記違い/ひらがな/カタカナ/漢字OK）
例: 財布=さいふ=サイフ、りんご=リンゴ=林檎

不正解: 別の単語

{"correct":true/false,"reason":"理由"}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: "JSON出力のみ" },
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
