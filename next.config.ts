/** @type {import('next').NextConfig} */
const nextConfig: import("next").NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "luxurysouq.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "138184079b11a97ce7d651e44e2fd243.r2.cloudflarestorage.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn-jnbkl.nitrocdn.com",
        port: "",
        pathname: "/**",
      },
    ],
  }
};

module.exports = nextConfig;
