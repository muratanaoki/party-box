// ストレージキー管理

const STORAGE_PREFIX = 'partybox';

export function getStorageKeys(devId: string | null) {
  const suffix = devId ? `_dev${devId}` : '';
  return {
    PLAYER_ID_KEY: `${STORAGE_PREFIX}_player_id${suffix}`,
    PLAYER_NAME_KEY: `${STORAGE_PREFIX}_player_name${suffix}`,
  };
}
