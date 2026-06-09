import postcssGlobalData from '@csstools/postcss-global-data';
import postcssCustomMedia from 'postcss-custom-media';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  plugins: [
    postcssGlobalData({
      files: [
        resolve(__dirname, 'node_modules/@gtivr4/a1-design-system-react/src/breakpoints.css'),
      ],
    }),
    postcssCustomMedia(),
  ],
};
