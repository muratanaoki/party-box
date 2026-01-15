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
  JustOneGame,
  resetGameForNextRound,
  finishGame,
  isLastRound,
} from "../../domain/model/games/just-one/just-one.game";
import { getHost, Room } from "../../domain/model/room";
import { NextRoundDto } from "../dto/game-action.dto";
import {
  RoomNotFoundError,
  GameNotStartedError,
  NotHostError,
  InvalidPhaseError,
  InvalidGameTypeError,
} from "../error/game.errors";

@Injectable()
export class NextRoundUseCase {
  constructor(
    @Inject(GAME_REPOSITORY)
    private readonly gameRepository: IGameRepository,
    @Inject(HINT_JUDGE_SERVICE)
    private readonly hintJudgeService: IHintJudgeService
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

    if (room.game.type !== "just-one") {
      throw new InvalidGameTypeError(room.game.type);
    }

    const game = room.game as JustOneGame;

    if (game.phase !== "RESULT") {
      throw new InvalidPhaseError();
    }

    // 最終ラウンドならゲーム終了
    if (isLastRound(game)) {
      const finishedGame = finishGame(game);
      const updatedRoom: Room = {
        ...room,
        game: finishedGame,
      };
      await this.gameRepository.saveRoom(updatedRoom);
      return updatedRoom;
    }

    const connectedPlayers = room.players.filter((p) => p.isConnected);
    const currentAnswererIndex = connectedPlayers.findIndex(
      (p) => p.id === game.answererId
    );
    const nextAnswererIndex =
      (currentAnswererIndex + 1) % connectedPlayers.length;
    const nextAnswerer = connectedPlayers[nextAnswererIndex];

    // AIで新しいお題を生成（過去のお題を除外）
    const newTopic = await this.hintJudgeService.generateTopic(game.usedTopics);
    const updatedGame = resetGameForNextRound(game, nextAnswerer.id, newTopic);

    const updatedRoom: Room = {
      ...room,
      game: updatedGame,
    };

    await this.gameRepository.saveRoom(updatedRoom);

    return updatedRoom;
  }
}
