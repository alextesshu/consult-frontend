import base from './candidate.config.mjs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.cwd().replaceAll('\\', '/');
const files = ['src/views/SignupView.vue', 'src/views/ClientSignupView.vue'];
export default {
  ...base, cacheDir: join(tmpdir(), 'kan159-vite-baseline'),
  plugins: [{ name: 'registration-baseline', enforce: 'pre', load(id) {
    const file = id.replaceAll('\\', '/').replace(root + '/', '');
    if (files.includes(file)) return execFileSync('git', ['show', 'eeafc58381858771ab4bf1ec12e85dfb873e4c15:' + file], { cwd: root, encoding: 'utf8' });
  } }, ...base.plugins],
};
