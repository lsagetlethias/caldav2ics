// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_slug_ics from "./routes/[slug].ics.ts";
import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $discover from "./routes/discover.tsx";
import * as $index from "./routes/index.tsx";
import * as $CopyButton from "./islands/CopyButton.tsx";
import type { Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/[slug].ics.ts": $_slug_ics,
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/discover.tsx": $discover,
    "./routes/index.tsx": $index,
  },
  islands: {
    "./islands/CopyButton.tsx": $CopyButton,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
