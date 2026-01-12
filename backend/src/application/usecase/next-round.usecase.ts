import { Inject, Injectable } from '@nestjs/common';
import {
  IGameRepository,
  GAME_REPOSITORY,
} from '../../domain/repository/i-game.repository';
import {
  OneHintGame,
  resetGameForNextRound,
} from '../../domain/model/games/one-hint/one-hint.game';
import { getHost, Room } from '../../domain/model/room';
import { NextRoundDto } from '../dto/game-action.dto';

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

export class NotHostError extends Error {
  constructor() {
    super('Only the host can start next round');
    this.name = 'NotHostError';
  }
}

export class InvalidPhaseError extends Error {
  constructor() {
    super('Can only start next round from result phase');
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
export class NextRoundUseCase {
  constructor(
    @Inject(GAME_REPOSITORY)
    private readonly gameRepository: IGameRepository,
  ) {}

  async execute(dto: NextRoundDto): Promise<Room> {
    const room = await this.gameRepository.findRoomById(dto.roomId);

    if (!room) {
      throw new RoomNotFoundError(dto.roomId);
    }

    if (!room.game) {
      throw new GameNotStartedError();
    }

    const host = getHost(room);
    if (!host || host.id !== dto.playerId) {
      throw new NotHostError();
    }

    if (room.game.type !== 'one-hint') {
      throw new InvalidGameTypeError(room.game.type);
    }

    const game = room.game as OneHintGame;

    if (game.phase !== 'RESULT') {
      throw new InvalidPhaseError();
    }

    const connectedPlayers = room.players.filter((p) => p.isConnected);
    const currentAnswererIndex = connectedPlayers.findIndex(
      (p) => p.id === game.answererId,
    );
    const nextAnswererIndex =
      (currentAnswererIndex + 1) % connectedPlayers.length;
    const nextAnswerer = connectedPlayers[nextAnswererIndex];

    const updatedGame = resetGameForNextRound(game, nextAnswerer.id);

    const updatedRoom: Room = {
      ...room,
      game: updatedGame,
    };

    await this.gameRepository.saveRoom(updatedRoom);

    return updatedRoom;
  }
}
