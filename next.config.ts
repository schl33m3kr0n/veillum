import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["canvas", "onnxruntime-web", "@imgly/background-removal"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
