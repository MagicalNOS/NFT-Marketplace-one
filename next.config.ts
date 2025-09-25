/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
        port: '',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        port: '',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
        port: '',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'dweb.link',
        port: '',
        pathname: '/ipfs/**',
      },
      // 添加其他可能的IPFS网关
      {
        protocol: 'https',
        hostname: '**.ipfs.dweb.link',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.ipfs.cf-ipfs.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
}

module.exports = nextConfig