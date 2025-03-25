/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Add trailing slashes to URLs
  trailingSlash: true,
  // Ensure the application works when deployed to a subdirectory
  basePath: '',
  // Disable source maps in production
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig
