import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The Frappe file host is served straight to the browser: the edge image
    // optimizer cannot detect the content type of those files.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "pf.digigalaxy.cloud",
      },
      {
        protocol: "https",
        hostname: "digigalaxy.cloud",
      },
    ],
  },
};

export default nextConfig;
