import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Next가 workspace root를 /Users/jaeheon 쪽으로 잘못 추론하는 문제를 방지
    root: __dirname,
  },
};

export default nextConfig;
