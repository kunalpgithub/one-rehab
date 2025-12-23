/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: true,
  // Explicitly set the root to avoid lockfile detection issues
  outputFileTracingRoot: path.resolve(__dirname),
}

module.exports = nextConfig
