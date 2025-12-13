import path from 'path';
import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const DEBUG_LOG_ENDPOINT = 'http://127.0.0.1:7242/ingest/afa0e6a4-a579-4cac-85ee-332cfca43b6a';
const DEBUG_SESSION_ID = 'debug-session';
const debugRunId = process.env.DEBUG_RUN_ID ?? 'pre-fix';

const emitDebugLog = (
  hypothesisId: string,
  message: string,
  data: Record<string, unknown>,
  location: string
) => {
  // #region agent log
  void fetch(DEBUG_LOG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION_ID,
      runId: debugRunId,
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
};

emitDebugLog('H1', 'Build environment snapshot', {
  node: process.version,
  vercel: process.env.VERCEL ?? 'unset',
  nodeEnv: process.env.NODE_ENV ?? 'unset',
  userAgent: process.env.npm_config_user_agent ?? 'unset',
  cwd: process.cwd(),
}, 'next.config.ts:env');

try {
  const resolvedReactQuery = require.resolve('@tanstack/react-query');
  emitDebugLog('H2', 'Resolved @tanstack/react-query', { resolvedReactQuery }, 'next.config.ts:resolve-react-query');
} catch (error) {
  emitDebugLog('H2', 'Failed to resolve @tanstack/react-query', {
    error: error instanceof Error ? error.message : 'unknown',
  }, 'next.config.ts:resolve-react-query');
}

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async redirects() {
    return [
      {
        source: '/ontology/values',
        destination: '/ontology?expanded=value',
        permanent: false, // 302 redirect (temporary)
      },
      {
        source: '/ontology/beliefs',
        destination: '/ontology?expanded=belief',
        permanent: false,
      },
      {
        source: '/ontology/goals',
        destination: '/ontology?expanded=aim',
        permanent: false,
      },
    ]
  },
};

const enableSentry = process.env.SENTRY_ENABLED === 'true';

emitDebugLog('H3', 'Next config flags', {
  enableSentry,
  outputFileTracingRoot: nextConfig.outputFileTracingRoot,
}, 'next.config.ts:config-flags');

const sentryWrappedConfig = withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG ?? '',
  project: process.env.SENTRY_PROJECT ?? '',

  // An auth token is required for uploading source maps.
  authToken: process.env.SENTRY_AUTH_TOKEN,

  silent: true, // Suppresses all logs

  // Use sourcemaps for error tracking (set to false in production to prevent source code exposure)
  sourcemaps: {
    disable: process.env.NODE_ENV === 'production',
  },
});

export default enableSentry ? sentryWrappedConfig : nextConfig;
