/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React strict mode for better development experience
    reactStrictMode: true,

    // Ignore ESLint warnings during production builds
    eslint: {
        ignoreDuringBuilds: true,
    },

    // Ignore TypeScript errors during production builds (not recommended for production but useful for deployment)
    typescript: {
        ignoreBuildErrors: false, // Keep TypeScript checks
    },

    // Optimize package imports for faster builds
    experimental: {
        optimizePackageImports: ['lucide-react', 'date-fns'],
        serverActions: {
            bodySizeLimit: '50mb', // Allow up to 50MB for video uploads
        },
    },

    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'jpzcuudpoepsjawreoic.supabase.co',
                port: '',
                pathname: '/storage/v1/object/public/**',
            },
        ],
        // Optimize image loading
        deviceSizes: [640, 750, 828, 1080, 1200],
        imageSizes: [16, 32, 48, 64, 96, 128],
        formats: ['image/webp'],
        minimumCacheTTL: 60 * 60 * 24 * 30, // Cache images for 30 days
    },

    // Enable compression
    compress: true,

    // Remove X-Powered-By header
    poweredByHeader: false,

    // Optimize CSS
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },

    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin'
                    }
                ]
            },
            // Cache static assets aggressively
            {
                source: '/(.*)\\.(ico|png|jpg|jpeg|gif|svg|webp|woff|woff2)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable'
                    }
                ]
            }
        ]
    }
}

module.exports = nextConfig
