import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { compression } from 'vite-plugin-compression2'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production'
  const base = env.VITE_BASE_URL || '/'
  const apiBase = env.VITE_API_BASE || '/api'
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:4000'
  const useGzip = env.COMPRESS_ASSETS !== 'false'

  return {
    base,
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@shared': resolve(__dirname, 'shared'),
      },
    },
    plugins: [
      tsconfigPaths(),
      react({
        babel: {
          plugins: mode === 'development' ? ['react-dev-locator'] : [],
        },
      }),
      useGzip && isProd && compression({
        algorithm: 'gzip',
        threshold: 1024,
        ext: '.gz',
        deleteOriginFile: false,
      }),
      useGzip && isProd && compression({
        algorithm: 'brotliCompress',
        threshold: 1024,
        ext: '.br',
        deleteOriginFile: false,
      }),
    ].filter(Boolean),
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: false,
      open: false,
      cors: true,
      proxy: {
        [apiBase]: {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (_proxyReq, req) => {
              // console.log('[proxy]', req.method, req.url)
            })
          },
        },
        '/health': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
      cors: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: isProd ? 'hidden' : true,
      target: 'es2020',
      minify: 'esbuild',
      cssMinify: 'esbuild',
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'state-ui': ['zustand', 'clsx', 'tailwind-merge', 'lucide-react'],
            'math-katex': ['react-katex', 'katex'],
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/app-[hash].js',
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || ''
            if (/\.(png|jpe?g|svg|gif|webp|ico)$/i.test(name)) return 'assets/img/[name]-[hash][extname]'
            if (/\.(woff2?|ttf|eot|otf)$/i.test(name)) return 'assets/fonts/[name]-[hash][extname]'
            if (/\.css$/i.test(name)) return 'assets/css/[name]-[hash][extname]'
            return 'assets/[name]-[hash][extname]'
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'zustand', 'lucide-react', 'react-katex'],
      exclude: [],
    },
    esbuild: {
      drop: isProd ? ['console', 'debugger'] : [],
      legalComments: 'none',
    },
  }
})
