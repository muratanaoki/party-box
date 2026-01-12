import { Injectable } from '@nestjs/common';
import { IGameRepository } from '../../domain/repository/i-game.repository';
import { Room } from '../../domain/model/room';

@Injectable()
export class InMemoryGameRepository implements IGameRepository {
  private rooms: Map<string, Room> = new Map();

  async saveRoom(room: Room): Promise<void> {
    this.rooms.set(room.id, room);
  }

  async findRoomById(roomId: string): Promise<Room | null> {
    return this.rooms.get(roomId) ?? null;
  }

  async deleteRoom(roomId: string): Promise<void> {
    this.rooms.delete(roomId);
  }

  async roomExists(roomId: string): Promise<boolean> {
    return this.rooms.has(roomId);
  }
}
