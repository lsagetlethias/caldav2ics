import { XMLParser } from "fast-xml-parser";

function formatDateUTC(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function buildReportXml(start: Date, end: Date): string {
  return `
<C:calendar-query xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop xmlns:D="DAV:">
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${formatDateUTC(start)}" end="${
    formatDateUTC(end)
  }"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;
}

export function buildPropfindXml(): string {
  return `
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:displayname/>
    <D:resourcetype/>
    <C:supported-calendar-component-set/>
  </D:prop>
</D:propfind>`;
}

export class CalDAVError extends Error {
  constructor(readonly status: number) {
    super(`CalDAV REPORT failed (${status})`);
    this.name = "CalDAVError";
  }
}

export interface CalDAVResponse {
  href: string;
  displayName?: string;
  calendarData?: string;
  rawXml?: string;
}

export async function fetchCalDAVReport(
  url: string | URL,
  options: {
    headers: HeadersInit;
    start: Date;
    end: Date;
  },
): Promise<CalDAVResponse[]> {
  const { headers, start, end } = options;
  const reportXml = buildReportXml(start, end);

  const response = await fetch(url.toString(), {
    method: "REPORT",
    headers: {
      ...headers,
      "Content-Type": "application/xml",
      "Depth": "1",
    },
    body: reportXml,
  });

  if (!response.ok) {
    await response.body?.cancel();
    throw new CalDAVError(response.status);
  }

  const rawXml = await response.text();
  const json = parseDavXml(rawXml);

  const responses = json.multistatus?.response || [];
  const responseArray = Array.isArray(responses) ? responses : [responses];

  return responseArray.map((entry): CalDAVResponse => {
    const href = entry.href;
    const prop = pickProp(entry.propstat);

    const displayName = prop?.displayname || "";
    const calendarData = prop?.["calendar-data"];

    const data = typeof calendarData === "string"
      ? calendarData
      : calendarData?.["#text"];

    return {
      href,
      displayName,
      calendarData: data,
      rawXml,
    };
  });
}

// deno-lint-ignore no-explicit-any
export function parseDavXml(xml: string): any {
  return new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
  }).parse(xml);
}

// Un serveur peut renvoyer plusieurs propstat (200 pour les props trouvées,
// 404 pour les autres) : on garde celui en 200.
// deno-lint-ignore no-explicit-any
export function pickProp(propstat: any): any {
  const list = Array.isArray(propstat) ? propstat : [propstat];
  const ok = list.find((p) => / 200 /.test(String(p?.status ?? "")));
  return (ok ?? list[0])?.prop;
}
