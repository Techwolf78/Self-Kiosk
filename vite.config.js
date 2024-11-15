// vite.config.js
export default {
  build: {
    chunkSizeWarningLimit: 1000, // Increase the size limit to 1MB
    rollupOptions: {
      external: ['react-router-dom'],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'; // Splitting node_modules into a vendor chunk
          }
        }
      }
    }
  }
};
