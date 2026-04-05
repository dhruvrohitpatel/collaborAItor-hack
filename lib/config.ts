export const MIN_TEAM_SIZE = 2;
export const DEFAULT_TEAM_SIZE = 4;
export const MAX_TEAM_SIZE = 6;

export function isMockDataEnabled() {
  return process.env.USE_MOCK_DATA !== "false";
}

export function useMockAuthClient() {
  return process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== "false";
}
