/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.amplifyapp.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  // Enable compression
  compress: true,
  // Optimize production builds
  swcMinify: true,
  // Optimize font loading
  optimizeFonts: true,
  // Increase timeout for external requests (fonts, etc)
  experimental: {
    proxyTimeout: 180000, // 3 minutes
  },
};

module.exports = nextConfig;
