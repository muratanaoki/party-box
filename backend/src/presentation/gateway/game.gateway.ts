import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger, Inject } from "@nestjs/common";
import { CreateRoomUseCase } from "../../application/usecase/create-room.usecase";
import { JoinRoomUseCase } from "../../application/usecase/join-room.usecase";
import { StartGameUseCase } from "../../application/usecase/start-game.usecase";
import { SubmitHintUseCase } from "../../application/usecase/submit-hint.usecase";
import { SubmitAnswerUseCase } from "../../application/usecase/submit-answer.usecase";
import { NextRoundUseCase } from "../../application/usecase/next-round.usecase";
import { RegenerateTopicUseCase } from "../../application/usecase/regenerate-topic.usecase";
import {
  IGameRepository,
  GAME_REPOSITORY,
} from "../../domain/repository/i-game.repository";
import { updatePlayerConnection, Room } from "../../domain/model/room";
import { GameType } from "../../domain/model/game-base";
import { JustOneGame } from "../../domain/model/games/just-one/just-one.game";

interface ClientData {
  playerId: string;
  roomId: string | null;
}

interface PlayerForClient {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
}

interface HintForClient {
  playerId: string;
  playerName: string;
  text: string | null;
  isValid: boolean;
}

interface RoundResultForClient {
  round: number;
  topic: string;
  answererId: string;
  answererName: string;
  answer: string;
  isCorrect: boolean;
}

interface JustOneGameForClient {
  type: 'just-one';
  phase: string;
  round: number;
  totalRounds: number;
  answererId: string;
  topic: string | null;
  hints: HintForClient[];
  answer: string | null;
  isCorrect: boolean | null;
  roundResults: RoundResultForClient[];
}

interface RoomStateForClient {
  id: string;
  players: PlayerForClient[];
  gameType: GameType;
  game: JustOneGameForClient | null;
}

@WebSocketGateway({
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(GameGateway.name);
  private clientData: Map<string, ClientData> = new Map();

  constructor(
    private readonly createRoomUseCase: CreateRoomUseCase,
    private readonly joinRoomUseCase: JoinRoomUseCase,
    private readonly startGameUseCase: StartGameUseCase,
    private readonly submitHintUseCase: SubmitHintUseCase,
    private readonly submitAnswerUseCase: SubmitAnswerUseCase,
    private readonly nextRoundUseCase: NextRoundUseCase,
    private readonly regenerateTopicUseCase: RegenerateTopicUseCase,
    @Inject(GAME_REPOSITORY)
    private readonly gameRepository: IGameRepository
  ) {}

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket): Promise<void> {
    this.logger.log(`Client disconnected: ${client.id}`);

    const data = this.clientData.get(client.id);
    if (data?.roomId) {
      const room = await this.gameRepository.findRoomById(data.roomId);
      if (room) {
        const updatedRoom = updatePlayerConnection(room, data.playerId, false);
        await this.gameRepository.saveRoom(updatedRoom);
        this.broadcastRoomState(updatedRoom);
      }
    }

    this.clientData.delete(client.id);
  }

  @SubscribeMessage("create-room")
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { playerId: string; playerName: string; gameType?: GameType }
  ): Promise<void> {
    try {
      const room = await this.createRoomUseCase.execute({
        playerId: payload.playerId,
        playerName: payload.playerName,
        gameType: payload.gameType,
      });

      this.clientData.set(client.id, {
        playerId: payload.playerId,
        roomId: room.id,
      });

      await client.join(room.id);

      client.emit("room-created", { roomId: room.id });
      this.broadcastRoomState(room);
    } catch (error) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage("join-room")
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { roomId: string; playerId: string; playerName: string }
  ): Promise<void> {
    try {
      const room = await this.joinRoomUseCase.execute({
        roomId: payload.roomId.toUpperCase(),
        playerId: payload.playerId,
        playerName: payload.playerName,
      });

      this.clientData.set(client.id, {
        playerId: payload.playerId,
        roomId: room.id,
      });

      await client.join(room.id);

      client.emit("room-joined", { roomId: room.id });
      this.broadcastRoomState(room);
    } catch (error) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage("start-game")
  async handleStartGame(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { roomId: string; playerId: string; totalRounds?: number; excludeTopics?: string[] }
  ): Promise<void> {
    try {
      const room = await this.startGameUseCase.execute({
        roomId: payload.roomId,
        playerId: payload.playerId,
        totalRounds: payload.totalRounds,
        excludeTopics: payload.excludeTopics,
      });

      this.broadcastRoomState(room);
    } catch (error) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage("submit-hint")
  async handleSubmitHint(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; playerId: string; hint: string }
  ): Promise<void> {
    try {
      const room = await this.submitHintUseCase.execute({
        roomId: payload.roomId,
        playerId: payload.playerId,
        hint: payload.hint,
      });

      this.broadcastRoomState(room);
    } catch (error) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage("submit-answer")
  async handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { roomId: string; playerId: string; answer: string }
  ): Promise<void> {
    try {
      const room = await this.submitAnswerUseCase.execute({
        roomId: payload.roomId,
        playerId: payload.playerId,
        answer: payload.answer,
      });

      this.broadcastRoomState(room);
    } catch (error) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage("next-round")
  async handleNextRound(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; playerId: string }
  ): Promise<void> {
    try {
      const room = await this.nextRoundUseCase.execute({
        roomId: payload.roomId,
        playerId: payload.playerId,
      });

      this.broadcastRoomState(room);
    } catch (error) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage("regenerate-topic")
  async handleRegenerateTopic(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; playerId: string }
  ): Promise<void> {
    try {
      const room = await this.regenerateTopicUseCase.execute({
        roomId: payload.roomId,
        playerId: payload.playerId,
      });

      this.broadcastRoomState(room);
    } catch (error) {
      this.emitError(client, error);
    }
  }

  private broadcastRoomState(room: Room): void {
    for (const player of room.players) {
      const playerState = this.transformRoomForPlayer(room, player.id);

      for (const [socketId, data] of this.clientData.entries()) {
        if (data.roomId === room.id && data.playerId === player.id) {
          this.server.to(socketId).emit("room-updated", playerState);
        }
      }
    }
  }

  private transformRoomForPlayer(
    room: Room,
    playerId: string
  ): RoomStateForClient {
    const baseState: RoomStateForClient = {
      id: room.id,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        isConnected: p.isConnected,
      })),
      gameType: room.gameType,
      game: null,
    };

    if (!room.game) {
      return baseState;
    }

    switch (room.game.type) {
      case "just-one":
        return {
          ...baseState,
          game: this.transformJustOneGameForPlayer(room.game, playerId),
        };
      default:
        return baseState;
    }
  }

  private transformJustOneGameForPlayer(
    game: JustOneGame,
    playerId: string
  ): JustOneGameForClient {
    const isAnswerer = game.answererId === playerId;
    const isResultOrFinished = game.phase === "RESULT" || game.phase === "FINISHED";

    // お題: 結果/終了画面では全員に表示、それ以外は回答者には非表示
    const topic = isResultOrFinished ? game.topic : isAnswerer ? null : game.topic;

    // ヒント: フェーズによって表示内容を変える
    let hints: HintForClient[];
    if (game.phase === "HINTING") {
      // ヒント中: 誰が出したかだけ表示（内容は隠す）
      hints = game.hints.map((h) => ({
        playerId: h.playerId,
        playerName: h.playerName,
        text: null,
        isValid: true,
      }));
    } else if (game.phase === "GUESSING") {
      // 回答中: 有効なヒントのみ内容表示、無効は隠す
      hints = game.hints.map((h) => ({
        playerId: h.playerId,
        playerName: h.playerName,
        text: h.isValid ? h.text : null,
        isValid: h.isValid,
      }));
    } else {
      // 結果/終了: 全てのヒント内容を表示（無効も含む）
      hints = game.hints.map((h) => ({
        playerId: h.playerId,
        playerName: h.playerName,
        text: h.text,
        isValid: h.isValid,
      }));
    }

    return {
      type: game.type,
      phase: game.phase,
      round: game.round,
      totalRounds: game.totalRounds,
      answererId: game.answererId,
      topic,
      hints,
      answer: game.answer,
      isCorrect: game.isCorrect,
      roundResults: game.roundResults || [],
    };
  }

  private emitError(client: Socket, error: unknown): void {
    const message = error instanceof Error ? error.message : "Unknown error";
    this.logger.error(`Error: ${message}`);
    client.emit("error", { message });
  }
}
