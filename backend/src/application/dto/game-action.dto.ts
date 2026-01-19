import { GameType } from '../../domain/model/game-base';

export interface CreateRoomDto {
  playerId: string;
  playerName: string;
  gameType?: GameType;
}

export interface JoinRoomDto {
  roomId: string;
  playerId: string;
  playerName: string;
}

export interface StartGameDto {
  roomId: string;
  playerId: string;
  totalRounds?: number;
  excludeTopics?: string[]; // 過去に出たお題（ローカルストレージから）
}

export interface SubmitHintDto {
  roomId: string;
  playerId: string;
  hint: string;
}

export interface SubmitAnswerDto {
  roomId: string;
  playerId: string;
  answer: string;
}

export interface NextRoundDto {
  roomId: string;
  playerId: string;
}

export interface RegenerateTopicDto {
  roomId: string;
  playerId: string;
}
