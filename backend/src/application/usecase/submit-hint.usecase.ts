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
  submitHint,
  allHintsSubmitted,
  setHintValidity,
  transitionToGuessing,
} from '../../domain/model/games/one-hint/one-hint.game';
import { Room } from '../../domain/model/room';
import { SubmitHintDto } from '../dto/game-action.dto';

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

export class InvalidPhaseError extends Error {
  constructor() {
    super('Cannot submit hint in current phase');
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
export class SubmitHintUseCase {
  constructor(
    @Inject(GAME_REPOSITORY)
    private readonly gameRepository: IGameRepository,
    @Inject(HINT_JUDGE_SERVICE)
    private readonly hintJudgeService: IHintJudgeService,
  ) {}

  async execute(dto: SubmitHintDto): Promise<Room> {
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

    if (game.phase !== 'HINTING') {
      throw new InvalidPhaseError();
    }

    const player = room.players.find((p) => p.id === dto.playerId);
    if (!player) {
      throw new Error('Player not found in room');
    }

    let updatedGame = submitHint(game, dto.playerId, player.name, dto.hint);

    const connectedNonAnswerers = room.players.filter(
      (p) => p.isConnected && p.id !== updatedGame.answererId,
    );

    if (allHintsSubmitted(updatedGame, connectedNonAnswerers.length + 1)) {
      const judgments = await this.hintJudgeService.judgeHints(
        updatedGame.topic,
        updatedGame.hints,
      );

      const validityMap = new Map<string, boolean>();
      for (const judgment of judgments) {
        validityMap.set(judgment.playerId, judgment.isValid);
      }

      updatedGame = setHintValidity(updatedGame, validityMap);
      updatedGame = transitionToGuessing(updatedGame);
    }

    const updatedRoom: Room = {
      ...room,
      game: updatedGame,
    };

    await this.gameRepository.saveRoom(updatedRoom);

    return updatedRoom;
  }
}
