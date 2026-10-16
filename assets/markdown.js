const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;'}[c]));
function inline(s){return escape(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\[([^\]]+)\]\(([^\s)]+)\)/g,(_,label,url)=>/^(https?:\/\/|\.\.?\/|\/|#|assets\/)/.test(url)?`<a href="${url}">${label}</a>`:label)}
export function markdown(text){
 const result=[],para=[];let code=false,lines=[],listing=false;
 const flush=()=>{if(para.length){result.push('<p>'+inline(para.join(' '))+'</p>');para.length=0}};
 for(const line of text.split(/\r?\n/)){
  if(line.startsWith('```')){flush();if(!code){code=true;lines=[]}else{result.push('<pre><code>'+escape(lines.join('\n'))+'</code></pre>');code=false}continue}
  if(code){lines.push(line);continue}
  if(listing&&!line.startsWith('- ')){result.push('</ul>');listing=false}
  if(!line.trim()){flush();continue}
  const heading=line.match(/^(#{1,6}) (.*)/),image=line.match(/^!\[([^\]]*)\]\(([^\s)]+)\)$/);
  if(heading){flush();const n=heading[1].length;result.push(`<h${n}>${inline(heading[2])}</h${n}>`)}
  else if(line.startsWith('- ')){flush();if(!listing){result.push('<ul>');listing=true}result.push('<li>'+inline(line.slice(2))+'</li>')}
  else if(line.startsWith('> ')){flush();result.push('<blockquote>'+inline(line.slice(2))+'</blockquote>')}
  else if(image){flush();if(/^(assets\/|\.\.\/assets\/|https:\/\/)/.test(image[2]))result.push(`<img loading="lazy" alt="${escape(image[1])}" src="${escape(image[2])}">`)}
  else para.push(line);
 }
 flush();if(listing)result.push('</ul>');if(code)result.push('<pre><code>'+escape(lines.join('\n'))+'</code></pre>');return result.join('\n');
}
