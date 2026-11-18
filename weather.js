/* IVY V48 — Cinematic SKY ONLY weather. One Canvas2D renderer; no WebGL or scenery. */
(()=>{'use strict';
 const root=document.getElementById('ivy-weather-scene');if(!root)return;
 const boot=performance.now();const canvas=document.createElement('canvas');
 canvas.className='ivy-natural-canvas';canvas.setAttribute('aria-hidden','true');root.prepend(canvas);
 const ctx=canvas.getContext('2d',{alpha:false,desynchronized:true});
 if(!ctx){root.dataset.ivyHq='unavailable';return}
 root.dataset.ivyNatural='canvas2d';root.dataset.ivyHq='preparing';
 document.documentElement.classList.remove('ivy-natural-boot');
 let w=0,h=0,scale=1,visible=true,raf=0,last=0,frameCount=0,first=0;
 let snapshot=read(),target={night:.7,twilight:0,cloud:.65,rain:0,snow:0,fog:0,storm:0,wind:.25};
 const current={...target};const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const mobile=window.matchMedia('(max-width: 700px)');
 function read(){try{return JSON.parse(localStorage.getItem('ivyWeatherSnapshot')||'null')}catch(_){return null}}
 const rand=n=>{const v=Math.sin(n*98.13+13.77)*43758.5453;return v-Math.floor(v)};
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 const mix=(a,b,f)=>a+(b-a)*f;
 const rgba=(r,g,b,a)=>`rgba(${r|0},${g|0},${b|0},${clamp(a)})`;
 const lerpColor=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
 const skyDay=[[37,97,160],[119,169,206],[194,217,222]];
 const skyDusk=[[52,66,120],[170,110,154],[243,178,151]];
 const skyNight=[[21,44,93],[74,104,151],[126,155,175]];
 const tiny=document.createElement('canvas');tiny.width=224;tiny.height=112;const tc=tiny.getContext('2d');
 // Soft cloud sprite is drawn ONCE and reused. No filter:blur per frame.
 if(tc){
  for(let i=0;i<13;i++){
   const x=28+rand(i*4)*169,y=24+rand(i*7)*60,r=28+rand(i*11)*43;
   const g=tc.createRadialGradient(x,y,0,x,y,r);
   g.addColorStop(0,rgba(246,249,255,.19));g.addColorStop(.45,rgba(224,236,251,.13));g.addColorStop(1,'rgba(215,233,253,0)');
   tc.fillStyle=g;tc.fillRect(x-r,y-r,r*2,r*2);
  }
 }
 const drops=Array.from({length:39},(_,i)=>({x:rand(i*7+5),y:rand(i*17+8),r:2+rand(i*13+2)*4.8,speed:.001+rand(i*31)*.005}));
 const stars=Array.from({length:39},(_,i)=>({x:rand(i*13+5),y:rand(i*11+18)*.76,r:.4+rand(i*23)*.65,a:rand(i*3+8)}));
 const flake=Array.from({length:90},(_,i)=>({x:rand(i*17+4),y:rand(i*19+2),z:rand(i*5+7)}));
 let dropletSprite=null;
 function makeDropSprite(){let d=document.createElement('canvas');d.width=d.height=48;const c=d.getContext('2d');if(!c)return d;
  let g=c.createRadialGradient(20,15,2,23,24,21);
  g.addColorStop(0,'rgba(233,249,255,.30)');g.addColorStop(.52,'rgba(181,221,247,.10)');g.addColorStop(.79,'rgba(173,207,227,.18)');g.addColorStop(1,'rgba(216,243,255,0)');
  c.fillStyle=g;c.beginPath();c.ellipse(23,23,16,20,-.12,0,Math.PI*2);c.fill();
  c.strokeStyle='rgba(235,249,255,.39)';c.lineWidth=1.1;c.beginPath();c.ellipse(23,23,14.3,18,-.12,.65,4.6);c.stroke();
  c.strokeStyle='rgba(20,49,91,.14)';c.lineWidth=1.7;c.beginPath();c.ellipse(23,23,14,18,-.12,4.3,6.0);c.stroke();
  c.fillStyle='rgba(255,255,255,.38)';c.beginPath();c.ellipse(16,12,2.5,4,-.55,0,7);c.fill();return d;
 }
 dropletSprite=makeDropSprite();
 function phase(){const raw=root.dataset.phase;const d=new Date();const hour=d.getHours()+d.getMinutes()/60;
  const night=raw==='night'?1:raw==='day'?0:raw==='dawn'||raw==='dusk'?0:hour<5.4||hour>20.4?1:hour>7.2&&hour<18.3?0:.30;
  return {night,twilight:raw==='dawn'||raw==='dusk'?1:raw==='night'||raw==='day'?0:(hour>17&&hour<21||hour>4&&hour<8)?1:0};
 }
 function refreshTarget(){let c=snapshot?.current||{};const code=Number(c.weather_code||0),mode=root.dataset.weather||'';
  const p=phase();target.night=p.night;target.twilight=p.twilight;
  target.rain=+( ['rain','drizzle','showers','sleet','storm'].includes(mode)||[51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code));
  target.snow=+(['snow','sleet'].includes(mode)||[71,73,75,77,85,86].includes(code));
  target.storm=+(mode==='storm'||code>=95);target.fog=+(mode==='fog'||code===45||code===48);
  target.cloud=mode==='clear'?.14:mode==='partly'?.43:mode==='fog'?.97:mode==='storm'?.98:mode==='cloudy'?.90:.72;
  target.wind=clamp(Number(c.wind_speed_10m||0)/75,.08,1);
 }
 refreshTarget();
 function fit(){const rect=root.getBoundingClientRect();const nw=Math.round(rect.width),nh=Math.round(rect.height);
  if(nw===w&&nh===h)return;w=nw;h=nh;
  const factor=mobile.matches?1.15:1.45;scale=Math.min(window.devicePixelRatio||1,factor);
  canvas.width=Math.max(2,Math.round(w*scale));canvas.height=Math.max(2,Math.round(h*scale));ctx.setTransform(scale,0,0,scale,0,0);
 }
 function gradient(y0,y1,stops){const g=ctx.createLinearGradient(0,y0,0,y1);stops.forEach(([s,c])=>g.addColorStop(s,c));return g}
 function softGlow(x,y,rad,rgb,alpha){const g=ctx.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,rgba(...rgb,alpha));g.addColorStop(.45,rgba(...rgb,alpha*.40));g.addColorStop(1,rgba(...rgb,0));ctx.fillStyle=g;ctx.fillRect(x-rad,y-rad,rad*2,rad*2)}
 function background(){const v=current;let palette=[];for(let i=0;i<3;i++){
  let col=lerpColor(skyDay[i],skyDusk[i],v.twilight*.84);
  col=lerpColor(col,skyNight[i],v.night*.94);
  if(v.storm>0)col=lerpColor(col,[[23,42,70],[59,74,105],[98,112,133]][i],v.storm*.39);
  palette.push(rgba(...col,1));
 }
 ctx.fillStyle=gradient(0,h,[[0,palette[0]],[.54,palette[1]],[1,palette[2]]]);ctx.fillRect(0,0,w,h);
 softGlow(w*.74,h*.39,h*.75,[235,196,189],.17*(1-v.night)+.06*v.twilight);
 softGlow(w*.42,h*.76,h*.75,[144,207,230],.13);
 }
 function skyObjects(t){const v=current,celestial=1-v.cloud*.72;
  if(v.night>.05){for(const s of stars){ctx.globalAlpha=v.night*celestial*(.18+s.a*.52)*(0.85+.15*Math.sin(t*.45+s.x*18));ctx.fillStyle='#f5f9ff';ctx.beginPath();ctx.arc(s.x*w,s.y*h,s.r,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;}
  const a=(1-v.night)*(.7+.3*v.twilight),b=v.night;
  if(a>.02){softGlow(w*.73,h*.25,h*.28,[255,227,170],a*.65);ctx.globalAlpha=a*.9;ctx.fillStyle='#ffefcd';ctx.beginPath();ctx.arc(w*.73,h*.26,Math.max(3,h*.032),0,7);ctx.fill();ctx.globalAlpha=1}
  if(b>.05){softGlow(w*.78,h*.22,h*.24,[171,210,245],b*.46);ctx.globalAlpha=b*celestial;ctx.fillStyle='#eaf4ff';ctx.beginPath();ctx.arc(w*.79,h*.20,Math.max(2,h*.028),0,7);ctx.fill();ctx.globalAlpha=1}
 }
 function aurora(t){const vis=current.night*(1-current.storm*.60)*(1-current.fog*.65);if(vis<.02)return;
  ctx.save();ctx.globalCompositeOperation='screen';for(let k=0;k<5;k++){
   let x=w*(k*.23-.05),drift=Math.sin(t*.28+k*1.8)*w*.12,bright=(.16+.04*Math.sin(t*.5+k))*vis;
   const gradient=ctx.createLinearGradient(x-w*.26,0,x+w*.26,h*.91);
   gradient.addColorStop(0,'rgba(28,218,190,0)');gradient.addColorStop(.36,k%2?rgba(138,101,235,bright):rgba(34,243,169,bright));
   gradient.addColorStop(.63,k%2?rgba(78,138,250,bright*.55):rgba(66,189,211,bright*.65));gradient.addColorStop(1,'rgba(29,183,174,0)');
   ctx.fillStyle=gradient;ctx.beginPath();ctx.moveTo(x-w*.22,-h*.28);
   ctx.bezierCurveTo(x+drift,h*.14,x-w*.16+drift,h*.39,x+w*.11,h*.92);
   ctx.lineTo(x+w*.31,h*.81);ctx.bezierCurveTo(x+w*.11+drift,h*.34,x+w*.28+drift,h*.18,x+w*.16,-h*.28);ctx.closePath();ctx.fill();
  }ctx.restore();
 }
 function clouds(t){const density=current.cloud;if(density<.02||!tc)return;const v=current;
  ctx.save();for(let layer=0;layer<3;layer++)for(let i=0;i<3;i++){
   const drift=((t*(.0013+.0005*layer)*(12+v.wind*25)+i*.47+layer*.18)%1.6)-.3;
   const size=w*(.65+.15*layer),ch=h*(.42+.07*layer);
   ctx.globalAlpha=clamp((.3+.11*layer)*density*(1-v.storm*.24));
   ctx.drawImage(tiny,drift*w-size*.24,h*(.10+layer*.24)+(i%2)*h*.08,size,ch);
  }
  ctx.globalAlpha=1;
  if(v.fog>.02){const fog=ctx.createLinearGradient(0,0,0,h);fog.addColorStop(0,rgba(205,220,235,0));fog.addColorStop(.55,rgba(215,225,237,v.fog*.23));fog.addColorStop(1,rgba(204,224,237,v.fog*.40));ctx.fillStyle=fog;ctx.fillRect(0,0,w,h)}
  ctx.restore();
 }
 function precipitation(t){const v=current,rr=v.rain,ss=v.snow,wind=v.wind;
  if(rr>.01){ctx.save();ctx.beginPath();for(let i=0;i<72;i++){
   const z=flake[i].z,x=(rand(i*13)+t*(.07+z*.08)*(1+wind*.6))%1*w;
   const y=((flake[i].y+t*(.27+z*.32))%1)*h;ctx.moveTo(x,y);ctx.lineTo(x-(2+wind*4)*(z+.3),y+8+z*15)
  }ctx.strokeStyle=rgba(221,240,254,rr*.29);ctx.lineWidth=.8;ctx.stroke();ctx.restore()}
  if(ss>.01){ctx.save();ctx.fillStyle=rgba(243,250,255,ss*.72);for(let i=0;i<60;i++){
   const z=flake[i].z,x=((flake[i].x+t*(.008+z*.012)*(1+wind*2))%1)*w;
   const y=((flake[i].y+t*(.021+z*.035))%1)*h;
   ctx.beginPath();ctx.arc(x,y,.65+z*1.45,0,Math.PI*2);ctx.fill();}ctx.restore()}
  if(v.storm>.02){const wave=Math.sin(t*1.23)+Math.sin(t*.86+2.1)*.4;
   if(wave>1.05){ctx.fillStyle=rgba(230,242,255,clamp((wave-1.05)*.65)*v.storm);ctx.fillRect(0,0,w,h)}
  }
 }
 function glass(t){const wet=Math.max(current.rain,current.snow*.15);if(wet<.03||!dropletSprite)return;
  ctx.save();for(const d of drops){const x=d.x*w,y=((d.y+t*d.speed*(.45+current.wind*.35))%1)*h;
   const s=d.r*(.75+.8*wet),alpha=(.28+.47*wet);
   ctx.globalAlpha=alpha;ctx.drawImage(dropletSprite,x-s*1.3,y-s*1.9,s*2.6,s*3.6);
   if(d.r>5&&d.y>.4&&current.rain>.65){ctx.strokeStyle=rgba(198,231,250,.09*wet);ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(x,y+s);ctx.quadraticCurveTo(x+s*.35,y+s*2,x+s*.12,y+s*3.7);ctx.stroke()}
  }ctx.globalAlpha=1;ctx.restore();
 }
 function render(now){if(!w||!h)return;const t=now/1000;
  // Continuous transitions even if a new weather snapshot arrives mid-animation.
  for(const k in target)current[k]=mix(current[k],target[k],.036);
  background();skyObjects(t);aurora(t);clouds(t);precipitation(t);glass(t);
 }
 function draw(now){raf=0;if(!visible||document.hidden||!root.isConnected)return;
  const limit=motion.matches?8:mobile.matches?24:30;
  if(now-last<1000/limit-1){raf=requestAnimationFrame(draw);return}last=now;
  try{fit();render(now);frameCount++;
   if(!first){first=performance.now();root.dataset.ivyHq='ready';window.IVY_WEATHER_BOOT={renderer:'canvas2d',startedAt:Math.round(boot),firstFrameMs:Math.round(first),shaderMs:0,webgl:false};root.dispatchEvent(new Event('ivy-hq-ready'))}
  }catch(e){root.dataset.ivyHq='error';window.IVY_WEATHER_BOOT={renderer:'canvas2d',error:String(e),shaderMs:0};console.warn('IVY sky weather:',e);return}
  raf=requestAnimationFrame(draw);
 }
 function wake(){if(!raf&&!document.hidden&&visible)raf=requestAnimationFrame(draw)}
 if(typeof IntersectionObserver==='function')new IntersectionObserver(es=>{visible=es[0]?.isIntersecting??true;if(visible)wake();else if(raf){cancelAnimationFrame(raf);raf=0}},{threshold:0}).observe(root);
 if(typeof ResizeObserver==='function')new ResizeObserver(()=>{w=0;wake()}).observe(root);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){refreshTarget();wake()}},{passive:true});
 window.addEventListener('ivy-weather-snapshot',e=>{snapshot=e.detail||read();refreshTarget();wake()},{passive:true});
 // The legacy V27 weather module dispatches its snapshot event immediately after each update.
 window.addEventListener('pageshow',()=>{snapshot=read();refreshTarget();wake()},{passive:true});
 window.IVY_WEATHER_BOOT={renderer:'canvas2d',startedAt:Math.round(boot),shaderMs:0,webgl:false};
 wake();
})();
