import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Unsplash — used for seed data product images
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Supabase Storage — where uploaded product images will live
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
