// Cloudflare Worker entry point. Each module owns its own route so modules stay
// independent (see CLAUDE.md, "Değişime açık tasarım").

import { D1FeedbackStore } from "../feedback/store";
import { handleFeedback } from "./feedback";

export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/feedback") {
      return handleFeedback(request, new D1FeedbackStore(env.DB));
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
