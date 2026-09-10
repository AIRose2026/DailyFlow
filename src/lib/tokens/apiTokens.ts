import { createHash, randomBytes } from "crypto";

const TOKEN_PREFIX = "df_";

/**
 * Generates a new personal API token. The plaintext `token` is returned
 * once, for the caller to show the user immediately — only `hash` (and the
 * short `prefix`, purely for display so a user can tell tokens apart) is
 * ever persisted.
 */
export function generateApiToken() {
  const raw = randomBytes(32).toString("hex");
  const token = `${TOKEN_PREFIX}${raw}`;
  return {
    token,
    hash: hashApiToken(token),
    prefix: token.slice(0, 10),
  };
}

export function hashApiToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
