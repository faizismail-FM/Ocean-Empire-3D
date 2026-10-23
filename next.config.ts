import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Three.js and friends are ESM; keep them transpiled by Next for consistent output.
  transpilePackages: ["three"],
};

export default nextConfig;
