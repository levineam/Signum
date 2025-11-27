// This file initializes Sentry on the client side
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    environment: process.env.NODE_ENV,
  });
}

// Hook for instrumenting Next.js router transitions
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
