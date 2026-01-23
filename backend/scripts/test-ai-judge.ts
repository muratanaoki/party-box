/**
 * AI判定テストスクリプト
 * 実行: OPENAI_API_KEY=xxx npx ts-node scripts/test-ai-judge.ts
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = "gpt-4.1-mini";

// ========== テストケース定義 ==========

interface HintValidationTestCase {
  topic: string;
  hint: string;
  expectedValid: boolean;
  reason: string;
}

interface HintDuplicateTestCase {
  hints: string[];
  expectedResults: boolean[]; // 各ヒントが有効かどうか
  reason: string;
}

// ヒント有効判定テストケース
const hintValidationTests: HintValidationTestCase[] = [
  // 無効なケース - お題と同じ/表記違い
  { topic: "猫", hint: "ねこ", expectedValid: false, reason: "お題の表記違い" },
  { topic: "猫", hint: "ネコ", expectedValid: false, reason: "お題の表記違い" },
  { topic: "りんご", hint: "リンゴ", expectedValid: false, reason: "お題の表記違い" },
  { topic: "林檎", hint: "りんご", expectedValid: false, reason: "お題の表記違い" },

  // 無効なケース - お題を含む
  { topic: "山", hint: "富士山", expectedValid: false, reason: "お題を含む" },
  { topic: "電車", hint: "電車賃", expectedValid: false, reason: "お題を含む" },
  { topic: "海", hint: "海水", expectedValid: false, reason: "お題を含む" },
  { topic: "犬", hint: "犬小屋", expectedValid: false, reason: "お題を含む" },

  // 無効なケース - お題の一部
  { topic: "りんご", hint: "りん", expectedValid: false, reason: "お題の一部" },
  { topic: "携帯電話", hint: "携帯", expectedValid: false, reason: "お題の一部" },
  { topic: "携帯電話", hint: "電話", expectedValid: false, reason: "お題の一部" },

  // 無効なケース - 直接翻訳（英語）
  { topic: "犬", hint: "dog", expectedValid: false, reason: "直接翻訳" },
  { topic: "猫", hint: "cat", expectedValid: false, reason: "直接翻訳" },
  { topic: "海", hint: "sea", expectedValid: false, reason: "直接翻訳" },
  { topic: "海", hint: "ocean", expectedValid: false, reason: "直接翻訳" },
  { topic: "家", hint: "house", expectedValid: false, reason: "直接翻訳" },
  { topic: "車", hint: "car", expectedValid: false, reason: "直接翻訳" },

  // 無効なケース - 直接翻訳（カタカナ）
  { topic: "霧", hint: "ミスト", expectedValid: false, reason: "直接翻訳（カタカナ）" },
  { topic: "海", hint: "シー", expectedValid: false, reason: "直接翻訳（カタカナ）" },
  { topic: "犬", hint: "ドッグ", expectedValid: false, reason: "直接翻訳（カタカナ）" },

  // 有効なケース - 連想語（これが重要！）
  { topic: "屋根", hint: "ホーム", expectedValid: true, reason: "連想語（直接翻訳ではない）" },
  { topic: "屋根", hint: "家", expectedValid: true, reason: "連想語" },
  { topic: "屋根", hint: "瓦", expectedValid: true, reason: "連想語" },
  { topic: "海", hint: "波", expectedValid: true, reason: "連想語" },
  { topic: "海", hint: "砂浜", expectedValid: true, reason: "連想語" },
  { topic: "海", hint: "夏", expectedValid: true, reason: "連想語" },
  { topic: "海", hint: "青", expectedValid: true, reason: "連想語" },
  { topic: "犬", hint: "ペット", expectedValid: true, reason: "連想語" },
  { topic: "犬", hint: "散歩", expectedValid: true, reason: "連想語" },
  { topic: "犬", hint: "吠える", expectedValid: true, reason: "連想語（動作）" },
  { topic: "猫", hint: "ひげ", expectedValid: true, reason: "連想語（特徴）" },
  { topic: "りんご", hint: "赤い", expectedValid: true, reason: "連想語" },
  { topic: "りんご", hint: "果物", expectedValid: true, reason: "連想語" },
  { topic: "りんご", hint: "アップル", expectedValid: false, reason: "直接翻訳（apple）" },
  { topic: "電車", hint: "線路", expectedValid: true, reason: "連想語" },
  { topic: "電車", hint: "駅", expectedValid: true, reason: "連想語" },

  // エッジケース
  { topic: "家", hint: "ホーム", expectedValid: false, reason: "直接翻訳（home=家）" },
  { topic: "車", hint: "カー", expectedValid: false, reason: "直接翻訳（car）" },
  { topic: "ピカチュウ", hint: "ポケモン", expectedValid: true, reason: "上位カテゴリ" },
  { topic: "東京タワー", hint: "タワー", expectedValid: false, reason: "お題の一部" },
  { topic: "東京タワー", hint: "赤い", expectedValid: true, reason: "連想語" },
  { topic: "サンタクロース", hint: "クリスマス", expectedValid: true, reason: "連想語" },
  { topic: "サンタクロース", hint: "サンタ", expectedValid: false, reason: "お題の一部" },
];

// ヒント重複判定テストケース
const hintDuplicateTests: HintDuplicateTestCase[] = [
  // 重複するケース（両方無効）
  { hints: ["猫", "ねこ"], expectedResults: [false, false], reason: "同じ単語の表記違い" },
  { hints: ["車", "自動車"], expectedResults: [false, false], reason: "同義語" },
  { hints: ["犬", "dog"], expectedResults: [false, false], reason: "翻訳" },
  { hints: ["赤い", "赤"], expectedResults: [false, false], reason: "同じ意味" },
  { hints: ["大きい", "でかい"], expectedResults: [false, false], reason: "同義語" },

  // 重複しないケース（両方有効）
  { hints: ["王子", "王女"], expectedResults: [true, true], reason: "派生語だが別の意味" },
  { hints: ["暑い", "夏"], expectedResults: [true, true], reason: "関連語だが別の意味" },
  { hints: ["赤い", "丸い"], expectedResults: [true, true], reason: "別の形容詞" },
  { hints: ["走る", "速い"], expectedResults: [true, true], reason: "関連語" },
  { hints: ["海", "波"], expectedResults: [true, true], reason: "関連語" },

  // 3つ以上のケース
  { hints: ["猫", "ねこ", "ペット"], expectedResults: [false, false, true], reason: "2つは重複、1つは有効" },
  { hints: ["赤い", "丸い", "果物"], expectedResults: [true, true, true], reason: "全て異なる" },
];

// ========== 現在のプロンプト ==========

async function validateHintAgainstTopic(topic: string, hint: string): Promise<{ valid: boolean; error?: string }> {
  // === コードチェック（AI不要）===

  // 1. 完全一致
  if (hint === topic) {
    return { valid: false, error: "お題と同じです" };
  }

  // 2. ヒントがお題を含む（山→富士山✗）
  if (hint.includes(topic)) {
    return { valid: false, error: "お題の文字を含んでいます" };
  }

  // 3. お題がヒントを含む（携帯電話→携帯✗、りんご→りん✗）
  if (topic.includes(hint) && hint.length >= 2) {
    return { valid: false, error: "お題の一部です" };
  }

  // === AIチェック（意味的判定のみ）===
  const prompt = `お題「${topic}」とヒント「${hint}」は翻訳または表記違い？

【無効＝翻訳・表記違い】
- 表記違い: 猫=ねこ=ネコ、林檎=りんご
- 翻訳: 犬=dog=ドッグ、海=sea=シー、霧=mist=ミスト、家=home=ホーム、車=car=カー、りんご=apple=アップル

【有効＝翻訳ではない】
- 連想語・関連語は有効: 海→波、犬→ペット、りんご→果物、屋根→家、屋根→ホーム
- 上位/下位カテゴリは有効: ピカチュウ→ポケモン、犬→動物

質問: ヒント「${hint}」はお題「${topic}」の翻訳または表記違いか？
{"valid":true/false,"error":"理由"}`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "JSON出力のみ" },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 100,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return { valid: true };

  const parsed = JSON.parse(content) as { valid: boolean; error?: string };
  return parsed;
}

async function judgeHints(hints: string[]): Promise<{ index: number; valid: boolean; reason?: string }[]> {
  const hintTexts = hints.map((h, i) => `${i + 1}. "${h}"`).join("\n");

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

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "JSON出力のみ" },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 200,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return hints.map((_, i) => ({ index: i + 1, valid: true }));

  const parsed = JSON.parse(content) as { results: Array<{ index: number; valid: boolean; reason?: string }> };
  return parsed.results;
}

// ========== テスト実行 ==========

async function runHintValidationTests() {
  console.log("\n========== ヒント有効判定テスト ==========\n");

  let passed = 0;
  let failed = 0;
  const failures: { test: HintValidationTestCase; actual: boolean; error?: string }[] = [];

  for (const test of hintValidationTests) {
    try {
      const result = await validateHintAgainstTopic(test.topic, test.hint);
      const actualValid = result.valid;

      if (actualValid === test.expectedValid) {
        console.log(`✓ [${test.topic}] → "${test.hint}" = ${actualValid ? "有効" : "無効"} (${test.reason})`);
        passed++;
      } else {
        console.log(`✗ [${test.topic}] → "${test.hint}" = ${actualValid ? "有効" : "無効"} (期待: ${test.expectedValid ? "有効" : "無効"}) - ${test.reason}`);
        if (result.error) console.log(`  AIの理由: ${result.error}`);
        failed++;
        failures.push({ test, actual: actualValid, error: result.error });
      }
    } catch (error) {
      console.log(`✗ [${test.topic}] → "${test.hint}" - エラー: ${error}`);
      failed++;
    }

    // API制限回避
    await sleep(100);
  }

  console.log(`\n結果: ${passed}/${passed + failed} パス (${Math.round(passed / (passed + failed) * 100)}%)`);

  if (failures.length > 0) {
    console.log("\n--- 失敗したテスト ---");
    for (const f of failures) {
      console.log(`  [${f.test.topic}] → "${f.test.hint}": 期待=${f.test.expectedValid}, 実際=${f.actual}`);
      console.log(`    理由: ${f.test.reason}`);
      if (f.error) console.log(`    AI: ${f.error}`);
    }
  }

  return { passed, failed, failures };
}

async function runHintDuplicateTests() {
  console.log("\n========== ヒント重複判定テスト ==========\n");

  let passed = 0;
  let failed = 0;
  const failures: { test: HintDuplicateTestCase; actual: boolean[] }[] = [];

  for (const test of hintDuplicateTests) {
    try {
      const results = await judgeHints(test.hints);
      const actualResults = test.hints.map((_, i) => {
        const r = results.find(r => r.index === i + 1);
        return r?.valid ?? true;
      });

      const allMatch = actualResults.every((v, i) => v === test.expectedResults[i]);

      if (allMatch) {
        console.log(`✓ [${test.hints.join(", ")}] = [${actualResults.map(v => v ? "有効" : "無効").join(", ")}] (${test.reason})`);
        passed++;
      } else {
        console.log(`✗ [${test.hints.join(", ")}]`);
        console.log(`  期待: [${test.expectedResults.map(v => v ? "有効" : "無効").join(", ")}]`);
        console.log(`  実際: [${actualResults.map(v => v ? "有効" : "無効").join(", ")}]`);
        console.log(`  理由: ${test.reason}`);
        failed++;
        failures.push({ test, actual: actualResults });
      }
    } catch (error) {
      console.log(`✗ [${test.hints.join(", ")}] - エラー: ${error}`);
      failed++;
    }

    await sleep(100);
  }

  console.log(`\n結果: ${passed}/${passed + failed} パス (${Math.round(passed / (passed + failed) * 100)}%)`);

  return { passed, failed, failures };
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("AI判定テスト開始...\n");
  console.log(`モデル: ${MODEL}`);

  const validationResult = await runHintValidationTests();
  const duplicateResult = await runHintDuplicateTests();

  console.log("\n========== 総合結果 ==========");
  const totalPassed = validationResult.passed + duplicateResult.passed;
  const totalFailed = validationResult.failed + duplicateResult.failed;
  console.log(`全体: ${totalPassed}/${totalPassed + totalFailed} パス (${Math.round(totalPassed / (totalPassed + totalFailed) * 100)}%)`);
  console.log(`  ヒント有効判定: ${validationResult.passed}/${validationResult.passed + validationResult.failed}`);
  console.log(`  ヒント重複判定: ${duplicateResult.passed}/${duplicateResult.passed + duplicateResult.failed}`);
}

main().catch(console.error);
