// This file initializes Sentry on the server side
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const SENTRY_DSN = process.env.SENTRY_DSN;

    if (SENTRY_DSN) {
      Sentry.init({
        dsn: SENTRY_DSN,
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        environment: process.env.NODE_ENV,
        // Set `tracePropagationTargets` to control what URLs distributed tracing should be enabled for
        tracePropagationTargets: [
          "localhost",
          /^\//,
          // Re-enable potential third-party URLs below if needed
          // /^https:\/\/yourserver\.io\/api/,
        ],
      });
    }
  }
}

// Hook for instrumenting server-side request errors
export const onRequestError = Sentry.captureRequestError;
