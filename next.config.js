/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        'pdf-parse': false,
        'node:fs/promises': false,
      }
    }
    return config
  },
  images: {
    domains: ['images.unsplash.com', 'boop-minioboop.dpbdp1.easypanel.host'],
  },
}

module.exports = nextConfig 