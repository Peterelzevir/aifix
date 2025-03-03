/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone', // Optimized for Netlify/Vercel deployment

  // Hapus konfigurasi yang tidak valid
  experimental: {
    // appDir sudah default di Next.js 14
    // serverActions sudah tersedia secara default
    serverComponentsExternalPackages: [], // Hapus bcryptjs karena tidak digunakan lagi
  },

  // Enhanced security headers for authentication
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      // Special headers for API routes
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' }, // Ubah ke domain spesifik di production
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },

  // Redirect configuration untuk alur autentikasi
  async redirects() {
    return [
      {
        source: '/login/success',
        destination: '/chat',
        permanent: false,
      },
      {
        source: '/register/success',
        destination: '/chat',
        permanent: false,
      },
    ];
  },

  // Compatibility untuk `jose` dan library modern
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
      };
    }
    return config;
  },

  // Disable x-powered-by header untuk keamanan
  poweredByHeader: false,
};

module.exports = nextConfig;
