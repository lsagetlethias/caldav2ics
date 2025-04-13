export const config = {
  host: Deno.env.get("HOST") || "http://localhost:8000",
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
