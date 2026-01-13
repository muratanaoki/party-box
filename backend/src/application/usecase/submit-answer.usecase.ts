import { Inject, Injectable } from '@nestjs/common';
import {
  IGameRepository,
  GAME_REPOSITORY,
} from '../../domain/repository/i-game.repository';
import {
  IHintJudgeService,
  HINT_JUDGE_SERVICE,
} from '../../domain/service/i-hint-judge.service';
import {
  OneHintGame,
} from '../../domain/model/games/one-hint/one-hint.game';
import { Room } from '../../domain/model/room';
import { SubmitAnswerDto } from '../dto/game-action.dto';

export class RoomNotFoundError extends Error {
  constructor(roomId: string) {
    super(`Room ${roomId} not found`);
    this.name = 'RoomNotFoundError';
  }
}

export class GameNotStartedError extends Error {
  constructor() {
    super('Game has not started');
    this.name = 'GameNotStartedError';
  }
}

export class NotAnswererError extends Error {
  constructor() {
    super('Only the answerer can submit an answer');
    this.name = 'NotAnswererError';
  }
}

export class InvalidPhaseError extends Error {
  constructor() {
    super('Cannot submit answer in current phase');
    this.name = 'InvalidPhaseError';
  }
}

export class InvalidGameTypeError extends Error {
  constructor(gameType: string) {
    super(`This action is not supported for game type: ${gameType}`);
    this.name = 'InvalidGameTypeError';
  }
}

@Injectable()
export class SubmitAnswerUseCase {
  constructor(
    @Inject(GAME_REPOSITORY)
    private readonly gameRepository: IGameRepository,
    @Inject(HINT_JUDGE_SERVICE)
    private readonly hintJudgeService: IHintJudgeService,
  ) {}

  async execute(dto: SubmitAnswerDto): Promise<Room> {
    const room = await this.gameRepository.findRoomById(dto.roomId);

    if (!room) {
      throw new RoomNotFoundError(dto.roomId);
    }

    if (!room.game) {
      throw new GameNotStartedError();
    }

    if (room.game.type !== 'one-hint') {
      throw new InvalidGameTypeError(room.game.type);
    }

    const game = room.game as OneHintGame;

    if (game.phase !== 'GUESSING') {
      throw new InvalidPhaseError();
    }

    if (game.answererId !== dto.playerId) {
      throw new NotAnswererError();
    }

    // AIで回答を判定（漢字/ひらがな/カタカナの表記ゆれを考慮）
    const judgment = await this.hintJudgeService.judgeAnswer(game.topic, dto.answer);

    const updatedGame: OneHintGame = {
      ...game,
      phase: 'RESULT',
      answer: dto.answer,
      isCorrect: judgment.isCorrect,
    };

    const updatedRoom: Room = {
      ...room,
      game: updatedGame,
    };

    await this.gameRepository.saveRoom(updatedRoom);

    return updatedRoom;
  }
}
