import { type Context } from "fresh";

import { resolveHost } from "../config.ts";

import { caldavUrl2icsService } from "../services/caldavUrl2icsService.ts";
import { decrypt } from "../utils/salt.ts";

export const handler = {
  async GET(ctx: Context<unknown>) {
    const slug = ctx.url.pathname.slice(1).replace(/\.ics$/, "");

    try {
      const rawCaldavUrl = await decrypt(slug);

      const url = new URL(rawCaldavUrl);
      const ics = await caldavUrl2icsService(url, resolveHost(ctx.url.origin));

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
