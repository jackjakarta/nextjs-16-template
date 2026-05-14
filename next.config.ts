import { type NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  // output: 'standalone',
  // reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['your.origin.dev'],
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
