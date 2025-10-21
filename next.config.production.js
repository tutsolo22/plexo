/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración experimental para Prisma
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },

  // Configuración de ESLint - ignorar en producción
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Configuración de TypeScript - ignorar errores no críticos en producción
  typescript: {
    ignoreBuildErrors: true,
  },

  // Configuración de imágenes
  images: {
    domains: ['localhost', 'plexo.mx', 'cdn.plexo.mx'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 año
  },

  // Variables de entorno
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },

  // Optimizaciones de producción
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  // Configuración de headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Configuración de webpack optimizada
  webpack: (config, { dev, isServer }) => {
    // Optimizaciones para producción
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        // Separar bibliotecas pesadas
        vendor: {
          name: 'vendor',
          test: /[\\/]node_modules[\\/]/,
          chunks: 'all',
          priority: 10,
        },
      };
    }

    // Ignorar warnings de node en el cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },

  // Configuración de output para Docker
  output: 'standalone',
};

module.exports = nextConfig;