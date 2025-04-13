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
  </D:prop>
</D:propfind>`;
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
    throw new Error(`CalDAV REPORT failed (${response.status})`);
  }

  const rawXml = await response.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  const json = parser.parse(rawXml);

  const responses = json["D:multistatus"]?.["D:response"] || [];
  const responseArray = Array.isArray(responses) ? responses : [responses];

  return responseArray.map((entry): CalDAVResponse => {
    const href = entry["D:href"];
    const prop = Array.isArray(entry["D:propstat"])
      ? entry["D:propstat"][0]?.["D:prop"]
      : entry["D:propstat"]?.["D:prop"];

    const displayName = prop?.["D:displayname"] || "";
    const calendarData = prop?.["C:calendar-data"] ||
      prop?.["calendar-data"] ||
      prop?.["cal:calendar-data"];

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
