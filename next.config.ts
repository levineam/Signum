import path from 'path';
import type { NextConfig } from 'next';

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

export default nextConfig;
