import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const LOCAL_DS = '/Users/nathandana/Sites/A1DesignSystem/packages/react/src';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  ...(mode === 'development' && {
    resolve: {
      alias: {
        '@gtivr4/a1-design-system-react': LOCAL_DS,
      },
    },
    optimizeDeps: {
      exclude: ['@gtivr4/a1-design-system-react'],
    },
  }),
}));
