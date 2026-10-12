import {
  basicAuth,
  buildPropfindXml,
  CalDAVError,
  fetchCalDAVReport,
  parseDavXml,
  pickProp,
} from "../utils/caldav.ts";
import { encrypt } from "../utils/salt.ts";
import { config } from "../config.ts";

export type CalendarKind = "events" | "tasks" | "unknown";

export interface IcsLink {
  calendar: string;
  ics: string;
  count: number;
  kind: CalendarKind;
  error?: string;
}

interface CalendarInfo {
  href: string;
  displayName: string;
  isCalendar: boolean;
  kind: CalendarKind;
}

// deno-lint-ignore no-explicit-any
function detectKind(componentSet: any): CalendarKind {
  const comps = componentSet?.comp;
  if (!comps) return "unknown";
  const names = (Array.isArray(comps) ? comps : [comps])
    .map((c) => String(c?.["@_name"] ?? "").toUpperCase());
  if (names.includes("VEVENT")) return "events";
  if (names.includes("VTODO")) return "tasks";
  return "unknown";
}

async function discoverCalendars(
  baseUrl: string,
  headers: HeadersInit,
): Promise<{ origin: string; calendars: CalendarInfo[] }> {
  const body = buildPropfindXml();

  const resp = await fetch(baseUrl, {
    method: "PROPFIND",
    headers: {
      ...headers,
      Depth: "1",
      "Content-Type": "application/xml",
    },
    body,
  });

  if (!resp.ok) {
    await resp.body?.cancel();
    throw new Error(
      resp.status === 401 || resp.status === 403
        ? `Identifiants refusés par le serveur CalDAV (${resp.status}).`
        : `Découverte CalDAV en échec (${resp.status}).`,
    );
  }

  // Les href renvoyés sont relatifs à l'hôte final, qui peut différer de
  // l'hôte saisi après les redirections .well-known.
  const origin = new URL(resp.url).origin;
  const json = parseDavXml(await resp.text());
  const responses = json.multistatus?.response || [];
  const items = Array.isArray(responses) ? responses : [responses];

  const calendars = items.map((item) => {
    const href = new URL(item?.href, origin).pathname;
    const props = pickProp(item?.propstat);
    const displayName = props?.displayname || "";
    const resType = props?.resourcetype;
    const isCalendar = Object.keys(resType || {}).some((k) =>
      k.includes("calendar")
    );
    const kind = detectKind(props?.["supported-calendar-component-set"]);
    return { href, displayName, isCalendar, kind };
  });

  return { origin, calendars };
}

export async function caldav2icsDiscoveryService(
  userURL: URL,
  host: string,
): Promise<IcsLink[]> {
  const parsed = new URL(userURL);
  const baseUrl = `${parsed.protocol}//${parsed.host}`;
  const headers: HeadersInit = parsed.username && parsed.password
    ? { Authorization: basicAuth(parsed) }
    : {};

  const wellKnownUrl = `${baseUrl}/.well-known/caldav`;
  const wellResp = await fetch(wellKnownUrl, {
    method: "GET",
    headers,
    redirect: "manual",
  });

  const location = wellResp.headers.get("Location");
  if (!location) {
    throw new Error(
      "Le serveur ne supporte pas CalDAV ou la redirection .well-known est absente.",
    );
  }

  const redirectedTo = new URL(location, baseUrl).toString();
  const { origin, calendars } = await discoverCalendars(redirectedTo, headers);
  const dav = new URL(origin);

  const now = new Date();
  const start = new Date(now);
  start.setMonth(start.getMonth() - config.sinceMonths);
  const end = new Date(now);
  end.setMonth(end.getMonth() + config.untilMonths);

  const icsLinks: IcsLink[] = [];

  for (const cal of calendars) {
    if (!cal.isCalendar) continue;

    const fullUrl =
      `${dav.protocol}//${parsed.username}:${parsed.password}@${dav.host}${cal.href}`;
    const slug = await encrypt(fullUrl);

    let eventCount = 0;
    let error: string | undefined;
    try {
      const responses = await fetchCalDAVReport(`${origin}${cal.href}`, {
        headers,
        start,
        end,
      });
      eventCount = responses.reduce((acc, r) => {
        return acc + (r.calendarData?.match(/BEGIN:VEVENT/g)?.length || 0);
      }, 0);
    } catch (err) {
      console.error(`REPORT en échec sur ${cal.href} :`, err);
      error = err instanceof CalDAVError
        ? `Lecture refusée par le serveur (${err.status}).`
        : "Lecture impossible.";
    }

    icsLinks.push({
      calendar: cal.displayName || cal.href,
      ics: `${host}/${slug}.ics`,
      count: eventCount,
      kind: cal.kind,
      error,
    });
  }

  return icsLinks;
}
