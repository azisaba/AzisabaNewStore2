import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-9eecc53a1bf442f0a63c7f7342e5f66a.r2.dev",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/sara_products/:id",
        destination: "/sara-products/:id",
        permanent: true,
      },
      {
        source: "/login",
        destination: "/?player=edit",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
