import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env file from the current directory based on `mode`
  const env = loadEnv(mode, process.cwd());

  // GitHub Pages serves the site under: https://<user>.github.io/<repo>/
  // so we need a non-root base path in production builds.
  const base = mode === 'production' ? '/the_TrialDungen/' : '/';

  return {
    base,
    define: {
      // Ensures the environment variable is available during the build
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
    build: {
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },
    },
    server: {
      port: 3000,
    },
    // Ensure the public directory is correctly served
    publicDir: 'public',
  };
});
