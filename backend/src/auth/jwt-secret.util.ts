const PLACEHOLDER_PREFIX = "CHANGEME_";

export function getJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET?.trim();

  if (!jwtSecret || jwtSecret.startsWith(PLACEHOLDER_PREFIX)) {
    throw new Error(
      "JWT_SECRET is missing or still set to a placeholder value.",
    );
  }

  return jwtSecret;
}