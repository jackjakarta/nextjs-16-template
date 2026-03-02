import { type NextConfig } from 'next';

const nextConfig: NextConfig = {
  // output: 'standalone',
  // reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['your.origin.dev'],
};

export default nextConfig;
