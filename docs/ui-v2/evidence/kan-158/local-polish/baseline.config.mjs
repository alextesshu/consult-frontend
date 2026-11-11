// Run from this worktree, at localhost:5364; baseline files are read from Git only.
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..').replaceAll('\\', '/');
const { default: vue } = await import(pathToFileURL(root + '/node_modules/@vitejs/plugin-vue/dist/index.mjs'));
const files = ['src/views/PublicProfileView.vue', 'src/styles/publicProfileV2.css', 'src/components/public-profile/PublicProfileHeroSection.vue'];
export default {
  root, cacheDir: path.resolve(process.env.TEMP, 'kan158-polish-vite-cache'),
  plugins: [{ name: 'pinned-profile-baseline', enforce: 'pre', load(id) {
    const relative = id.replaceAll('\\', '/').replace(root + '/', '');
    if (files.includes(relative)) return execFileSync('git', ['show', 'f84a3297e118559af1444d0bf06160e53c7353c5:' + relative], { cwd: root, encoding: 'utf8' });
  } }, vue()],
  define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://127.0.0.1:8000/api') },
};
