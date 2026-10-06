import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // keep the repo free of generated agent-rule files
  agentRules: false,
  // Pin the workspace root so a stray lockfile higher up the tree can't confuse Turbopack.
  turbopack: { root: path.resolve(process.cwd()) },
};

export default nextConfig;
