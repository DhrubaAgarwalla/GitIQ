/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['genkit'],
  },
  webpack: (config) => {
    // Handle genkit and AI-related packages
    config.externals = [...(config.externals || []), 'genkit'];
    return config;
  },
};

module.exports = nextConfig;
