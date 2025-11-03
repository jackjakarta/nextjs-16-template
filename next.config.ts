import { type NextConfig } from 'next';

const nextConfig: NextConfig = {
  // output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['jakarta.ngrok.app'],
};

export default nextConfig;
