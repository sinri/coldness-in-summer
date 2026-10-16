const W=640,H=480,PW=100,PY=445,R=6;
export const BALL_SPEED=Math.hypot(150,240),PADDLE_SPEED=420;
export function newGame(random=Math.random){
 const bricks=[];
 for(let row=0;row<6;row++)for(let col=0;col<10;col++)if(random()>.23)bricks.push({x:16+col*61,y:55+row*25,w:56,h:18,row});
 if(!bricks.length)bricks.push({x:292,y:55,w:56,h:18,row:0});
 return {bricks,paddle:270,x:320,y:PY-12,vx:150,vy:-240,score:0,lives:3,status:'ready'};
}
export function step(g,dt,direction=0,target=null){
 const movePaddle=d=>{const delta=target===null?Math.sign(direction)*PADDLE_SPEED*d:Math.sign(target-g.paddle)*Math.min(Math.abs(target-g.paddle),PADDLE_SPEED*d);g.paddle=Math.max(0,Math.min(W-PW,g.paddle+delta))};
 if(g.status==='ready'){movePaddle(dt);g.x=g.paddle+PW/2;g.y=PY-12;return}
 if(g.status!=='playing')return;
 const velocity=Math.hypot(g.vx,g.vy);if(velocity>0){g.vx=g.vx/velocity*BALL_SPEED;g.vy=g.vy/velocity*BALL_SPEED}
 // Small fixed substeps prevent tunnelling through thin bricks.
 const n=Math.ceil(dt/.004);for(let i=0;i<n&&g.status==='playing';i++){
 const d=dt/n,ox=g.x,oy=g.y;movePaddle(d);g.x+=g.vx*d;g.y+=g.vy*d;
 if(g.x<R){g.x=R;g.vx=Math.abs(g.vx)}if(g.x>W-R){g.x=W-R;g.vx=-Math.abs(g.vx)}if(g.y<R){g.y=R;g.vy=Math.abs(g.vy)}
 if(g.vy>0&&oy+R<=PY&&g.y+R>=PY&&g.x>=g.paddle-R&&g.x<=g.paddle+PW+R){g.y=PY-R;const offset=Math.max(-1,Math.min(1,(g.x-g.paddle-PW/2)/(PW/2))),speed=BALL_SPEED;g.vx=Math.sin(offset*1.05)*speed;g.vy=-Math.cos(offset*1.05)*speed}
 for(let b=0;b<g.bricks.length;b++){const brick=g.bricks[b];if(g.x+R>=brick.x&&g.x-R<=brick.x+brick.w&&g.y+R>=brick.y&&g.y-R<=brick.y+brick.h){if(ox+R<=brick.x){g.x=brick.x-R;g.vx=-Math.abs(g.vx)}else if(ox-R>=brick.x+brick.w){g.x=brick.x+brick.w+R;g.vx=Math.abs(g.vx)}else if(oy+R<=brick.y){g.y=brick.y-R;g.vy=-Math.abs(g.vy)}else{g.y=brick.y+brick.h+R;g.vy=Math.abs(g.vy)}g.bricks.splice(b,1);g.score+=10;if(!g.bricks.length)g.status='won';break}}
 if(g.y>H+R){g.lives--;g.status=g.lives?'ready':'lost';g.vx=150;g.vy=-240}
 }
}
export function mount({container}){
 container.classList.add('breakout-surface');
 const hud=document.createElement('div');hud.className='breakout-hud';const area=document.createElement('div');area.className='breakout-area';const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;canvas.setAttribute('aria-label','打砖块游戏，左右键移动挡板，空格发球或暂停');area.append(canvas);
 const controls=document.createElement('div');controls.className='breakout-controls';const launch=document.createElement('button');launch.textContent='发球 / 暂停';const restart=document.createElement('button');restart.textContent='重新开局';const hint=document.createElement('span');hint.textContent='← → 移动 · Space 发球/暂停 · 拖动挡板';controls.append(launch,restart,hint);container.append(hud,area,controls);
 const background=document.createElement('canvas');background.width=W;background.height=H;const bg=background.getContext('2d');bg.fillStyle='#071321';bg.fillRect(0,0,W,H);bg.strokeStyle='#18334d';for(let x=0;x<W;x+=32){bg.beginPath();bg.moveTo(x,0);bg.lineTo(x,H);bg.stroke()}for(let y=0;y<H;y+=32){bg.beginPath();bg.moveTo(0,y);bg.lineTo(W,y);bg.stroke()}
 const ctx=canvas.getContext('2d');let game=newGame(),keys=new Set(),touchDirections=new Map(),last=0,accumulator=0,raf,dragging=false,dragTarget=null;
 function toggle(){if(game.status==='ready'||game.status==='paused')game.status='playing';else if(game.status==='playing')game.status='paused'}
 launch.onclick=()=>{toggle();container.focus()};restart.onclick=()=>{game=newGame();container.focus()};
 function keydown(e){if(e.isComposing)return;if(['ArrowLeft','ArrowRight',' '].includes(e.key)){e.preventDefault();if(e.key===' '){if(!e.repeat)toggle()}else keys.add(e.key)}}
 function keyup(e){keys.delete(e.key)}
 function blur(){keys.clear();touchDirections.clear();dragging=false;dragTarget=null;accumulator=0;last=0;if(game.status==='playing')game.status='paused'}
 function visibility(){if(document.hidden)blur()}
 container.addEventListener('keydown',keydown);container.addEventListener('keyup',keyup);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);
 const movement=document.createElement('div');movement.className='breakout-movement';movement.setAttribute('aria-label','按住移动挡板');const disposers=[];
 for(const [label,direction] of [['◀ 左',-1],['右 ▶',1]]){const button=document.createElement('button');button.type='button';button.textContent=label;button.setAttribute('aria-label',direction<0?'按住向左移动':'按住向右移动');
  const press=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);touchDirections.set(e.pointerId,direction);container.focus({preventScroll:true});button.classList.add('held')};
  const release=e=>{touchDirections.delete(e.pointerId);button.classList.remove('held')};
  button.addEventListener('pointerdown',press);for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,release);
  disposers.push(()=>{button.removeEventListener('pointerdown',press);for(const type of ['pointerup','pointercancel','lostpointercapture'])button.removeEventListener(type,release)});movement.append(button);
 }controls.before(movement);
 function move(e){const rect=canvas.getBoundingClientRect();dragTarget=Math.max(0,Math.min(W-PW,(e.clientX-rect.left)/rect.width*W-PW/2))}
 function down(e){touchDirections.clear();dragging=true;canvas.setPointerCapture(e.pointerId);move(e);container.focus();e.preventDefault()}
 function motion(e){if(dragging)move(e)}function up(){dragging=false;dragTarget=null}
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',motion);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
 function draw(t){const elapsed=last?(t-last)/1000:0;if(elapsed>.25){blur()}const dt=Math.min(elapsed,.25);last=t;accumulator+=dt;const fixed=1/120;while(accumulator>=fixed){step(game,fixed,dragging?0:Math.sign(Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft'))+[...touchDirections.values()].reduce((a,b)=>a+b,0)),dragging?dragTarget:null);accumulator-=fixed}
 ctx.drawImage(background,0,0);
 for(const b of game.bricks){ctx.fillStyle=['#a8dcff','#80c7fa','#64b0e9','#4a94cb','#3877a9','#2e6089'][b.row];ctx.fillRect(b.x,b.y,b.w,b.h);ctx.fillStyle='#d5efff50';ctx.fillRect(b.x,b.y,b.w,2)}
 ctx.fillStyle='#c3e7ff';ctx.shadowColor='#6ebaff';ctx.shadowBlur=8;ctx.fillRect(game.paddle,PY,PW,10);ctx.beginPath();ctx.arc(game.x,game.y,R,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 const status=`BREAKOUT / SCORE ${String(game.score).padStart(4,'0')} / LIVES ${game.lives} / BRICKS ${game.bricks.length}`;if(hud.textContent!==status)hud.textContent=status;
 const message={ready:'SPACE / 点击发球',paused:'PAUSED',won:'ALL CLEAR · 重新开局',lost:'GAME OVER · 重新开局'}[game.status];if(message){ctx.fillStyle='#071321dd';ctx.fillRect(0,205,W,65);ctx.fillStyle='#c3e7ff';ctx.font='22px monospace';ctx.textAlign='center';ctx.fillText(message,W/2,245)}
 raf=requestAnimationFrame(draw);
 }
 raf=requestAnimationFrame(draw);
 return ()=>{cancelAnimationFrame(raf);keys.clear();touchDirections.clear();disposers.forEach(dispose=>dispose());container.removeEventListener('keydown',keydown);container.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',motion);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);container.classList.remove('breakout-surface')};
}
