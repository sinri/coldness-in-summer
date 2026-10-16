// Render a circular dial on a character grid; cells are twice as tall as wide.
export function clockFrame(now=new Date()){
 const width=53,height=27,cx=26,cy=13,r=11;
 const grid=Array.from({length:height},()=>Array(width).fill(' '));
 const plot=(x,y,char)=>{x=Math.round(cx+x*2);y=Math.round(cy+y);if(grid[y]?.[x]!==undefined)grid[y][x]=char};
 for(let i=0;i<360;i+=2){const a=i*Math.PI/180;plot(Math.sin(a)*r,-Math.cos(a)*r,'.')}
 for(let i=0;i<60;i++){const a=i*Math.PI/30;plot(Math.sin(a)*r,-Math.cos(a)*r,i%5===0?'+':'.')}
 for(let i=1;i<=12;i++){const a=i*Math.PI/6,text=String(i),x=Math.round(cx+Math.sin(a)*(r-1.8)*2)-Math.floor(text.length/2),y=Math.round(cy-Math.cos(a)*(r-1.8));for(let j=0;j<text.length;j++)grid[y][x+j]=text[j]}
 const hand=(angle,length,char)=>{for(let t=.5;t<=length;t+=.17)plot(Math.sin(angle)*t,-Math.cos(angle)*t,char)};
 hand((now.getHours()%12+now.getMinutes()/60)*Math.PI/6,r*.48,'#');
 hand((now.getMinutes()+now.getSeconds()/60)*Math.PI/30,r*.7,':');
 hand(now.getSeconds()*Math.PI/30,r*.85,'*');plot(0,0,'O');
 return grid.map(row=>row.join('')).join('\n');
}

// Kit lifecycle: mount returns cleanup, called on exit or failed startup.
export function mount({container}){
 const face=document.createElement('pre');face.className='clock-face';
 const time=document.createElement('div');time.className='clock-time';
 container.classList.add('clock-surface');container.append(face,time);
 function tick(){const now=new Date();face.textContent=clockFrame(now);time.textContent=now.toLocaleTimeString('en-GB',{hour12:false});face.style.fontSize=Math.max(6,Math.min(18,(container.clientWidth-24)/32,(container.clientHeight-70)/27))+'px'}
 tick();const timer=setInterval(tick,1000);const observer=new ResizeObserver(tick);observer.observe(container);
 return ()=>{clearInterval(timer);observer.disconnect();container.classList.remove('clock-surface')};
}
