import { Room, getHost } from "../../../domain/model/room";
import { JustOneGame } from "../../../domain/model/games/just-one/just-one.game";
import {
  RoomNotFoundError,
  GameNotStartedError,
  InvalidGameTypeError,
  NotHostError,
  InvalidPhaseError,
} from "../../error/game.errors";
import { IGameRepository } from "../../../domain/repository/i-game.repository";

export interface RoomWithGame extends Room {
  game: NonNullable<Room["game"]>;
}

export interface RoomWithJustOneGame extends Room {
  game: JustOneGame;
}

/**
 * Room取得 + Game存在チェック
 */
export async function getRoomWithGame(
  repository: IGameRepository,
  roomId: string
): Promise<RoomWithGame> {
  const room = await repository.findRoomById(roomId);

  if (!room) {
    throw new RoomNotFoundError(roomId);
  }

  if (!room.game) {
    throw new GameNotStartedError();
  }

  return room as RoomWithGame;
}

/**
 * JustOneGame取得 + 型チェック
 */
export async function getJustOneGame(
  repository: IGameRepository,
  roomId: string
): Promise<{ room: RoomWithJustOneGame; game: JustOneGame }> {
  const room = await getRoomWithGame(repository, roomId);

  if (room.game.type !== "just-one") {
    throw new InvalidGameTypeError(room.game.type);
  }

  return {
    room: room as RoomWithJustOneGame,
    game: room.game as JustOneGame,
  };
}

/**
 * ホスト権限チェック
 */
export function validateHost(room: Room, playerId: string): void {
  const host = getHost(room);
  if (!host || host.id !== playerId) {
    throw new NotHostError();
  }
}

/**
 * フェーズチェック
 */
export function validatePhase(
  game: JustOneGame,
  expectedPhase: JustOneGame["phase"]
): void {
  if (game.phase !== expectedPhase) {
    throw new InvalidPhaseError();
  }
}
