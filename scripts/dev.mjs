import {createServer} from 'node:http';
import {readFile,stat,readdir} from 'node:fs/promises';
import {watch} from 'node:fs';
import path from 'node:path';
import {root,out} from './build.mjs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execFileAsync=promisify(execFile);
async function build(){const {stdout}=await execFileAsync(process.execPath,[path.join(root,'scripts/build.mjs')]);process.stdout.write(stdout)}
const port=Number(process.env.PORT||4321);
await build();
let pending=false,running=false,timer;
async function rebuild(){if(running){pending=true;return}running=true;try{await build()}catch(e){console.error('Build failed:',e.message)}finally{running=false;if(pending){pending=false;await rebuild()}}}
// Watch source directories individually for portability on macOS and Linux.
const watchers=[];
async function watchDir(dir){watchers.push(watch(dir,()=>{clearTimeout(timer);timer=setTimeout(()=>{refreshWatchers().catch(console.error);rebuild()},150)}));for(const e of await readdir(dir,{withFileTypes:true}))if(e.isDirectory())await watchDir(path.join(dir,e.name))}
async function refreshWatchers(){for(const w of watchers)w.close();watchers.length=0;for(const name of ['assets','content','scripts'])await watchDir(path.join(root,name));for(const name of ['index.html'])watchers.push(watch(path.join(root,name),()=>{clearTimeout(timer);timer=setTimeout(rebuild,150)}))}
await refreshWatchers();
const types={'.woff2':'font/woff2','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp'};
const server=createServer(async(req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return}
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=path.resolve(out,'.'+pathname);
  if(file!==out&&!file.startsWith(out+path.sep)){res.writeHead(403);res.end();return}
  if((await stat(file)).isDirectory())file=path.join(file,'index.html');
  const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:data);
 }catch(e){res.writeHead(e instanceof URIError?400:404);res.end('Not found')}
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Port ${port} is in use. Try PORT=${port+1} npm run dev`:e.message);process.exit(1)});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port} (source changes rebuild automatically; refresh browser)`));
process.on('SIGINT',()=>{watchers.forEach(w=>w.close());server.close();process.exit(0)});
