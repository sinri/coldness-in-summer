import {readFile,writeFile,mkdir,rm,cp,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
export const root=fileURLToPath(new URL('../',import.meta.url));
export const out=path.join(root,'dist');
async function walk(dir){const files=[];for(const entry of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())files.push(...await walk(p));else if(entry.isFile())files.push(p)}return files.sort()}
export async function build(){
 const boot=JSON.parse(await readFile(path.join(root,'content/boot.json'),'utf8'));
 const validDelay=n=>Number.isFinite(n)&&n>=0&&n<=2000;
 if(!validDelay(boot.lineDelayMs)||!Array.isArray(boot.lines)||boot.lines.length>100||boot.lines.some(l=>typeof l.text!=='string'||(l.delayMs!==undefined&&!validDelay(l.delayMs))))throw Error('content/boot.json: use lineDelayMs/delayMs between 0 and 2000, and at most 100 text lines');

 const files={},kits={};
 for(const p of await walk(path.join(root,'content/files'))){
  const ext=path.extname(p).toLowerCase(),virtual='/home/guest/'+path.relative(path.join(root,'content/files'),p).split(path.sep).join('/');
  if(ext==='.md')files[virtual]=await readFile(p,'utf8');
  else if(ext==='.kit'){
   const kit=JSON.parse(await readFile(p,'utf8'));
   if(kit.version!==1||typeof kit.title!=='string'||!kit.title.trim()||typeof kit.entry!=='string'||!/^[-a-zA-Z0-9_]+\.js$/.test(kit.entry))throw Error(`${p}: invalid kit (version:1, title and local entry required)`);
   if(kit.hideTerminalControls!==undefined&&typeof kit.hideTerminalControls!=='boolean')throw Error(`${p}: hideTerminalControls must be boolean`);
   const source=await readFile(path.join(root,'assets/tools',kit.entry),'utf8');
   if(!source.trim())throw Error(`${p}: empty tool module`);
   kits[virtual]=kit;
  }
 }
 await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});await cp(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
 for(const page of ['index.html'])await cp(path.join(root,page),path.join(out,page));
 await writeFile(path.join(out,'boot.json'),JSON.stringify(boot));
 await writeFile(path.join(out,'kits.json'),JSON.stringify(kits));
 await writeFile(path.join(out,'filesystem.json'),JSON.stringify(files));
 await writeFile(path.join(out,'.nojekyll'),'');console.log(`Built ${Object.keys(files).length} Markdown files, ${Object.keys(kits).length} kits → ${out}`);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build();
