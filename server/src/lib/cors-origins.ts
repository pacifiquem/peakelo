export function parseCorsOrigins(raw: string): string[] {
  const origins = raw
    .split(',')
    .map((part) => part.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (origins.length === 0) {
    throw new Error('CORS_ORIGIN must list at least one origin');
  }
  return origins;
}
