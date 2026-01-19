import { GameBase } from '../../game-base';

export type JustOnePhase = 'HINTING' | 'GUESSING' | 'RESULT' | 'FINISHED';

export interface Hint {
  playerId: string;
  playerName: string;
  text: string;
  isValid: boolean;
}

export interface RoundResult {
  round: number;
  topic: string;
  answererId: string;
  answererName: string;
  answer: string;
  isCorrect: boolean;
}

export interface JustOneGame extends GameBase {
  type: 'just-one';
  phase: JustOnePhase;
  topic: string;
  answererId: string;
  hints: Hint[];
  answer: string | null;
  isCorrect: boolean | null;
  totalRounds: number;
  usedTopics: string[]; // 過去に出たお題
  roundResults: RoundResult[]; // 各ラウンドの結果
}

export function createJustOneGame(answererId: string, topic: string, totalRounds: number = 5): JustOneGame {
  return {
    type: 'just-one',
    phase: 'HINTING',
    topic,
    answererId,
    hints: [],
    answer: null,
    isCorrect: null,
    round: 1,
    totalRounds,
    usedTopics: [topic],
    roundResults: [],
  };
}

export function submitHint(
  game: JustOneGame,
  playerId: string,
  playerName: string,
  text: string,
): JustOneGame {
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
  game: JustOneGame,
  validityMap: Map<string, boolean>,
): JustOneGame {
  return {
    ...game,
    hints: game.hints.map((hint) => ({
      ...hint,
      isValid: validityMap.get(hint.playerId) ?? hint.isValid,
    })),
  };
}

export function transitionToGuessing(game: JustOneGame): JustOneGame {
  if (game.phase !== 'HINTING') {
    return game;
  }
  return {
    ...game,
    phase: 'GUESSING',
  };
}

export function submitAnswer(game: JustOneGame, answer: string, answererName: string): JustOneGame {
  if (game.phase !== 'GUESSING') {
    return game;
  }

  const normalizedAnswer = answer.trim().toLowerCase();
  const normalizedTopic = game.topic.trim().toLowerCase();
  const isCorrect = normalizedAnswer === normalizedTopic;

  const roundResult: RoundResult = {
    round: game.round,
    topic: game.topic,
    answererId: game.answererId,
    answererName,
    answer,
    isCorrect,
  };

  return {
    ...game,
    phase: 'RESULT',
    answer,
    isCorrect,
    roundResults: [...game.roundResults, roundResult],
  };
}

export function resetGameForNextRound(
  game: JustOneGame,
  newAnswererId: string,
  newTopic: string,
): JustOneGame {
  return {
    type: 'just-one',
    phase: 'HINTING',
    topic: newTopic,
    answererId: newAnswererId,
    hints: [],
    answer: null,
    isCorrect: null,
    round: game.round + 1,
    totalRounds: game.totalRounds,
    usedTopics: [...game.usedTopics, newTopic],
    roundResults: game.roundResults,
  };
}

export function finishGame(game: JustOneGame): JustOneGame {
  return {
    ...game,
    phase: 'FINISHED',
  };
}

export function regenerateTopic(game: JustOneGame, newTopic: string): JustOneGame {
  if (game.phase !== 'HINTING') {
    return game;
  }
  return {
    ...game,
    topic: newTopic,
    hints: [], // ヒントもリセット
    usedTopics: [...game.usedTopics, newTopic],
  };
}

export function isLastRound(game: JustOneGame): boolean {
  return game.round >= game.totalRounds;
}

export function allHintsSubmitted(
  game: JustOneGame,
  totalPlayers: number,
): boolean {
  const expectedHints = totalPlayers - 1;
  return game.hints.length >= expectedHints;
}

// 型ガード関数
export function isJustOneGame(game: GameBase): game is JustOneGame {
  return game.type === 'just-one';
}
