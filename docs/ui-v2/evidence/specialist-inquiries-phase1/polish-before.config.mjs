import base from './candidate.config.mjs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const root=process.cwd().replaceAll(String.fromCharCode(92),'/');
const files=['src/views/SpecialistInquiriesView.vue','src/styles/inquiriesV2.css'];
export default {...base,cacheDir:join(tmpdir(),'inquiries-v2/polish-before-vite'),plugins:[{name:'inquiries-before-polish',enforce:'pre',load(id){const file=files.find(file=>id.replaceAll(String.fromCharCode(92),'/')===root+'/'+file);if(file)return execFileSync('git',['show','6395039d1795ba3a1642d923d3fd2171de3573fb:'+file],{cwd:root,encoding:'utf8'})}},...base.plugins]};
