export interface CreateRoomDto {
  playerId: string;
  playerName: string;
}

export interface JoinRoomDto {
  roomId: string;
  playerId: string;
  playerName: string;
}

export interface StartGameDto {
  roomId: string;
  playerId: string;
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

export interface ReconnectDto {
  roomId: string;
  playerId: string;
}

export interface NextRoundDto {
  roomId: string;
  playerId: string;
}
