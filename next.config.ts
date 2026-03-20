import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongoose"],
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
