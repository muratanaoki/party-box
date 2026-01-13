import { Inject, Injectable } from '@nestjs/common';
import {
  IGameRepository,
  GAME_REPOSITORY,
} from '../../domain/repository/i-game.repository';
import {
  IHintJudgeService,
  HINT_JUDGE_SERVICE,
} from '../../domain/service/i-hint-judge.service';
import { GameType, GAME_CONFIGS } from '../../domain/model/game-base';
import { createOneHintGame } from '../../domain/model/games/one-hint/one-hint.game';
import { getHost, Room } from '../../domain/model/room';
import { StartGameDto } from '../dto/game-action.dto';

export class NotHostError extends Error {
  constructor() {
    super('Only the host can start the game');
    this.name = 'NotHostError';
  }
}

export class NotEnoughPlayersError extends Error {
  constructor(minPlayers: number) {
    super(`Need at least ${minPlayers} players to start the game`);
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
    @Inject(HINT_JUDGE_SERVICE)
    private readonly hintJudgeService: IHintJudgeService,
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

    const config = GAME_CONFIGS[room.gameType];
    if (room.players.length < config.minPlayers) {
      throw new NotEnoughPlayersError(config.minPlayers);
    }

    const connectedPlayers = room.players.filter((p) => p.isConnected);
    const randomIndex = Math.floor(Math.random() * connectedPlayers.length);
    const answerer = connectedPlayers[randomIndex];

    const game = await this.createGameByType(room.gameType, answerer.id);

    const updatedRoom: Room = {
      ...room,
      game,
    };

    await this.gameRepository.saveRoom(updatedRoom);

    return updatedRoom;
  }

  private async createGameByType(gameType: GameType, answererId: string) {
    switch (gameType) {
      case 'one-hint':
        const topic = await this.hintJudgeService.generateTopic();
        return createOneHintGame(answererId, topic);
      default:
        throw new Error(`Unknown game type: ${gameType}`);
    }
  }
}
