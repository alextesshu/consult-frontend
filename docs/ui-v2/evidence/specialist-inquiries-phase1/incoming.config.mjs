import candidate from './candidate.config.mjs';
import baseline from './baseline.config.mjs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const root=process.cwd().replaceAll(String.fromCharCode(92),'/');
const files=['src/App.vue','src/styles/components-v2.css'];
const base=process.env.INQUIRIES_BASELINE==='true'?baseline:candidate;
export default {...base,cacheDir:join(tmpdir(),'inquiries-v2/incoming-'+(process.env.INQUIRIES_BASELINE||'candidate')),plugins:[{name:'incoming-branding-read-only',enforce:'pre',load(id){const file=id.replaceAll(String.fromCharCode(92),'/').replace(root+'/','');if(files.includes(file))return execFileSync('git',['show','6f91363f6fbed0f63d6fb181a6aa45ecffb3ba00:'+file],{cwd:root,encoding:'utf8'})}},...base.plugins]};
