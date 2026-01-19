import { Player, Hint } from '@/types/game';

// プレイヤー名を取得
export function getPlayerName(players: Player[], playerId: string): string {
  return players.find((p) => p.id === playerId)?.name ?? '???';
}

// ヒントを有効/無効に分割（1回のループで処理）
export function partitionHints(hints: Hint[]): {
  validHints: Hint[];
  invalidHints: Hint[];
} {
  const validHints: Hint[] = [];
  const invalidHints: Hint[] = [];

  for (const hint of hints) {
    if (hint.isValid) {
      validHints.push(hint);
    } else {
      invalidHints.push(hint);
    }
  }

  return { validHints, invalidHints };
}
