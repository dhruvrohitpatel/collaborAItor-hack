export const DEFAULT_TEAM_SIZE = 4;

export function useMockData() {
  return process.env.USE_MOCK_DATA !== "false";
}

export function useMockAuthClient() {
  return process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== "false";
}
