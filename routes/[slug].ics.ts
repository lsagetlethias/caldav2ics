import { type Context } from "fresh";

import { resolveHost } from "../config.ts";

import { caldavUrl2icsService } from "../services/caldavUrl2icsService.ts";
import { CalDAVError } from "../utils/caldav.ts";
import { decrypt } from "../utils/salt.ts";

function text(body: string, status: number) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export const handler = {
  async GET(ctx: Context<unknown>) {
    const slug = ctx.url.pathname.slice(1).replace(/\.ics$/, "");

    let url: URL;
    try {
      url = new URL(await decrypt(slug));
    } catch (err) {
      console.error("Erreur lors du déchiffrement du slug :", err);
      return text("Slug invalide ou expiré", 400);
    }

    try {
      const ics = await caldavUrl2icsService(url, resolveHost(ctx.url.origin));

      return new Response(ics, {
        headers: {
          "Content-Type": "text/calendar",
          "Content-Disposition": "inline; filename=calendar.ics",
          "Cache-Control": "no-cache",
        },
      });
    } catch (err) {
      console.error("Erreur CalDAV :", err);
      if (err instanceof CalDAVError) {
        if (err.status === 401 || err.status === 403) {
          return text(
            `Identifiants refusés par le serveur CalDAV (${err.status}) : mot de passe expiré ou révoqué, régénère le lien.`,
            502,
          );
        }
        return text(`Le serveur CalDAV a répondu ${err.status}.`, 502);
      }
      return text("Serveur CalDAV injoignable.", 502);
    }
  },
};
