import { Module } from '@nestjs/common';
import { GAME_REPOSITORY } from '../../domain/repository/i-game.repository';
import { HINT_JUDGE_SERVICE } from '../../domain/service/i-hint-judge.service';
import { InMemoryGameRepository } from '../repository/in-memory-game.repository';
import { OpenAIHintJudgeService } from '../service/openai-hint-judge.service';
import { CreateRoomUseCase } from '../../application/usecase/create-room.usecase';
import { JoinRoomUseCase } from '../../application/usecase/join-room.usecase';
import { StartGameUseCase } from '../../application/usecase/start-game.usecase';
import { SubmitHintUseCase } from '../../application/usecase/submit-hint.usecase';
import { SubmitAnswerUseCase } from '../../application/usecase/submit-answer.usecase';
import { NextRoundUseCase } from '../../application/usecase/next-round.usecase';
import { RegenerateTopicUseCase } from '../../application/usecase/regenerate-topic.usecase';
import { GameGateway } from '../../presentation/gateway/game.gateway';

@Module({
  providers: [
    {
      provide: GAME_REPOSITORY,
      useClass: InMemoryGameRepository,
    },
    {
      provide: HINT_JUDGE_SERVICE,
      useClass: OpenAIHintJudgeService,
    },
    CreateRoomUseCase,
    JoinRoomUseCase,
    StartGameUseCase,
    SubmitHintUseCase,
    SubmitAnswerUseCase,
    NextRoundUseCase,
    RegenerateTopicUseCase,
    GameGateway,
  ],
  exports: [GAME_REPOSITORY, HINT_JUDGE_SERVICE],
})
export class GameModule {}
