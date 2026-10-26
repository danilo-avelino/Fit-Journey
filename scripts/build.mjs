import { build } from 'esbuild';
import { build as buildRenderer } from 'vite';

export async function buildMain() {
  await build({
    entryPoints: ['src/main/main.ts', 'src/main/preload.ts'],
    outdir: 'dist-electron', outExtension: { '.js': '.cjs' },
    bundle: true, platform: 'node', format: 'cjs', target: 'node22',
    external: ['electron'], sourcemap: true,
  });
}

if (process.argv[1] && new URL(import.meta.url).pathname.endsWith(process.argv[1].replaceAll('\\', '/').split('/').pop())) {
  await buildMain();
  await buildRenderer();
}
