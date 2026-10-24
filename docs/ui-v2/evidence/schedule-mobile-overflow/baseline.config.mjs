import base from './candidate.config.mjs';
import {execFileSync} from 'node:child_process';
const root=process.cwd().replaceAll(String.fromCharCode(92),'/');
export default {...base,cacheDir:process.env.TEMP+'/schedule-overflow/baseline-vite',plugins:[{name:'slots-baseline',enforce:'pre',load(id){if(id.replaceAll('\\','/')===root+'/src/views/SlotsView.vue')return execFileSync('git',['show','72ddf20533f60a9dcdb883bccc640e97703bb25c:src/views/SlotsView.vue'],{cwd:root,encoding:'utf8'})}},...base.plugins]};
