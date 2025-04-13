import { type PageProps } from "$fresh/server.ts";
import { config } from "../config.ts";

export default function App({ Component }: PageProps) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="fr" class="h-full">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>
          {config.appName} - Générateur ICS sécurisé à partir de CalDAV
        </title>
        <link rel="icon" href="/logo.svg" />
        <link rel="stylesheet" href="/styles.css" />
      </head>

      <body class="min-h-screen flex flex-col bg-blue-50 text-gray-900">
        {/* Header */}
        <header class="flex items-center justify-between px-6 py-4 border-b bg-white shadow-sm">
          <a
            href="/"
            class="flex items-center gap-2 text-blue-600 font-bold text-xl hover:underline"
          >
            <img
              src="/logo.svg"
              alt="logo"
              class="h-12 w-12 scale-125 object-contain mr-2"
            />
            {config.appName}
          </a>
          <a
            href="https://github.com/tonrepo" // ← à adapter
            target="_blank"
            class="text-sm text-gray-500 hover:underline"
          >
            GitHub
          </a>
        </header>

        {/* Main */}
        <main class="flex-grow max-w-7xl mx-auto w-full px-4 py-12 md:py-20">
          <Component />
        </main>

        {/* Footer */}
        <footer class="mt-auto py-4 text-center text-sm text-gray-500 border-t bg-white">
          © {currentYear} {config.appName}{" "}
          — Outil libre pour synchronisation CalDAV → ICS
          <span class="ml-2">
            <a
              href="https://github.com/tonrepo" // ← idem ici
              class="hover:underline"
              target="_blank"
            >
              GitHub
            </a>
          </span>
        </footer>
      </body>
    </html>
  );
}
