import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error(error);

    return new Response(renderErrorPage(), {
      status: 500,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  }
});

const csrfMiddleware = createMiddleware().server(async ({ request, next }) => {
  const method = request.method.toUpperCase();

  // Safe/read-only requests do not need CSRF protection.
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  const origin = request.headers.get("origin");

  if (origin) {
    const requestOrigin = new URL(request.url).origin;

    if (origin !== requestOrigin) {
      return new Response("Forbidden", { status: 403 });
    }

    return next();
  }

  const referer = request.headers.get("referer");

  if (referer) {
    const requestOrigin = new URL(request.url).origin;
    const refererOrigin = new URL(referer).origin;

    if (refererOrigin !== requestOrigin) {
      return new Response("Forbidden", { status: 403 });
    }

    return next();
  }

  return new Response("Forbidden", { status: 403 });
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
