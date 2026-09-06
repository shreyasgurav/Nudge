import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: ["coaster-faceplate-wildcat.ngrok-free.dev"],
};

export default nextConfig;
