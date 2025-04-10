/** @type {import('next').NextConfig} */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const nextConfig = {
    
        images: {
          remotePatterns: [
            {
              protocol: 'https',
              hostname: 'gqccwvjkpnppluglkttz.supabase.co',
              pathname: '/storage/v1/object/public/cabin-images/**',
            },
          ],
        },
        // output: 'export',
};

export default nextConfig;
