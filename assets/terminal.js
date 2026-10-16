import {markdown} from './markdown.js';
export const COMMANDS=['ls','cd','pwd','tree','find','less','view','help','clear'];
export function normalize(path,cwd='/home/guest'){
 if(path==='~'||path.startsWith('~/'))path='/home/guest'+path.slice(1);
 const parts=(path.startsWith('/')?path:cwd+'/'+path).split('/'),out=[];
 for(const part of parts){if(!part||part==='.')continue;if(part==='..')out.pop();else out.push(part)}
 return '/'+out.join('/');
}
export function createShell(files,kits={}){
 const apps=new Set(Object.keys(kits));
 const dirs=new Set(['/','/home','/home/guest']);for(const name of [...Object.keys(files),...apps]){const parts=name.split('/');parts.pop();while(parts.length){dirs.add(parts.join('/')||'/');parts.pop()}}
 let cwd='/home/guest';
 const children=path=>[...dirs,...Object.keys(files),...apps].filter(p=>p!=='/'&&p!==path&&p.slice(0,p.lastIndexOf('/'))===(path==='/'?'':path)).sort((a,b)=>Number(!dirs.has(a))-Number(!dirs.has(b))||a.localeCompare(b));
 const fail=message=>({text:message,error:true});
 return {get cwd(){return cwd},children,dirs,
 complete(value){
  const match=value.match(/^(\S+)(\s+)(.*)$/);
  if(!match){if(value.startsWith('.')||value.startsWith('/')||value.startsWith('~')){const slash=value.lastIndexOf('/'),prefix=value.slice(0,slash+1),fragment=value.slice(slash+1);return children(normalize(prefix||'.',cwd)).filter(p=>p.split('/').at(-1).startsWith(fragment)&&(dirs.has(p)||apps.has(p))).map(p=>prefix+p.split('/').at(-1)+(dirs.has(p)?'/':''))}return COMMANDS.filter(c=>c.startsWith(value))}

  const [,command,spacing,arg]=match;
  if(!['ls','cd','tree','less','view','find'].includes(command)||/\s/.test(arg))return [];
  const base=command+spacing;
  if(arg==='~')return [base+'~/'];
  if(arg==='.'||arg==='..')return [base+arg+'/'];
  const slash=arg.lastIndexOf('/'),prefix=arg.slice(0,slash+1),fragment=arg.slice(slash+1);
  return children(normalize(prefix||'.',cwd))
   .filter(p=>p.split('/').at(-1).startsWith(fragment)&&(command!=='cd'||dirs.has(p)))
   .map(p=>base+prefix+p.split('/').at(-1)+(dirs.has(p)?'/':''));
 },
 run(line){
 const tokens=line.trim().split(/\s+/),cmd=tokens.shift();if(!cmd)return {text:''};
 if(apps.has(normalize(cmd,cwd))&&(cmd.startsWith('.')||cmd.startsWith('/')||cmd.startsWith('~'))){if(tokens.length)return fail(`${cmd}: 不接受参数。`);return {app:kits[normalize(cmd,cwd)],path:normalize(cmd,cwd)}}
 if(!COMMANDS.includes(cmd))return fail(`${cmd}: command not found. 输入 help 查看可用命令。`);
 if(tokens.length>1)return fail(`${cmd}: 仅支持一个路径参数。`);
 const arg=tokens[0];if(['help','clear','pwd'].includes(cmd)&&arg)return fail(`${cmd}: 不接受参数。`);
 if(arg?.startsWith('-'))return fail(`${cmd}: 不支持选项。输入 help 查看用法。`);
 if(cmd==='clear')return {clear:true};
 if(cmd==='pwd')return {text:cwd};
 if(cmd==='help')return {text:[
 'EVERSTRAY UNIX / HELP',
 '────────────────────────────',
 '目录',
 '  ls [路径]      列出文件与目录',
 '  cd [路径]      切换目录；默认回到 ~',
 '  pwd            显示当前路径',
 '  tree [路径]    展开目录树',
 '  find [关键词]  匹配内容文件路径',
 '',
 '阅读',
 '  less <文件>    查看 Markdown 原文',
 '  view <文件>    渲染 Markdown 与图片',
 '',
 '终端',
 '  help           显示本说明',
 '  clear          清屏并恢复欢迎文字',
 '',
 '程序',
 '  ./clock.kit    启动字符时钟；q 退出',
 '',
 '试一试',
 '  ls',
 '  find poetry',
 '  view ~/README.md',
 '',
 'Tab 补全 · ↑↓ 历史',
 '阅读器：Space 翻页 · q / Esc 退出',
 '路径：/、~、.、..；不支持选项或管道。',
 '仅模拟浏览器内交互，不执行系统命令。'
 ].join('\n')};

 if(['less','view'].includes(cmd)&&!arg)return fail(`用法: ${cmd} <文件路径>`);
 if(cmd==='find')return {text:[...Object.keys(files),...apps].filter(p=>p.startsWith('/home/guest/')&&p.toLowerCase().includes((arg||'').toLowerCase())).sort().join('\n')||'没有匹配的文件路径。'};
 const path=normalize(arg||(cmd==='cd'?'~':'.'),cwd);
 if(!dirs.has(path)&&!Object.hasOwn(files,path)&&!apps.has(path))return fail(`${cmd}: ${arg}: No such file or directory`);
 if(cmd==='cd'){if(!dirs.has(path))return fail(`cd: ${arg}: Not a directory`);cwd=path;return {text:''}}
 if(['less','view'].includes(cmd)){if(apps.has(path))return fail(`${cmd}: ${arg}: executable program, use ${arg.startsWith('/')||arg.startsWith('~')||arg.startsWith('.')?arg:'./'+arg}`);if(dirs.has(path))return fail(`${cmd}: ${arg}: Is a directory`);return {text:files[path],pager:true,mode:cmd,path}}
 if(cmd==='ls'){return {items:(dirs.has(path)?children(path):[path]).map(p=>({name:p.split('/').at(-1)+(dirs.has(p)?'/':''),path:p,dir:dirs.has(p),app:apps.has(p)}))}}
 if(!dirs.has(path))return {text:path.split('/').at(-1)};
 let rows=[path===cwd?'.':path];let nd=0,nf=0;
 function visit(dir,prefix){const list=children(dir);list.forEach((p,i)=>{const last=i===list.length-1;rows.push(prefix+(last?'└── ':'├── ')+p.split('/').at(-1)+(dirs.has(p)?'/':''));if(dirs.has(p)){nd++;visit(p,prefix+(last?'    ':'│   '))}else nf++})}
 visit(path,'');rows.push(`\n${nd} directories, ${nf} files`);return {text:rows.join('\n')};
 }};
}
export async function playBoot(config,values,append,{reducedMotion=false,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){for(const line of config.lines){if(!reducedMotion)await wait(line.delayMs??config.lineDelayMs);append(line.text.replace(/\{(fileCount|commandCount)\}/g,(_,key)=>String(values[key])))}}
if(typeof document!=='undefined'){
 const localTime=document.querySelector('#local-time'),localZone=document.querySelector('#local-zone');
 const clockFormat=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 function updateClock(){const now=new Date();const code=String(now.getFullYear()-1992);document.querySelector('#copyright-year').textContent=String(now.getFullYear());document.querySelector('#year-code').textContent=code;document.querySelector('#sector-code').textContent=code;localTime.textContent=clockFormat.format(now);localTime.dateTime=now.toISOString();localZone.textContent=Intl.DateTimeFormat().resolvedOptions().timeZone||'Local time'}
 updateClock();setInterval(updateClock,1000);

 const input=document.querySelector('#command'),output=document.querySelector('#output'),form=document.querySelector('#command-form');
 let shell,bootConfig,fileCount;const history=[];let cursor=0,draft='';
 const displayPath=()=>shell.cwd==='/home/guest'?'~':shell.cwd.startsWith('/home/guest/')?'~'+shell.cwd.slice(11):shell.cwd;
 function prompt(){document.querySelector('#prompt-path').textContent=':'+displayPath()}
 function textOutput(parent,text){const pre=document.createElement('pre');pre.className='result';const pattern=/https?:\/\/[^\s<>]+/g;let start=0;for(const m of text.matchAll(pattern)){pre.append(document.createTextNode(text.slice(start,m.index)));const a=document.createElement('a');a.href=m[0];a.textContent=m[0];a.target='_blank';a.rel='noopener noreferrer';pre.append(a);start=m.index+m[0].length}pre.append(document.createTextNode(text.slice(start)));parent.append(pre);return pre}
 function execute(line){if(!shell||!line.trim())return;resetCompletion();history.push(line);cursor=history.length;draft='';const entry=document.createElement('div');entry.className='entry';const echo=document.createElement('div');echo.className='echo';const echoPrompt=document.createElement('span');echoPrompt.className='echo-prompt';for(const child of form.querySelector('label').children){const copy=child.cloneNode(true);copy.removeAttribute('id');echoPrompt.append(copy)}const echoCommand=document.createElement('span');echoCommand.className='echo-command';echoCommand.textContent=line;echo.append(echoPrompt,echoCommand);entry.append(echo);const result=shell.run(line);
 if(result.clear){output.replaceChildren();showWelcome()}else{
 if(result.items){const list=document.createElement('div');list.className='file-list';for(const item of result.items){const b=document.createElement('button');b.textContent=item.name;b.className=item.dir?'dir':'';b.addEventListener('click',()=>execute(item.app?item.path:(item.dir?'cd ':'view ')+item.path));list.append(b)}entry.append(list)}else if(result.text && !result.pager){const pre=textOutput(entry,result.text);if(result.error)pre.classList.add('error')}
 output.append(entry)}input.value='';prompt();input.focus({preventScroll:true});form.scrollIntoView({block:'nearest'});if(result.pager)openPager(result);if(result.app)openKit(result)}
 let cleanupKit=null,kitSession=0,restoreControls=null;
 function hideTerminalControls(){if(restoreControls)return;const previous=touchControls.hidden;touchControls.hidden=true;restoreControls=()=>{touchControls.hidden=previous;restoreControls=null}}

 const pager=document.createElement('dialog');pager.className='pager';pager.setAttribute('aria-label','less 分页阅读器');
 const pagerHead=document.createElement('div');pagerHead.className='pager-head';const pagerName=document.createElement('span');const close=document.createElement('button');close.textContent='退出 [q]';close.setAttribute('aria-label','退出分页阅读');pagerHead.append(pagerName,close);
 const viewport=document.createElement('div');viewport.className='pager-content';viewport.tabIndex=0;viewport.setAttribute('aria-label','文件内容');const pagerFoot=document.createElement('div');pagerFoot.className='pager-foot';const position=document.createElement('span');const prev=document.createElement('button');prev.textContent='↑ 上一页';const next=document.createElement('button');next.textContent='下一页 ↓';pagerFoot.append(position,prev,next);pager.append(pagerHead,viewport,pagerFoot);document.body.append(pager);
 function updatePosition(){const max=viewport.scrollHeight-viewport.clientHeight;position.textContent=(max<=0||viewport.scrollTop>=max-2?'(END)':Math.round(viewport.scrollTop/max*100)+'%')+' · Space 翻页 · q 退出'}
 function pageBy(direction){viewport.scrollTop+=direction*Math.max(1,viewport.clientHeight-28);updatePosition()}
 function fitPager(){const h=document.querySelector('main').getBoundingClientRect(),f=(document.querySelector('.touch-controls:not([hidden])')?.getClientRects().length?document.querySelector('.touch-controls'):document.querySelector('footer')).getBoundingClientRect(),v=window.visualViewport;pager.style.top=Math.max(0,h.top)+'px';pager.style.height=Math.max(80,Math.min(f.top,v?.height||innerHeight)-Math.max(0,h.top))+'px'}
 function openPager(result){hideTerminalControls();pager.classList.remove('kit-mode');prev.hidden=false;next.hidden=false;pagerName.textContent=result.mode+' '+result.path;pager.setAttribute('aria-label',result.mode+' 阅读器');viewport.replaceChildren();viewport.classList.toggle('markdown-view',result.mode==='view');if(result.mode==='view'){viewport.innerHTML=markdown(result.text);viewport.querySelectorAll('a').forEach(a=>{a.target='_blank';a.rel='noopener noreferrer'});viewport.querySelectorAll('img').forEach(img=>img.addEventListener('load',updatePosition))}else textOutput(viewport,result.text);fitPager();pager.showModal();viewport.scrollTop=0;viewport.focus();updatePosition()}
 window.addEventListener('resize',()=>{if(pager.open)fitPager()});
 async function openKit(result){const session=++kitSession;if(result.app.hideTerminalControls)hideTerminalControls();pager.classList.add('kit-mode');pagerName.textContent=result.path;pager.setAttribute('aria-label',result.app.title);viewport.replaceChildren();viewport.classList.remove('markdown-view');prev.hidden=true;next.hidden=true;position.textContent='RUNNING · q / Esc 退出';fitPager();pager.showModal();viewport.focus();
  try{const module=await import('./tools/'+result.app.entry);if(session!==kitSession||!pager.open)return;if(typeof module.mount!=='function')throw Error('工具模块需导出 mount');const cleanup=await module.mount({container:viewport,exit:()=>pager.close()});if(session!==kitSession||!pager.open){if(typeof cleanup==='function')cleanup();return}cleanupKit=typeof cleanup==='function'?cleanup:null}
  catch(error){if(session===kitSession&&pager.open){viewport.replaceChildren();textOutput(viewport,'程序启动失败：'+error.message)}}
 }
 pager.addEventListener('close',()=>{kitSession++;try{cleanupKit?.()}finally{cleanupKit=null;restoreControls?.();pager.classList.remove('kit-mode');viewport.classList.remove('clock-surface')}});
 close.onclick=()=>pager.close();prev.onclick=()=>pageBy(-1);next.onclick=()=>pageBy(1);viewport.addEventListener('scroll',updatePosition);window.addEventListener('resize',()=>{if(pager.open)updatePosition()});pager.addEventListener('close',()=>input.focus({preventScroll:true}));
 pager.addEventListener('keydown',e=>{if(e.key==='q'){e.preventDefault();pager.close();return}if(pager.classList.contains('kit-mode'))return;if(e.key===' '&&e.target.tagName==='BUTTON')return;let delta;switch(e.key){case ' ':case 'PageDown':delta=e.shiftKey?-1:1;break;case 'b':case 'PageUp':delta=-1;break;case 'ArrowDown':case 'j':e.preventDefault();viewport.scrollTop+=28;return;case 'ArrowUp':case 'k':e.preventDefault();viewport.scrollTop-=28;return;case 'Home':case 'g':e.preventDefault();viewport.scrollTop=0;return;case 'End':case 'G':e.preventDefault();viewport.scrollTop=viewport.scrollHeight;return;default:return}e.preventDefault();pageBy(delta)});
 document.querySelector('main').addEventListener('click',event=>{
  if(input.disabled||form.hidden||pager.open)return;
  if(event.target.closest('a,button,input,textarea,select,label'))return;
  const selection=window.getSelection();if(selection&&!selection.isCollapsed)return;
  input.focus({preventScroll:true});
 });
 form.addEventListener('submit',e=>{e.preventDefault();execute(input.value)});
 let completion=null;
 const candidates=document.createElement('div');candidates.className='completion-list';candidates.hidden=true;candidates.setAttribute('aria-label','补全候选');form.after(candidates);
 function resetCompletion(){completion=null;candidates.replaceChildren();candidates.hidden=true}
 function historyMove(direction){if(!shell||input.disabled)return;resetCompletion();if(cursor===history.length)draft=input.value;cursor=Math.max(0,Math.min(history.length,cursor+direction));input.value=cursor===history.length?draft:history[cursor];input.focus({preventScroll:true});input.setSelectionRange(input.value.length,input.value.length)}
 function selectCandidate(index){const c=completion;c.index=index;const match=c.matches[index];const value=match+(!match.endsWith('/')&&!c.suffix?' ':'');input.value=value+c.suffix;input.focus({preventScroll:true});input.setSelectionRange(value.length,value.length);candidates.querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('selected',i===index);b.setAttribute('aria-pressed',String(i===index))})}
 function completeInput(direction=1){if(!shell||input.disabled)return;input.focus({preventScroll:true});
 if(completion){selectCandidate((completion.index+direction+completion.matches.length)%completion.matches.length);return}
 const caret=input.selectionStart??input.value.length,prefix=input.value.slice(0,caret),suffix=input.value.slice(caret),matches=shell.complete(prefix);if(!matches.length)return;
 if(matches.length===1){let value=matches[0];if(!value.endsWith('/')&&!suffix)value+=' ';input.value=value+suffix;input.setSelectionRange(value.length,value.length);return}
 let common=matches[0];for(const match of matches){while(!match.startsWith(common))common=common.slice(0,-1)}
 completion={matches,suffix,index:-1};candidates.replaceChildren();candidates.hidden=false;
 matches.forEach((match,i)=>{const button=document.createElement('button');button.type='button';button.textContent=match.replace(/^\S+\s+/,'').replace(/^(.*\/)([^/]+\/?)$/,'$2');button.addEventListener('pointerdown',e=>e.preventDefault());button.addEventListener('click',()=>selectCandidate(i));candidates.append(button)});
 if(common.length>prefix.length){input.value=common+suffix;input.setSelectionRange(common.length,common.length)}else selectCandidate(direction===-1?matches.length-1:0);
 form.scrollIntoView({block:'nearest'});
 }
 input.addEventListener('input',resetCompletion);
 input.addEventListener('click',resetCompletion);
 input.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();completeInput(e.shiftKey?-1:1);return}if(e.isComposing||!shell)return;if(e.key==='Escape'){resetCompletion();return}if(e.key==='ArrowUp'){e.preventDefault();historyMove(-1)}else if(e.key==='ArrowDown'){e.preventDefault();historyMove(1)}else resetCompletion()});
 const touchControls=document.createElement('div');touchControls.className='touch-controls';touchControls.hidden=true;touchControls.setAttribute('aria-label','终端触屏操作');
 for(const [label,description,action] of [['Tab','补全命令或路径',()=>completeInput()],['↑','上一条历史',()=>historyMove(-1)],['↓','下一条历史',()=>historyMove(1)],['Enter','执行命令',()=>execute(input.value)]]){const button=document.createElement('button');button.type='button';button.textContent=label;button.setAttribute('aria-label',description);button.addEventListener('pointerdown',e=>e.preventDefault());button.addEventListener('click',action);touchControls.append(button)}document.querySelector('main').after(touchControls);
 function syncViewport(){const v=window.visualViewport;document.documentElement.style.setProperty('--app-height',(v?.height||window.innerHeight)+'px');if(pager.open)fitPager();if(document.activeElement===input)form.scrollIntoView({block:'nearest'})}
 window.visualViewport?.addEventListener('resize',syncViewport);window.addEventListener('resize',syncViewport);input.addEventListener('focus',()=>requestAnimationFrame(syncViewport));syncViewport();
 async function loadJson(url){const r=await fetch(url);if(!r.ok)throw Error(`${url}: HTTP ${r.status}`);return r.json()}
 function welcomeLine(parent,text){const el=document.createElement('div');el.className='boot-line';el.textContent=text;parent.append(el)}
 function showWelcome(){const boot=document.createElement('div');boot.className='entry boot';output.append(boot);return playBoot(bootConfig,{fileCount,commandCount:COMMANDS.length},text=>welcomeLine(boot,text),{reducedMotion:true})}
 Promise.all([loadJson('filesystem.json'),loadJson('boot.json'),loadJson('kits.json'),document.fonts.load('12px "Fusion Pixel"')]).then(async([files,config,kits])=>{shell=createShell(files,kits);bootConfig=config;fileCount=Object.keys(files).length;document.querySelector('#status').textContent='BOOTING…';const boot=document.createElement('div');boot.className='entry boot';output.append(boot);await playBoot(config,{fileCount,commandCount:COMMANDS.length},text=>welcomeLine(boot,text),{reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});document.querySelector('#status').textContent=`${COMMANDS.length} COMMANDS · FILESYSTEM MOUNTED`;input.disabled=false;form.hidden=false;touchControls.hidden=false;prompt();input.focus({preventScroll:true})}).catch(error=>{console.error(error);document.querySelector('#status').textContent='启动失败，请刷新重试。';textOutput(output,'无法加载启动配置或内容（'+error.message+'）。请刷新重试。')});
}
