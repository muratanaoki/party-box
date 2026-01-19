// ストレージキー管理

const STORAGE_PREFIX = 'partybox';
const USED_TOPICS_KEY = `${STORAGE_PREFIX}_used_topics`;
const MAX_STORED_TOPICS = 50; // 保存するお題の最大数

export function getStorageKeys(devId: string | null) {
  const suffix = devId ? `_dev${devId}` : '';
  return {
    PLAYER_ID_KEY: `${STORAGE_PREFIX}_player_id${suffix}`,
    PLAYER_NAME_KEY: `${STORAGE_PREFIX}_player_name${suffix}`,
  };
}

// 過去に使用したお題を取得
export function getUsedTopics(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(USED_TOPICS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// お題をローカルストレージに追加（FIFO方式で最大数を制限）
export function addUsedTopics(topics: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getUsedTopics();
    const newTopics = topics.filter((t) => !existing.includes(t));
    const combined = [...existing, ...newTopics];
    // 古いものから削除してMAX_STORED_TOPICSに収める
    const trimmed = combined.slice(-MAX_STORED_TOPICS);
    localStorage.setItem(USED_TOPICS_KEY, JSON.stringify(trimmed));
  } catch {
    // ストレージエラーは無視
  }
}
