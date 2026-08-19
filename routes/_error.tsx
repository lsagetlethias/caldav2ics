import { HttpError, type PageProps } from "fresh";
import { Head } from "fresh/runtime";

export default function ErrorPage({ error }: PageProps) {
  const status = error instanceof HttpError ? error.status : 500;
  const isNotFound = status === 404;

  const title = isNotFound ? "404 - Page non trouvée" : "500 - Erreur serveur";
  const message = isNotFound
    ? "La page que vous cherchez n'existe pas."
    : "Une erreur inattendue est survenue.";

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div class="px-4 py-8 mx-auto bg-[#86efac]">
        <div class="max-w-3xl mx-auto flex flex-col items-center justify-center">
          <img
            class="my-6"
            src="/logo.svg"
            width="128"
            height="128"
            alt="Logo caldav2ics"
          />
          <h1 class="text-4xl font-bold">{title}</h1>
          <p class="my-4">{message}</p>
          <a href="/" class="underline">Retour à l'accueil</a>
        </div>
      </div>
    </>
  );
}
