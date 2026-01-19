import { Inject, Injectable } from "@nestjs/common";
import {
  IGameRepository,
  GAME_REPOSITORY,
} from "../../domain/repository/i-game.repository";
import {
  IHintJudgeService,
  HINT_JUDGE_SERVICE,
} from "../../domain/service/i-hint-judge.service";
import { JustOneGame, RoundResult } from "../../domain/model/games/just-one/just-one.game";
import { Room } from "../../domain/model/room";
import { SubmitAnswerDto } from "../dto/game-action.dto";
import {
  RoomNotFoundError,
  GameNotStartedError,
  InvalidPhaseError,
  InvalidGameTypeError,
  NotAnswererError,
} from "../error/game.errors";

@Injectable()
export class SubmitAnswerUseCase {
  constructor(
    @Inject(GAME_REPOSITORY)
    private readonly gameRepository: IGameRepository,
    @Inject(HINT_JUDGE_SERVICE)
    private readonly hintJudgeService: IHintJudgeService
  ) {}

  async execute(dto: SubmitAnswerDto): Promise<Room> {
    const room = await this.gameRepository.findRoomById(dto.roomId);

    if (!room) {
      throw new RoomNotFoundError(dto.roomId);
    }

    if (!room.game) {
      throw new GameNotStartedError();
    }

    if (room.game.type !== "just-one") {
      throw new InvalidGameTypeError(room.game.type);
    }

    const game = room.game as JustOneGame;

    if (game.phase !== "GUESSING") {
      throw new InvalidPhaseError();
    }

    if (game.answererId !== dto.playerId) {
      throw new NotAnswererError();
    }

    // AIで回答を判定（漢字/ひらがな/カタカナの表記ゆれを考慮）
    const judgment = await this.hintJudgeService.judgeAnswer(
      game.topic,
      dto.answer
    );

    // 回答者の名前を取得
    const answerer = room.players.find((p) => p.id === game.answererId);
    const answererName = answerer?.name ?? "???";

    // ラウンド結果を保存
    const roundResult: RoundResult = {
      round: game.round,
      topic: game.topic,
      answererId: game.answererId,
      answererName,
      answer: dto.answer,
      isCorrect: judgment.isCorrect,
    };

    const updatedGame: JustOneGame = {
      ...game,
      phase: "RESULT",
      answer: dto.answer,
      isCorrect: judgment.isCorrect,
      roundResults: [...(game.roundResults || []), roundResult],
    };

    const updatedRoom: Room = {
      ...room,
      game: updatedGame,
    };

    await this.gameRepository.saveRoom(updatedRoom);

    return updatedRoom;
  }
}
