/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Allow Canva, Google Slides, YouTube, Excalidraw to be embedded via iframe
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob: https:",
              "connect-src 'self' https: wss:",
              // Allow these services to be embedded in iframes inside our app
              "frame-src 'self' https://www.canva.com https://canva.com https://docs.google.com https://www.youtube.com https://excalidraw.com https://witeboard.com https://www.figma.com blob:",
              "worker-src 'self' blob:",
            ].join('; '),
          },
          // Grant clipboard-write and other permissions to iframes so Canva can load
          {
            key: 'Permissions-Policy',
            value: 'clipboard-write=*, fullscreen=*, autoplay=*, web-share=*',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
