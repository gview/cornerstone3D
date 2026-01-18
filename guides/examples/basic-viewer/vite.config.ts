import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // CommonJS 插件用于支持 dicom-parser 等 CommonJS 模块
    viteCommonjs(),
  ],
  optimizeDeps: {
    // 排除 dicom-image-loader，避免预优化问题
    exclude: ['@cornerstonejs/dicom-image-loader'],
    // 显式包含需要优化的依赖
    include: ['dicom-parser'],
  },
  worker: {
    // Worker 格式设置为 ES
    format: 'es',
  },
  server: {
    port: 5173,
    strictPort: false,
    open: true,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 Cornerstone3D 相关包打包到单独的 chunk
          'cornerstone-vendor': [
            '@cornerstonejs/core',
            '@cornerstonejs/tools',
            '@cornerstonejs/dicom-image-loader',
          ],
          // 将 React 相关包打包到单独的 chunk
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
});
