import path from 'path';
import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

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
