import { Inject, Injectable } from '@nestjs/common';
import {
  IGameRepository,
  GAME_REPOSITORY,
} from '../../domain/repository/i-game.repository';
import {
  IHintJudgeService,
  HINT_JUDGE_SERVICE,
} from '../../domain/service/i-hint-judge.service';
import { regenerateTopic, JustOneGame } from '../../domain/model/games/just-one/just-one.game';
import { getHost, Room } from '../../domain/model/room';
import { RegenerateTopicDto } from '../dto/game-action.dto';
import { RoomNotFoundError, NotHostError, GameNotStartedError } from '../error/game.errors';

@Injectable()
export class RegenerateTopicUseCase {
  constructor(
    @Inject(GAME_REPOSITORY)
    private readonly gameRepository: IGameRepository,
    @Inject(HINT_JUDGE_SERVICE)
    private readonly hintJudgeService: IHintJudgeService,
  ) {}

  async execute(dto: RegenerateTopicDto): Promise<Room> {
    const room = await this.gameRepository.findRoomById(dto.roomId);

    if (!room) {
      throw new RoomNotFoundError(dto.roomId);
    }

    const host = getHost(room);
    if (!host || host.id !== dto.playerId) {
      throw new NotHostError();
    }

    if (!room.game) {
      throw new GameNotStartedError();
    }

    if (room.game.type !== 'just-one') {
      throw new Error('Unsupported game type');
    }

    const game = room.game as JustOneGame;
    const newTopic = await this.hintJudgeService.generateTopic(game.usedTopics);
    const updatedGame = regenerateTopic(game, newTopic);

    const updatedRoom: Room = {
      ...room,
      game: updatedGame,
    };

    await this.gameRepository.saveRoom(updatedRoom);

    return updatedRoom;
  }
}
