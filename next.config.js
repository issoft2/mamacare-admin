/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@safeborn/types", "@safeborn/api", "@safeborn/ui"],
};

module.exports = nextConfig;
