import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
  outputFileTracingIncludes: {
    "/*": ["./prisma/dev.db", "./prisma/schema.prisma"]
  },
  allowedDevOrigins: ["http://127.0.0.1:3021", "http://localhost:3021"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  }
};

export default nextConfig;
