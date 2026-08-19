import { HttpError, type PageProps } from "fresh";
import { Head } from "fresh/runtime";

export default function ErrorPage({ error }: PageProps) {
  const status = error instanceof HttpError ? error.status : 500;
  const isNotFound = status === 404;

  const title = isNotFound ? "404 - Page non trouvée" : "500 - Erreur serveur";
  const message = isNotFound
    ? "La page que vous cherchez n'existe pas ou le lien est expiré."
    : "Une erreur inattendue est survenue. Réessayez dans un instant.";

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <section class="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-10 border border-gray-100 text-center">
        <img
          class="mx-auto mb-6 h-24 w-24 object-contain"
          src="/logo.svg"
          alt="Logo caldav2ics"
        />
        <h1 class="text-3xl font-bold text-gray-900 mb-3">{title}</h1>
        <p class="text-gray-700 mb-6">{message}</p>
        <a
          href="/"
          class="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Retour à l'accueil
        </a>
      </section>
    </>
  );
}
