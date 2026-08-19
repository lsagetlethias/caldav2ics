import { buildPropfindXml, fetchCalDAVReport } from "../utils/caldav.ts";
import { encrypt } from "../utils/salt.ts";
import { config } from "../config.ts";
import { XMLParser } from "fast-xml-parser";

export interface IcsLink {
  calendar: string;
  ics: string;
  count: number;
}

function buildAuthHeaders(username: string, password: string): HeadersInit {
  const decodedUser = decodeURIComponent(username);
  const basic = btoa(`${decodedUser}:${password}`);
  return { Authorization: `Basic ${basic}` };
}

interface CalendarInfo {
  href: string;
  displayName: string;
  isCalendar: boolean;
}

async function discoverCalendars(
  baseUrl: string,
  headers: HeadersInit,
): Promise<CalendarInfo[]> {
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

  if (!resp.ok) return [];

  const xml = await resp.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const json = parser.parse(xml);
  const responses = json["D:multistatus"]?.["D:response"] || [];
  const items = Array.isArray(responses) ? responses : [responses];

  return items.map((item) => {
    const href = item?.["D:href"];
    const props = item?.["D:propstat"]?.["D:prop"];
    const displayName = props?.["D:displayname"] || "";
    const resType = props?.["D:resourcetype"];
    const isCalendar = Object.keys(resType || {}).some((k) =>
      k.includes("calendar")
    );
    return { href, displayName, isCalendar };
  });
}

export async function caldav2icsDiscoveryService(
  userURL: URL,
): Promise<IcsLink[]> {
  const parsed = new URL(userURL);
  const baseUrl = `${parsed.protocol}//${parsed.hostname}`;
  const headers = parsed.username && parsed.password
    ? buildAuthHeaders(parsed.username, parsed.password)
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
  const calendars = await discoverCalendars(redirectedTo, headers);

  const now = new Date();
  const start = new Date(now);
  start.setMonth(start.getMonth() - config.sinceMonths);
  const end = new Date(now);
  end.setMonth(end.getMonth() + config.untilMonths);

  const icsLinks: IcsLink[] = [];

  for (const cal of calendars) {
    if (!cal.isCalendar) continue;

    const fullUrl =
      `${parsed.protocol}//${parsed.username}:${parsed.password}@${parsed.host}${cal.href}`;
    const slug = await encrypt(fullUrl);

    const responses = await fetchCalDAVReport(`${baseUrl}${cal.href}`, {
      headers,
      start,
      end,
    });

    const eventCount = responses.reduce((acc, r) => {
      return acc + (r.calendarData?.match(/BEGIN:VEVENT/g)?.length || 0);
    }, 0);

    icsLinks.push({
      calendar: cal.displayName || cal.href,
      ics: `${config.host}/${slug}.ics`,
      count: eventCount,
    });
  }

  return icsLinks;
}
