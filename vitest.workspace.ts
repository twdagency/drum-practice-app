import { defineWorkspace } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineWorkspace([
  {
    plugins: [react()],
    test: {
      include: ['**/*.{test,spec}.{ts,tsx}'],
      name: 'unit',
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./vitest.setup.ts'],
      exclude: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.next/**',
        '**/dist/**',
        '**/coverage/**',
      ],
      // Suppress unhandled errors from dependencies (these are warnings from jsdom deps)
      onUnhandledError: (error) => {
        // Ignore webidl-conversions errors (known issue with jsdom)
        if (error?.message?.includes('webidl-conversions') || 
            error?.message?.includes('whatwg-url')) {
          return;
        }
        throw error;
      },
      server: {
        deps: {
          inline: ['@testing-library/react', '@testing-library/jest-dom'],
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
    esbuild: {
      target: 'node18',
    },
  },
]);
