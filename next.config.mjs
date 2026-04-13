/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.31.207"],
   allowedDevOrigins: ['192.168.1.81'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
      },
      {
        protocol: "https",
        hostname: "*.fbcdn.net",
      },
    ],
  },
};


export default nextConfig;
