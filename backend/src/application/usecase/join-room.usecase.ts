import { Inject, Injectable } from '@nestjs/common';
import {
  IGameRepository,
  GAME_REPOSITORY,
} from '../../domain/repository/i-game.repository';
import { createPlayer } from '../../domain/model/player';
import { addPlayerToRoom, updatePlayerConnection } from '../../domain/model/room';
import { JoinRoomDto } from '../dto/game-action.dto';
import { Room } from '../../domain/model/room';

export class RoomNotFoundError extends Error {
  constructor(roomId: string) {
    super(`Room ${roomId} not found`);
    this.name = 'RoomNotFoundError';
  }
}

@Injectable()
export class JoinRoomUseCase {
  constructor(
    @Inject(GAME_REPOSITORY)
    private readonly gameRepository: IGameRepository,
  ) {}

  async execute(dto: JoinRoomDto): Promise<Room> {
    const room = await this.gameRepository.findRoomById(dto.roomId);

    if (!room) {
      throw new RoomNotFoundError(dto.roomId);
    }

    const existingPlayer = room.players.find((p) => p.id === dto.playerId);

    let updatedRoom: Room;
    if (existingPlayer) {
      updatedRoom = updatePlayerConnection(room, dto.playerId, true);
    } else {
      const player = createPlayer(dto.playerId, dto.playerName, false);
      updatedRoom = addPlayerToRoom(room, player);
    }

    await this.gameRepository.saveRoom(updatedRoom);

    return updatedRoom;
  }
}
