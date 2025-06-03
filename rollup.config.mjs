import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { readFileSync } from 'fs';

const manifest = JSON.parse(readFileSync('./manifest.json', 'utf-8'));

export default {
  input: 'src/main.ts',
  output: {
    dir: '.',
    sourcemap: 'inline',
    format: 'cjs',
    entryFileNames: '[name].js',
  },
  external: ['obsidian'],
  plugins: [
    typescript(),
    resolve(),
    commonjs(),
  ],
};


// import typescript from '@rollup/plugin-typescript';
// import resolve from '@rollup/plugin-node-resolve';
// import commonjs from '@rollup/plugin-commonjs';
// import { readFileSync } from 'fs';
//
// const manifest = JSON.parse(readFileSync('./manifest.json', 'utf-8'));
//
// export default {
//   input: 'src/main.ts',
//   output: {
//     dir: '.',
//     sourcemap: 'inline',
//     format: 'cjs',
//     entryFileNames: '[name].js',
//   },
//   external: ['obsidian'],
//   plugins: [
//     typescript(),
//     resolve(),
//     commonjs(),
//   ],
// };
