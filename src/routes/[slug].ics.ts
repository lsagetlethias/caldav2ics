// import { decryptSlug } from "../utils/slug.ts";
// import { generateIcsFromCalDavUrl } from "../services/caldav2icsService.ts"; // ton service habituel

import { caldavUrl2icsService } from "../services/caldavUrl2icsService.ts";
import { decrypt } from "../utils/salt.ts";

export const handler = {
  async GET(req: Request) {
    const url = new URL(req.url);
    const slug = url.pathname.slice(1).replace(/\.ics$/, "");

    console.log({ slug });

    try {
      const rawCaldavUrl = await decrypt(slug);
      console.log("URL CalDAV déchiffrée :", rawCaldavUrl);

      const url = new URL(rawCaldavUrl);
      const ics = await caldavUrl2icsService(url);

      return new Response(ics, {
        headers: {
          "Content-Type": "text/calendar",
          "Content-Disposition": "inline; filename=calendar.ics",
          "Cache-Control": "no-cache",
        },
      });
    } catch (err) {
      console.error("Erreur lors de la déchiffrement du slug :", err);
      return new Response("Slug invalide ou expiré", { status: 400 });
    }
  },
};
