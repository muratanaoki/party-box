import { Inject, Injectable } from '@nestjs/common';
import {
  IGameRepository,
  GAME_REPOSITORY,
} from '../../domain/repository/i-game.repository';
import {
  IHintJudgeService,
  HINT_JUDGE_SERVICE,
} from '../../domain/service/i-hint-judge.service';
import { regenerateTopic } from '../../domain/model/games/just-one/just-one.game';
import { Room } from '../../domain/model/room';
import { RegenerateTopicDto } from '../dto/game-action.dto';
import {
  getJustOneGame,
  validateHost,
} from './helpers/game-validation.helper';

@Injectable()
export class RegenerateTopicUseCase {
  constructor(
    @Inject(GAME_REPOSITORY)
    private readonly gameRepository: IGameRepository,
    @Inject(HINT_JUDGE_SERVICE)
    private readonly hintJudgeService: IHintJudgeService,
  ) {}

  async execute(dto: RegenerateTopicDto): Promise<Room> {
    const { room, game } = await getJustOneGame(this.gameRepository, dto.roomId);
    validateHost(room, dto.playerId);
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
