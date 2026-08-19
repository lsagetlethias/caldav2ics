import { config } from "../config.ts";
import { fetchCalDAVReport } from "../utils/caldav.ts";
import { ensureUid, sanitizeText } from "../utils/ics.ts";

export async function caldavUrl2icsService(url: URL) {
  const now = new Date();
  const start = new Date(now);
  start.setMonth(start.getMonth() - config.sinceMonths);
  const end = new Date(now);
  end.setMonth(end.getMonth() + config.untilMonths);

  const headers: HeadersInit = {
    "Content-Type": "application/xml",
    Depth: "1",
  };

  if (url.username && url.password) {
    const basic = btoa(`${decodeURIComponent(url.username)}:${url.password}`);
    headers["Authorization"] = `Basic ${basic}`;
  }

  url.username = "";
  url.password = "";

  const responses = await fetchCalDAVReport(url, { headers, start, end });

  const vevents: string[] = [];
  const eventUIDs = new Set<string>();
  let timezoneBlock = "";
  let calendarName = "";

  for (const r of responses) {
    if (!calendarName && r.displayName) {
      calendarName = r.displayName;
    }

    const raw = r.calendarData;
    if (!raw) continue;

    const veventMatches = raw.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g);
    if (veventMatches) {
      for (let evt of veventMatches) {
        evt = ensureUid(evt);
        const uidMatch = evt.match(/UID:(.+)/);
        const uid = uidMatch?.[1]?.trim();
        if (uid && !eventUIDs.has(uid)) {
          eventUIDs.add(uid);
          const sanitized = evt
            .split(/\r?\n/)
            .map((line) => {
              return ["SUMMARY", "DESCRIPTION", "LOCATION", "CATEGORIES"]
                .reduce((acc, label) => {
                  const prefix = `${label}:`;
                  if (!acc.startsWith(prefix)) return acc;
                  return `${prefix}${sanitizeText(acc.slice(prefix.length))}`;
                }, line);
            })
            .join("\n");
          vevents.push(sanitized);
        }
      }
    }

    if (!timezoneBlock && raw.includes("BEGIN:VTIMEZONE")) {
      const match = raw.match(/BEGIN:VTIMEZONE[\s\S]*?END:VTIMEZONE/);
      if (match?.[0]) timezoneBlock = match[0];
    }
  }

  if (!timezoneBlock) {
    timezoneBlock = [
      "BEGIN:VTIMEZONE",
      "TZID:UTC",
      "BEGIN:STANDARD",
      "DTSTART:19700101T000000",
      "TZOFFSETFROM:+0000",
      "TZOFFSETTO:+0000",
      "TZNAME:UTC",
      "END:STANDARD",
      "END:VTIMEZONE",
    ].join("\n");
  }

  const metadata = [
    "VERSION:2.0",
    `PRODID:-//${config.host}//EN`,
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${calendarName || "Calendrier"}`,
    "X-WR-TIMEZONE:Europe/Paris",
    "X-PUBLISHED-TTL:PT1M",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1M",
    `X-GENERATED-AT:${now.toISOString()}`,
  ];

  const ics = `BEGIN:VCALENDAR\n${metadata.join("\n")}\n${timezoneBlock}\n${
    vevents.join("\n")
  }\nEND:VCALENDAR`
    .replace(/\n/g, "\r\n");

  return ics;
}
