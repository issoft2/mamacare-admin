/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@mamacare/types", "@mamacare/api", "@mamacare/ui"],
};

module.exports = nextConfig;
