import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui", "@pacepilot/core", "@pacepilot/db"],
}

export default nextConfig
