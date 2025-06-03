import path from 'node:path';

import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { readFileSync } from 'fs';

const manifest = JSON.parse(readFileSync('./manifest.json', 'utf-8'));

// Load banner text
const bannerPath = path.resolve('./LICENSE.txt');
const banner = readFileSync(bannerPath, 'utf-8');

export default {
  input: 'src/main.ts',
  output: {
    dir: '.',
    sourcemap: 'inline',
    format: 'cjs',
    entryFileNames: '[name].js',
    banner: banner,
  },
  external: ['obsidian'],
  plugins: [
    typescript(),
    resolve(),
    commonjs(),
  ],
};
