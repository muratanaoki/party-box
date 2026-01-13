import { GameBase } from '../../game-base';

export type OneHintPhase = 'HINTING' | 'GUESSING' | 'RESULT';

export interface Hint {
  playerId: string;
  playerName: string;
  text: string;
  isValid: boolean;
}

export interface OneHintGame extends GameBase {
  type: 'one-hint';
  phase: OneHintPhase;
  topic: string;
  answererId: string;
  hints: Hint[];
  answer: string | null;
  isCorrect: boolean | null;
}

export function createOneHintGame(answererId: string, topic: string): OneHintGame {
  return {
    type: 'one-hint',
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
  newTopic: string,
): OneHintGame {
  return {
    type: 'one-hint',
    phase: 'HINTING',
    topic: newTopic,
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
