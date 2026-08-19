import "@std/dotenv/load";

import { App, staticFiles } from "fresh";

export const app = new App();

app.use(staticFiles());
app.fsRoutes();
