export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function parseEmailList(value: string | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);
}
