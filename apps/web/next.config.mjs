/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Même origine pour le navigateur : /api/* est relayé vers l'API (cookies de session en first-party).
  async rewrites() {
    // API_URL : adresse de l'API déployée (Vercel) ; par défaut l'API locale.
    const api = process.env.API_URL ?? 'http://localhost:4000';
    return [{ source: '/api/:path*', destination: `${api}/:path*` }];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;

