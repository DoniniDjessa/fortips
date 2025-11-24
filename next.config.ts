import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Improve development stability - prevent build manifest errors
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 60 * 1000, // Increased to 60 seconds
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5, // Increased buffer
  },
  // Better file watching for Windows (prevents ENOENT errors)
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Improve file watching stability on Windows
      config.watchOptions = {
        poll: 1000, // Check for changes every second (helps with Windows file system)
        aggregateTimeout: 500, // Delay rebuild after first change
        ignored: ['**/node_modules/**', '**/.next/**', '**/.git/**'],
      };
      
      // Reduce file system errors - suppress build manifest warnings
      config.infrastructureLogging = {
        level: 'error',
      };
      
      // Handle missing files gracefully
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
