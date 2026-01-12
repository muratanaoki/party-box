import { Inject, Injectable } from '@nestjs/common';
import {
  IGameRepository,
  GAME_REPOSITORY,
} from '../../domain/repository/i-game.repository';
import { submitAnswer } from '../../domain/model/game';
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

@Injectable()
export class SubmitAnswerUseCase {
  constructor(
    @Inject(GAME_REPOSITORY)
    private readonly gameRepository: IGameRepository,
  ) {}

  async execute(dto: SubmitAnswerDto): Promise<Room> {
    const room = await this.gameRepository.findRoomById(dto.roomId);

    if (!room) {
      throw new RoomNotFoundError(dto.roomId);
    }

    if (!room.game) {
      throw new GameNotStartedError();
    }

    if (room.game.phase !== 'GUESSING') {
      throw new InvalidPhaseError();
    }

    if (room.game.answererId !== dto.playerId) {
      throw new NotAnswererError();
    }

    const game = submitAnswer(room.game, dto.answer);

    const updatedRoom: Room = {
      ...room,
      game,
    };

    await this.gameRepository.saveRoom(updatedRoom);

    return updatedRoom;
  }
}
