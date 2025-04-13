import { Handlers, PageProps } from "$fresh/server.ts";
import CopyButton from "../islands/CopyButton.tsx";
import {
  caldav2icsDiscoveryService,
  IcsLink,
} from "../services/caldav2icsDiscoveryService.ts";

interface DiscoverPageProps {
  icsLinks: IcsLink[];
  error?: string;
}

export const handler: Handlers<DiscoverPageProps> = {
  async POST(req, ctx) {
    console.log("POST /discover");
    // get login, password, caldav_url from form data
    const form = await req.formData();
    const login = form.get("login")?.toString();
    const password = form.get("password")?.toString();
    const caldavUrl = form.get("caldav_url")?.toString();
    if (!login || !password || !caldavUrl) {
      return ctx.render({ icsLinks: [], error: "Paramètres manquants." });
    }

    try {
      new URL(caldavUrl);
    } catch {
      return ctx.render({ icsLinks: [], error: "URL CalDAV invalide." });
    }

    try {
      const url = new URL(caldavUrl);
      url.username = login;
      url.password = password;

      const icsLinks = await caldav2icsDiscoveryService(url);
      return ctx.render({ icsLinks });
    } catch (err) {
      return ctx.render({
        icsLinks: [],
        error: err instanceof Error ? err.message : "Erreur inconnue.",
      });
    }
  },
  GET() {
    console.log("GET /discover");
    // redirect to the home page
    return new Response("", {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  },
};

export default function DiscoverPage({ data }: PageProps<DiscoverPageProps>) {
  return (
    <section class="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      {data.error
        ? (
          <>
            <p class="text-red-600 font-semibold">{data.error}</p>
            <a
              href="/discover"
              class="inline-block mt-4 text-blue-600 hover:underline"
            >
              ↩️ Recommencer
            </a>
          </>
        )
        : data.icsLinks.length === 0
        ? (
          <>
            <p class="text-gray-700">Aucun calendrier trouvé.</p>
            <a
              href="/discover"
              class="inline-block mt-4 text-blue-600 hover:underline"
            >
              ↩️ Recommencer
            </a>
          </>
        )
        : (
          <>
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              Calendriers détectés :
            </h2>
            <ul class="space-y-4">
              {data.icsLinks.map((link) => (
                <li class="border p-4 rounded-md bg-gray-50">
                  <p class="font-semibold text-gray-800">{link.calendar}</p>
                  <p class="text-sm text-gray-600 mb-2">
                    {link.count} événement(s)
                  </p>
                  <div class="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={link.ics}
                      class="flex-1 px-2 py-1 border rounded-md text-sm text-gray-700"
                    />
                    <CopyButton text={link.ics} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
    </section>
  );
}
