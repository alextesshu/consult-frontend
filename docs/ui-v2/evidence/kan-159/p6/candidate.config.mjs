import base from '../../../../../vite.config.ts';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export default {
  ...base, root: process.cwd(), cacheDir: join(tmpdir(), 'kan159-vite-candidate'),
  define: { ...base.define, 'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://127.0.0.1:8000/api') },
};
