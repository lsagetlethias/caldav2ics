import { PageProps } from "$fresh/server.ts";
import { config } from "../config.ts";

export default function DiscoverPage(props: PageProps) {
  return (
    <section class="grid md:grid-cols-2 gap-12 items-center">
      {/* Texte de présentation */}
      <div>
        <h2 class="text-4xl font-bold text-gray-900 mb-4">
          Transformez vos calendriers CalDAV en liens ICS sécurisés
        </h2>
        <p class="text-lg text-gray-700 mb-6">
          {config.appName}{" "}
          est un outil gratuit et open-source qui vous permet de rendre vos
          calendriers CalDAV compatibles avec des outils comme Google Calendar
          ou Outlook Web.
          <br />
          <br />
          Nous ne stockons pas vos identifiants. Ils sont encodés temporairement
          côté serveur pour générer des liens ICS lisibles par vos apps. Chaque
          fichier ICS est généré à la volée et contient uniquement les
          événements nécessaires.
        </p>
        <ul class="list-disc list-inside text-gray-600 space-y-1">
          <li>Compatible avec tous les serveurs CalDAV</li>
          <li>Sécurisé, sans base de données</li>
          <li>
            Fonctionne avec des lecteurs comme Google Calendar, Outlook, Apple
          </li>
        </ul>
      </div>

      {/* Formulaire */}
      <div class="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <form method="POST" action="/discover" class="space-y-4">
          <div>
            <label class="block font-medium text-gray-700">Login :</label>
            <input
              type="text"
              name="login"
              required
              class="w-full mt-1 px-4 py-2 border rounded-md"
              value={props.config.dev ? config.defaultUser : ""}
            />
          </div>

          <div>
            <label class="block font-medium text-gray-700">
              Mot de passe :
            </label>
            <input
              type="password"
              name="password"
              required
              class="w-full mt-1 px-4 py-2 border rounded-md"
              value={props.config.dev ? config.defaultPassword : ""}
            />
          </div>

          <div>
            <label class="block font-medium text-gray-700">
              URL CalDAV :
            </label>
            <input
              type="url"
              name="caldav_url"
              required
              placeholder={config.caldavUrlPlaceholder}
              class="w-full mt-1 px-4 py-2 border rounded-md"
              value={props.config.dev ? config.defaultCaldavUrl : ""}
            />
          </div>

          <button
            type="submit"
            class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Découvrir mes calendriers
          </button>
        </form>
      </div>
    </section>
  );
}
