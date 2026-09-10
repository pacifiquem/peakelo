import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@peakelo/shared', '@peakelo/engine', 'chessops', '@lichess-org/chessground'],
};

export default nextConfig;
