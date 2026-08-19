export function sanitizeText(text: string): string {
  return text
    .replace(
      /&#x([0-9a-fA-F]+);/g,
      (_, hex) => String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/\n/g, "\\n")
    .replace(/[\r\t]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export function ensureUid(evt: string): string {
  if (/UID:.+/g.test(evt)) return evt;
  const uid = crypto.randomUUID();
  const insertIndex = evt.indexOf("END:VEVENT");
  if (insertIndex === -1) return evt;
  return evt.replace("END:VEVENT", `UID:${uid}\nEND:VEVENT`);
}
