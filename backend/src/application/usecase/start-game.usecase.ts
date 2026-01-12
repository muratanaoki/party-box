import { Inject, Injectable } from '@nestjs/common';
import {
  IGameRepository,
  GAME_REPOSITORY,
} from '../../domain/repository/i-game.repository';
import { createGame } from '../../domain/model/game';
import { getHost, Room } from '../../domain/model/room';
import { StartGameDto } from '../dto/game-action.dto';

export class NotHostError extends Error {
  constructor() {
    super('Only the host can start the game');
    this.name = 'NotHostError';
  }
}

export class NotEnoughPlayersError extends Error {
  constructor() {
    super('Need at least 3 players to start the game');
    this.name = 'NotEnoughPlayersError';
  }
}

export class RoomNotFoundError extends Error {
  constructor(roomId: string) {
    super(`Room ${roomId} not found`);
    this.name = 'RoomNotFoundError';
  }
}

@Injectable()
export class StartGameUseCase {
  constructor(
    @Inject(GAME_REPOSITORY)
    private readonly gameRepository: IGameRepository,
  ) {}

  async execute(dto: StartGameDto): Promise<Room> {
    const room = await this.gameRepository.findRoomById(dto.roomId);

    if (!room) {
      throw new RoomNotFoundError(dto.roomId);
    }

    const host = getHost(room);
    if (!host || host.id !== dto.playerId) {
      throw new NotHostError();
    }

    if (room.players.length < 3) {
      throw new NotEnoughPlayersError();
    }

    const connectedPlayers = room.players.filter((p) => p.isConnected);
    const randomIndex = Math.floor(Math.random() * connectedPlayers.length);
    const answerer = connectedPlayers[randomIndex];

    const game = createGame(answerer.id);

    const updatedRoom: Room = {
      ...room,
      game,
    };

    await this.gameRepository.saveRoom(updatedRoom);

    return updatedRoom;
  }
}
