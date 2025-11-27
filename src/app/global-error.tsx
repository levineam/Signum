"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
          <h1>Something went wrong</h1>
          <p>An unexpected error occurred. Please try refreshing the page.</p>
          {error.message && (
            <details style={{ marginTop: "1rem", opacity: 0.6 }}>
              <summary>Error details</summary>
              <pre>{error.message}</pre>
            </details>
          )}
        </div>
      </body>
    </html>
  );
}
