import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./lib/i18n.ts');

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://localhost:4000",
    "http://127.0.0.1:4000",
    "http://100.103.246.119:4000",
  ],
};

export default withNextIntl(nextConfig);
