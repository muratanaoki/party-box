// 共通エラークラス

export class RoomNotFoundError extends Error {
  constructor(roomId: string) {
    super(`Room ${roomId} not found`);
    this.name = "RoomNotFoundError";
  }
}

export class GameNotStartedError extends Error {
  constructor() {
    super("Game has not started");
    this.name = "GameNotStartedError";
  }
}

export class InvalidPhaseError extends Error {
  constructor(message?: string) {
    super(message || "Cannot perform action in current phase");
    this.name = "InvalidPhaseError";
  }
}

export class InvalidGameTypeError extends Error {
  constructor(gameType: string) {
    super(`This action is not supported for game type: ${gameType}`);
    this.name = "InvalidGameTypeError";
  }
}

export class NotHostError extends Error {
  constructor() {
    super("Only the host can perform this action");
    this.name = "NotHostError";
  }
}

export class HintContainsTopicError extends Error {
  constructor(message?: string) {
    super(message || "ヒントにお題を含めることはできません");
    this.name = "HintContainsTopicError";
  }
}
