export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
}

export function createPlayer(id: string, name: string, isHost: boolean): Player {
  return {
    id,
    name,
    isHost,
    isConnected: true,
  };
}
