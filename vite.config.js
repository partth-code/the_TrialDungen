import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env file from the current directory based on `mode`
  const env = loadEnv(mode, process.cwd());

  return {
    base: "./",
    define: {
      // Ensures the environment variable is available during the build
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },
    },
    // Ensure the public directory is correctly served for your 'gemini-bot' icon
    publicDir: 'public',
  };
});