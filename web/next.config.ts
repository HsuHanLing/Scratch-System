import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo: lockfile at repo root + app in web/ — trace files from repo root
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
