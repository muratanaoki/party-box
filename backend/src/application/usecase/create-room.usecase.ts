import { Inject, Injectable } from '@nestjs/common';
import {
  IGameRepository,
  GAME_REPOSITORY,
} from '../../domain/repository/i-game.repository';
import { createPlayer } from '../../domain/model/player';
import { createRoom, generateRoomId } from '../../domain/model/room';
import { CreateRoomDto } from '../dto/game-action.dto';
import { Room } from '../../domain/model/room';

@Injectable()
export class CreateRoomUseCase {
  constructor(
    @Inject(GAME_REPOSITORY)
    private readonly gameRepository: IGameRepository,
  ) {}

  async execute(dto: CreateRoomDto): Promise<Room> {
    let roomId: string;
    do {
      roomId = generateRoomId();
    } while (await this.gameRepository.roomExists(roomId));

    const host = createPlayer(dto.playerId, dto.playerName, true);
    const room = createRoom(roomId, host, dto.gameType ?? 'one-hint');

    await this.gameRepository.saveRoom(room);

    return room;
  }
}
