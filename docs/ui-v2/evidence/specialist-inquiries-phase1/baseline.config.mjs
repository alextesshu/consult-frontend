import base from './candidate.config.mjs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const root=process.cwd().replaceAll(String.fromCharCode(92),'/');
export default {...base,cacheDir:join(tmpdir(),'inquiries-v2/baseline-vite'),plugins:[{name:'inquiries-baseline',enforce:'pre',load(id){if(id.replaceAll(String.fromCharCode(92),'/')===root+'/src/views/SpecialistInquiriesView.vue')return execFileSync('git',['show','b2d3e3eb90562b000a6ffd2e35eeda8302d003b8:src/views/SpecialistInquiriesView.vue'],{cwd:root,encoding:'utf8'})}},...base.plugins]};
