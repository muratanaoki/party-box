import { Room } from '../model/room';

export interface IGameRepository {
  saveRoom(room: Room): Promise<void>;
  findRoomById(roomId: string): Promise<Room | null>;
  deleteRoom(roomId: string): Promise<void>;
  roomExists(roomId: string): Promise<boolean>;
}

export const GAME_REPOSITORY = Symbol('IGameRepository');
