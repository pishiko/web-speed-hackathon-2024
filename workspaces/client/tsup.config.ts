import fs from 'node:fs';
import path from 'node:path';

import { pnpmWorkspaceRoot as findWorkspaceDir } from '@node-kit/pnpm-workspace-root';
import { polyfillNode } from 'esbuild-plugin-polyfill-node';
import findPackageDir from 'pkg-dir';
import { defineConfig } from 'tsup';
import type { Options } from 'tsup';

export default defineConfig(async (): Promise<Options[]> => {
  const PACKAGE_DIR = (await findPackageDir(process.cwd()))!;
  const WORKSPACE_DIR = (await findWorkspaceDir(process.cwd()))!;

  const OUTPUT_DIR = path.resolve(PACKAGE_DIR, './dist');

  const SEED_IMAGE_DIR = path.resolve(WORKSPACE_DIR, './workspaces/server/seeds/images');
  const IMAGE_PATH_LIST = fs.readdirSync(SEED_IMAGE_DIR).map((file) => `/images/${file}`);

  return [
    {
      bundle: true,
      clean: true,
      entry: {
        client: path.resolve(PACKAGE_DIR, './src/index.tsx'),
        serviceworker: path.resolve(PACKAGE_DIR, './src/serviceworker/index.ts'),
      },
      env: {
        API_URL: '',
        NODE_ENV: process.env['NODE_ENV'] || 'development',
        PATH_LIST: IMAGE_PATH_LIST.join(',') || '',
      },
      esbuildOptions(options) {
        options.define = {
          ...options.define,
          global: 'globalThis',
        };
        options.publicPath = '/';
      },
      esbuildPlugins: [
        polyfillNode({
          globals: {
            process: false,
          },
          polyfills: {
            events: true,
            fs: true,
            path: true,
          },
        }),
      ],
      format: 'iife',
      loader: {
        '.json?file': 'file',
        '.wasm': 'binary',
      },
      metafile: process.env['NODE_ENV'] === 'development',
      minify: !(process.env['NODE_ENV'] === 'development'),
      outDir: OUTPUT_DIR,
      platform: 'browser',
      shims: false,
      sourcemap: process.env['NODE_ENV'] === 'development' ? 'inline' : false,
      splitting: true,
      target: ['chrome58', 'firefox57', 'safari11', 'edge18'],
      treeshake: true,
      // 環境変数に応じて最適化レベルを調整
      dts: false, // 型定義ファイルは本番では不要
      minifyIdentifiers: !(process.env['NODE_ENV'] === 'development'), // 変数名を短縮
      minifySyntax: !(process.env['NODE_ENV'] === 'development'), // 構文を最適化
      minifyWhitespace: !(process.env['NODE_ENV'] === 'development'), // 空白を削除
      pure: process.env['NODE_ENV'] === 'development' ? [] : ['console.log', 'console.debug'], // 開発用コードを削除
    },
  ];
});
