import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  // 生產環境 build 設定
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // 提高警告門檻，因為 antd 核心本身就約 788 KB（無法再縮減）
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // 手動分割 chunks，優化載入效能
        manualChunks: {
          // Ant Design UI 組件（最大的依賴）
          'antd': ['antd'],
          // Ant Design 圖標分離（按需加載效果更好）
          'antd-icons': ['@ant-design/icons'],
          // React 相關庫分離
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
