export type GamePhase = 'LOBBY' | 'HINTING' | 'GUESSING' | 'RESULT';

export interface Hint {
  playerId: string;
  playerName: string;
  text: string;
  isValid: boolean;
}

export interface OneHintGame {
  phase: GamePhase;
  topic: string;
  answererId: string;
  hints: Hint[];
  answer: string | null;
  isCorrect: boolean | null;
  round: number;
}

const WORD_LIST: string[] = [
  'りんご',
  'バナナ',
  '電車',
  '飛行機',
  '富士山',
  '桜',
  '寿司',
  'ラーメン',
  '猫',
  '犬',
  '太陽',
  '月',
  '海',
  '山',
  '学校',
  '病院',
  'コンビニ',
  '図書館',
  'サッカー',
  '野球',
  'ピアノ',
  'ギター',
  '雪',
  '雨',
  '虹',
  '星',
  '花火',
  'カレー',
  '自転車',
  'スマホ',
  'テレビ',
  '冷蔵庫',
  '傘',
  'メガネ',
  '時計',
  '財布',
  'カメラ',
  '本',
  'ペン',
  'コーヒー',
];

export function createGame(answererId: string): OneHintGame {
  const topic = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
  return {
    phase: 'HINTING',
    topic,
    answererId,
    hints: [],
    answer: null,
    isCorrect: null,
    round: 1,
  };
}

export function submitHint(
  game: OneHintGame,
  playerId: string,
  playerName: string,
  text: string,
): OneHintGame {
  if (game.phase !== 'HINTING') {
    return game;
  }
  if (playerId === game.answererId) {
    return game;
  }
  if (game.hints.some((h) => h.playerId === playerId)) {
    return game;
  }

  const hint: Hint = {
    playerId,
    playerName,
    text,
    isValid: true,
  };

  return {
    ...game,
    hints: [...game.hints, hint],
  };
}

export function setHintValidity(
  game: OneHintGame,
  validityMap: Map<string, boolean>,
): OneHintGame {
  return {
    ...game,
    hints: game.hints.map((hint) => ({
      ...hint,
      isValid: validityMap.get(hint.playerId) ?? hint.isValid,
    })),
  };
}

export function transitionToGuessing(game: OneHintGame): OneHintGame {
  if (game.phase !== 'HINTING') {
    return game;
  }
  return {
    ...game,
    phase: 'GUESSING',
  };
}

export function submitAnswer(game: OneHintGame, answer: string): OneHintGame {
  if (game.phase !== 'GUESSING') {
    return game;
  }

  const normalizedAnswer = answer.trim().toLowerCase();
  const normalizedTopic = game.topic.trim().toLowerCase();
  const isCorrect = normalizedAnswer === normalizedTopic;

  return {
    ...game,
    phase: 'RESULT',
    answer,
    isCorrect,
  };
}

export function resetGameForNextRound(
  game: OneHintGame,
  newAnswererId: string,
): OneHintGame {
  const topic = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
  return {
    phase: 'HINTING',
    topic,
    answererId: newAnswererId,
    hints: [],
    answer: null,
    isCorrect: null,
    round: game.round + 1,
  };
}

export function allHintsSubmitted(
  game: OneHintGame,
  totalPlayers: number,
): boolean {
  const expectedHints = totalPlayers - 1;
  return game.hints.length >= expectedHints;
}
