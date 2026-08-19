export const config = {
  host: Deno.env.get("HOST"),
  appName: Deno.env.get("APP_NAME") || "caldav2ics",
  salt: Deno.env.get("SALT") || "salt",
  caldavUrlPlaceholder: Deno.env.get("CALDAV_URL_PLACEHOLDER") ||
    "https://example.com/caldav",
  defaultUser: Deno.env.get("DEFAULT_USER") || "",
  defaultPassword: Deno.env.get("DEFAULT_PASSWORD") || "",
  defaultCaldavUrl: Deno.env.get("DEFAULT_CALDAV_URL") || "",
  sinceMonths: Number(
    Deno.env.get("SINCE_MONTHS"),
  ) || 6,
  untilMonths: Number(
    Deno.env.get("UNTIL_MONTHS"),
  ) || 12,
} as const;

/**
 * L'hôte gravé dans les liens ICS distribués aux utilisateurs. Sans HOST, on
 * suit l'origine de la requête : l'app est servie sur plusieurs domaines et
 * chacun doit produire des liens qui pointent sur lui-même.
 */
export function resolveHost(requestOrigin: string): string {
  return config.host || requestOrigin;
}
