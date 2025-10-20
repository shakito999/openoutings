import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Exclude supabase functions from build type checking
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
