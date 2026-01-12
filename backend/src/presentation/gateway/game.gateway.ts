import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import { CreateRoomUseCase } from '../../application/usecase/create-room.usecase';
import { JoinRoomUseCase } from '../../application/usecase/join-room.usecase';
import { StartGameUseCase } from '../../application/usecase/start-game.usecase';
import { SubmitHintUseCase } from '../../application/usecase/submit-hint.usecase';
import { SubmitAnswerUseCase } from '../../application/usecase/submit-answer.usecase';
import { NextRoundUseCase } from '../../application/usecase/next-round.usecase';
import {
  IGameRepository,
  GAME_REPOSITORY,
} from '../../domain/repository/i-game.repository';
import { updatePlayerConnection, Room } from '../../domain/model/room';
import { Hint } from '../../domain/model/game';

interface ClientData {
  playerId: string;
  roomId: string | null;
}

interface RoomStateForClient {
  id: string;
  players: Array<{
    id: string;
    name: string;
    isHost: boolean;
    isConnected: boolean;
  }>;
  game: {
    phase: string;
    topic: string | null;
    answererId: string;
    hints: Array<{
      playerId: string;
      playerName: string;
      text: string | null;
      isValid: boolean;
    }>;
    answer: string | null;
    isCorrect: boolean | null;
    round: number;
  } | null;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
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
    @Inject(GAME_REPOSITORY)
    private readonly gameRepository: IGameRepository,
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

  @SubscribeMessage('create-room')
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { playerId: string; playerName: string },
  ): Promise<void> {
    try {
      const room = await this.createRoomUseCase.execute({
        playerId: payload.playerId,
        playerName: payload.playerName,
      });

      this.clientData.set(client.id, {
        playerId: payload.playerId,
        roomId: room.id,
      });

      await client.join(room.id);

      client.emit('room-created', { roomId: room.id });
      this.broadcastRoomState(room);
    } catch (error) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { roomId: string; playerId: string; playerName: string },
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

      client.emit('room-joined', { roomId: room.id });
      this.broadcastRoomState(room);
    } catch (error) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('start-game')
  async handleStartGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; playerId: string },
  ): Promise<void> {
    try {
      const room = await this.startGameUseCase.execute({
        roomId: payload.roomId,
        playerId: payload.playerId,
      });

      this.broadcastRoomState(room);
    } catch (error) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('submit-hint')
  async handleSubmitHint(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; playerId: string; hint: string },
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

  @SubscribeMessage('submit-answer')
  async handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { roomId: string; playerId: string; answer: string },
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

  @SubscribeMessage('next-round')
  async handleNextRound(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; playerId: string },
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

  private broadcastRoomState(room: Room): void {
    const state = this.transformRoomForClients(room);

    for (const player of room.players) {
      const playerState = this.transformRoomForPlayer(room, player.id);
      this.server.to(room.id).emit('room-updated', playerState);
    }

    this.server.to(room.id).emit('room-updated', state);
  }

  private transformRoomForClients(room: Room): RoomStateForClient {
    return {
      id: room.id,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        isConnected: p.isConnected,
      })),
      game: room.game
        ? {
            phase: room.game.phase,
            topic: null,
            answererId: room.game.answererId,
            hints: room.game.hints.map((h) => ({
              playerId: h.playerId,
              playerName: h.playerName,
              text: h.isValid ? h.text : null,
              isValid: h.isValid,
            })),
            answer: room.game.answer,
            isCorrect: room.game.isCorrect,
            round: room.game.round,
          }
        : null,
    };
  }

  private transformRoomForPlayer(
    room: Room,
    playerId: string,
  ): RoomStateForClient {
    const isAnswerer = room.game?.answererId === playerId;

    return {
      id: room.id,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        isConnected: p.isConnected,
      })),
      game: room.game
        ? {
            phase: room.game.phase,
            topic: isAnswerer ? null : room.game.topic,
            answererId: room.game.answererId,
            hints:
              room.game.phase === 'HINTING'
                ? room.game.hints.map((h) => ({
                    playerId: h.playerId,
                    playerName: h.playerName,
                    text: null,
                    isValid: true,
                  }))
                : room.game.hints.map((h) => ({
                    playerId: h.playerId,
                    playerName: h.playerName,
                    text: h.isValid ? h.text : null,
                    isValid: h.isValid,
                  })),
            answer: room.game.answer,
            isCorrect: room.game.isCorrect,
            round: room.game.round,
          }
        : null,
    };
  }

  private emitError(client: Socket, error: unknown): void {
    const message = error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(`Error: ${message}`);
    client.emit('error', { message });
  }
}
