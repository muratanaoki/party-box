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
    // カテゴリをランダムに選ぶ（重複を減らすため具体的に）
    const categories = [
      "動物園にいる動物",
      "海の生き物",
      "ペットとして飼える動物",
      "日本の観光地",
      "世界の有名な場所",
      "スポーツ",
      "楽器",
      "乗り物",
      "職業",
      "日本の行事・イベント",
      "家電製品",
      "キッチン用品",
      "文房具",
      "おもちゃ・ゲーム",
      "服・ファッション",
      "アニメ・漫画のキャラクター",
      "映画・ドラマ",
      "お菓子・スイーツ",
      "和食",
      "洋食",
      "飲み物",
      "果物",
      "野菜",
      "花",
      "木",
      "虫",
      "鳥",
      "天気・自然現象",
      "体の部位",
      "感情",
      "色",
      "形",
      "日用品",
      "家具",
      "建物",
      "お店の種類",
      "学校にあるもの",
      "公園にあるもの",
      "病院にあるもの",
      "夏に関係するもの",
      "冬に関係するもの",
      "お正月に関係するもの",
      "クリスマスに関係するもの",
    ];
    const category = categories[Math.floor(Math.random() * categories.length)];

    const excludeNote =
      excludeTopics.length > 0
        ? `\n絶対に使わないで: ${excludeTopics.slice(-50).join("、")}`
        : "";

    // ランダムな数字でバリエーションを出す
    const randomNum = Math.floor(Math.random() * 100) + 1;

    const prompt = `「${category}」から連想される単語を1つだけ出力。
条件:
- 小学生でも知ってる一般的な単語
- 定番すぎない（犬、猫、りんご等は避ける）
- ランダムシード: ${randomNum}
${excludeNote}
単語のみ出力:`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "日本語の名詞を1つだけ出力。説明や句読点は不要。単語のみ。",
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

    const prompt = `お題「${topic}」とヒント「${hint}」は翻訳または表記違い？

【無効＝翻訳・表記違い】
- 表記違い: 猫=ねこ=ネコ、林檎=りんご
- 翻訳: 犬=dog=ドッグ、海=sea=シー、霧=mist=ミスト、家=home=ホーム、車=car=カー、りんご=apple=アップル

【有効＝翻訳ではない】
- 連想語・関連語は有効: 海→波、犬→ペット、りんご→果物、屋根→家、屋根→ホーム
- 上位/下位カテゴリは有効: ピカチュウ→ポケモン、犬→動物

質問: ヒント「${hint}」はお題「${topic}」の翻訳または表記違いか？
{"valid":true/false,"error":"理由"}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: "JSON出力のみ" },
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

    const prompt = `ヒント重複チェック:
${hintTexts}

重複=両方無効、重複じゃない=両方有効

【重複の定義】文中で置き換えても意味が同じになるもの
重複の例:
- 表記違い: 猫=ねこ、林檎=りんご
- 完全な同義語: 車=自動車、大きい=でかい、美しい=綺麗
- 翻訳: 犬=dog、家=house

【重複ではない】品詞が違う、または意味が異なるもの
重複じゃない例:
- 品詞違い: 暑い(形容詞)≠夏(名詞)、走る(動詞)≠速い(形容詞)
- 関連語: 海≠波、犬≠ペット、りんご≠果物
- 派生語: 王子≠王女、教師≠生徒

迷ったら重複じゃない。{"results":[{"index":1,"valid":true/false}...]}`;

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
