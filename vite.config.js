import react from '@vitejs/plugin-react';

export default {
  base: '/',  // Set base to '/' for production
  plugins: [
    react(),  // Vite React plugin
    // Remove Inspect() here
  ],
};
