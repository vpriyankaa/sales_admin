/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true, // ✅ needed for your server actions
  },
};

module.exports = nextConfig;
