import { GameBase } from '../../game-base';

export type JustOnePhase = 'HINTING' | 'GUESSING' | 'RESULT' | 'FINISHED';

export interface Hint {
  playerId: string;
  playerName: string;
  text: string;
  isValid: boolean;
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

export function submitAnswer(game: JustOneGame, answer: string): JustOneGame {
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
  };
}

export function finishGame(game: JustOneGame): JustOneGame {
  return {
    ...game,
    phase: 'FINISHED',
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
