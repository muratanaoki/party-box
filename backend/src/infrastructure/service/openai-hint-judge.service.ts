import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  IHintJudgeService,
  HintJudgmentResult,
  HintFormatValidation,
} from '../../domain/service/i-hint-judge.service';
import { Hint } from '../../domain/model/games/one-hint/one-hint.game';

@Injectable()
export class OpenAIHintJudgeService implements IHintJudgeService {
  private readonly logger = new Logger(OpenAIHintJudgeService.name);
  private readonly openai: OpenAI;
  private readonly model = 'gpt-4.1-mini';

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateTopic(): Promise<string> {
    const prompt = `ジャストワン（Just One）というワードゲームのお題を1つ生成してください。

## 条件
- 日本語の単語1つ
- 老若男女、誰でも知っている普遍的な言葉
- 具体的な名詞（抽象的すぎない）
- ヒントを出しやすい言葉
- 固有名詞（キャラクター名、ブランド名など）は避ける

## 良い例
食べ物: りんご、カレー、寿司、ラーメン、パン、卵
動物: 猫、犬、象、ライオン、うさぎ
場所: 学校、病院、駅、公園、海、山
物: 傘、時計、本、鏡、椅子、窓
自然: 太陽、月、雨、雪、桜、虹
乗り物: 電車、飛行機、自転車、バス、船

## 悪い例（避けるべき）
- ミュウツー（知らない人がいる）
- スターバックス（ブランド名）
- 哲学（抽象的すぎる）
- 〇〇さん（人名）

単語のみを出力してください（説明不要）:`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'お題生成器。単語のみ出力。' },
          { role: 'user', content: prompt },
        ],
        temperature: 1.0, // バリエーションを出すため高め
        max_tokens: 20,
      });

      const topic = response.choices[0]?.message?.content?.trim();
      if (!topic) {
        // フォールバック
        return this.getFallbackTopic();
      }
      return topic;
    } catch (error) {
      this.logger.error('Failed to generate topic', error);
      return this.getFallbackTopic();
    }
  }

  private getFallbackTopic(): string {
    const fallbackWords = [
      'りんご', '電車', '猫', '太陽', '学校', '傘', 'カレー', '海',
      '時計', '本', '桜', '雨', '犬', '月', '山', 'パン',
    ];
    return fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
  }

  async validateHintFormat(hint: string): Promise<HintFormatValidation> {
    const prompt = `ジャストワン（Just One）のヒント形式をチェックしてください。

ヒント: 「${hint}」

## ルール
- ヒントは「1単語」でなければならない
- 助詞（は、が、を、に、で、と、の、へ、や、から、まで等）を含んではいけない
- 文章や複数の単語の組み合わせは禁止
- 数字やオノマトペ（擬音語・擬態語）は単語として有効

## 有効な例
- 「赤い」「果物」「丸い」「100」「ゴロゴロ」

## 無効な例
- 「赤いです」（助動詞付き）
- 「果物の」（助詞付き）
- 「とても甘い」（複数単語）
- 「りんごは赤い」（文章）

JSON形式で回答:
{"valid": true/false, "error": "無効な場合の理由（日本語）"}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'ヒント形式チェッカー。JSON形式で回答。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
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
      this.logger.error('Failed to validate hint format', error);
      return { isValid: true };
    }
  }

  async validateHintAgainstTopic(topic: string, hint: string): Promise<HintFormatValidation> {
    const prompt = `ジャストワン（Just One）のヒントがお題に対して有効かチェックしてください。

お題: 「${topic}」
ヒント: 「${hint}」

## 無効なヒント（出し直しが必要）
以下の場合は無効:
- お題の単語がヒントに含まれている（例: お題「山」→「富士山」は無効）
- お題の読み方違い（例: お題「日本」→「にほん」「ニッポン」は無効）
- お題の翻訳（例: お題「犬」→「dog」は無効）
- お題の派生語・同じ語族（例: お題「王子」→「王女」は無効）

## 有効なヒント
- お題を連想させるが、お題自体を含まないヒント（例: お題「山」→「登山」は無効、「高い」は有効）

JSON形式で回答:
{"valid": true/false, "error": "無効な場合の理由（日本語）"}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'ヒント有効性チェッカー。JSON形式で回答。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
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
      this.logger.error('Failed to validate hint against topic', error);
      return { isValid: true };
    }
  }

  async judgeHints(topic: string, hints: Hint[]): Promise<HintJudgmentResult[]> {
    if (hints.length === 0) {
      return [];
    }

    const hintTexts = hints.map((h, i) => `${i + 1}. "${h.text}"`).join('\n');

    const prompt = `あなたは「ジャストワン (Just One)」というワードゲームの審判です。
ヒント同士の重複をチェックしてください。

以下のヒントを判定してください:
${hintTexts}

## 重複の判定基準（該当するヒントは全て無効）
以下の場合、重複しているヒントは全て無効にする:
- 完全一致（大文字小文字・ひらがなカタカナ問わず）: 「猫」と「ねこ」と「ネコ」
- 同じ語族・派生語: 「王子」と「王女」、「俳優」と「女優」、「走る」と「走り」
- 同義語: 「車」と「自動車」、「医者」と「医師」
- 翻訳: 「犬」と「dog」

## 注意
- 関連語でも重複でなければ有効（例:「暑い」と「夏」は両方有効）
- 2つ被れば2つとも無効、3つ被れば3つとも無効
- 重複していないヒントは有効

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
        model: this.model,
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

  async judgeAnswer(topic: string, answer: string): Promise<{ isCorrect: boolean; reason?: string }> {
    const prompt = `ジャストワン（Just One）の回答を判定してください。

お題: 「${topic}」
回答: 「${answer}」

## 正解の条件
以下の場合は全て正解とする:
- 完全一致
- ひらがな/カタカナ/漢字の表記違い（例: 「財布」=「さいふ」=「サイフ」）
- 送り仮名の違い（例: 「走る」=「はしる」）
- 長音の有無（例: 「コーヒー」=「コーヒ」）
- 小さな表記ゆれ（例: 「りんご」=「リンゴ」=「林檎」）

## 不正解の条件
- 明らかに別の単語
- 意味が異なる

JSON形式で回答:
{"correct": true/false, "reason": "理由"}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: '回答判定者。JSON形式で回答。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
        max_tokens: 100,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        // フォールバック: シンプルな比較
        const normalizedAnswer = answer.trim().toLowerCase();
        const normalizedTopic = topic.trim().toLowerCase();
        return { isCorrect: normalizedAnswer === normalizedTopic };
      }

      const parsed = JSON.parse(content) as { correct: boolean; reason?: string };
      return {
        isCorrect: parsed.correct,
        reason: parsed.reason,
      };
    } catch (error) {
      this.logger.error('Failed to judge answer with OpenAI', error);
      // フォールバック: シンプルな比較
      const normalizedAnswer = answer.trim().toLowerCase();
      const normalizedTopic = topic.trim().toLowerCase();
      return { isCorrect: normalizedAnswer === normalizedTopic };
    }
  }
}
