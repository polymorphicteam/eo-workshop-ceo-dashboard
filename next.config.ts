import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Metrics are fetched on every request so the numbers are always live.
  // If a fetch is slow, add caching inside that metric's file, not here.
};

export default nextConfig;
