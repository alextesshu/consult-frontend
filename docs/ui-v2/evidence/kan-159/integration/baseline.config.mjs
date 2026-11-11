import base from '../p6/candidate.config.mjs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
if (!process.env.KAN159_BASELINE_ROOT) throw new Error('KAN159_BASELINE_ROOT must point to the detached current-dev baseline checkout');
export default { ...base, root: process.env.KAN159_BASELINE_ROOT, cacheDir: join(tmpdir(), 'kan159-dev-vite') };
