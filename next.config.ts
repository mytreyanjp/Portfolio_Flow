
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    // Allow images from all domains - useful for development if your image sources vary
    // For production, you might want to restrict this to known domains.
    // This line is being added to support local images from /public if needed
    // However, `next/image` with local src like `/photos/mytreyan.jpg` doesn't require this.
    // It's more for when you use an external domain not covered by remotePatterns.
    // Since the image is local, this line might not be strictly necessary for `/photos/mytreyan.jpg`,
    // but it's harmless for local images and good to know if you use other external sources.
    // For now, since `/photos/mytreyan.jpg` is a local public path, next/image handles it by default.
    // No changes strictly needed here for the local image.
    // The remotePatterns is for external URLs.
  },
};

export default nextConfig;
