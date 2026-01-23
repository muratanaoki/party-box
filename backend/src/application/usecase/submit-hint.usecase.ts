import { Inject, Injectable } from "@nestjs/common";
import {
  IGameRepository,
  GAME_REPOSITORY,
} from "../../domain/repository/i-game.repository";
import {
  IHintJudgeService,
  HINT_JUDGE_SERVICE,
} from "../../domain/service/i-hint-judge.service";
import {
  submitHint,
  allHintsSubmitted,
  setHintValidity,
  transitionToGuessing,
} from "../../domain/model/games/just-one/just-one.game";
import { Room } from "../../domain/model/room";
import { SubmitHintDto } from "../dto/game-action.dto";
import {
  HintContainsTopicError,
  HintNotSingleWordError,
} from "../error/game.errors";
import {
  getJustOneGame,
  validatePhase,
} from "./helpers/game-validation.helper";

@Injectable()
export class SubmitHintUseCase {
  constructor(
    @Inject(GAME_REPOSITORY)
    private readonly gameRepository: IGameRepository,
    @Inject(HINT_JUDGE_SERVICE)
    private readonly hintJudgeService: IHintJudgeService
  ) {}

  async execute(dto: SubmitHintDto): Promise<Room> {
    const { room, game } = await getJustOneGame(this.gameRepository, dto.roomId);
    validatePhase(game, "HINTING");

    const player = room.players.find((p) => p.id === dto.playerId);
    if (!player) {
      throw new Error("Player not found in room");
    }

    // 単語チェック（AIで判定）
    const formatValidation = await this.hintJudgeService.validateHintFormat(dto.hint);
    if (!formatValidation.isValid) {
      throw new HintNotSingleWordError();
    }

    // お題そのものを含むヒントはNG（AIでチェック）
    const topicValidation =
      await this.hintJudgeService.validateHintAgainstTopic(
        game.topic,
        dto.hint
      );
    if (!topicValidation.isValid) {
      throw new HintContainsTopicError(topicValidation.error);
    }

    let updatedGame = submitHint(game, dto.playerId, player.name, dto.hint);

    const connectedNonAnswerers = room.players.filter(
      (p) => p.isConnected && p.id !== updatedGame.answererId
    );

    if (allHintsSubmitted(updatedGame, connectedNonAnswerers.length + 1)) {
      const judgments = await this.hintJudgeService.judgeHints(
        updatedGame.topic,
        updatedGame.hints
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
