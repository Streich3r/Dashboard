/* IVY V47 – lightweight, independent Canvas2D weather. No WebGL programs. */
(()=>{'use strict';
const root=document.getElementById('ivy-weather-scene');if(!root)return;
const t0=performance.now();const canvas=document.createElement('canvas');canvas.className='ivy-natural-canvas';canvas.setAttribute('aria-hidden','true');
root.prepend(canvas);const ctx=canvas.getContext('2d',{alpha:false,desynchronized:true});
if(!ctx){root.dataset.ivyHq='unavailable';return}
root.dataset.ivyNatural='canvas2d';root.dataset.ivyHq='ready';document.documentElement.classList.remove('ivy-natural-boot');
let snapshot=null,visible=true,raf=0,last=0,firstFrame=0,frames=0,scale=1,w=0,h=0;
function read(){try{return JSON.parse(localStorage.getItem('ivyWeatherSnapshot')||'null')}catch(_){return null}}
snapshot=read();
const rand=n=>{const x=Math.sin(n*91.7+15.41)*43758.55;return x-Math.floor(x)};
function gradient(x1,y1,x2,y2,stops){const g=ctx.createLinearGradient(x1,y1,x2,y2);stops.forEach(s=>g.addColorStop(s[0],s[1]));return g}
function haze(x,y,r,a){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(220,235,245,'+a+')');g.addColorStop(1,'rgba(210,224,240,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r)}
function mountain(level,amp,seed,top,bottom,detail){const c=ctx;c.beginPath();c.moveTo(0,h);for(let x=0;x<=w+5;x+=detail){const u=x/w;const jag=.52+.21*Math.sin(u*10+seed)+.12*Math.sin(u*23+seed*1.8)+.065*Math.sin(u*53+seed*2.3);c.lineTo(x,h*(level-amp*jag))}c.lineTo(w,h);c.closePath();c.fillStyle=gradient(0,h*(level-amp),0,h,[[0,top],[1,bottom]]);c.fill()}
function fit(){const width=Math.max(1,root.clientWidth),height=Math.max(1,root.clientHeight);if(width===w&&height===h)return;w=width;h=height;scale=Math.min(devicePixelRatio||1,1.4);canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));ctx.setTransform(scale,0,0,scale,0,0)}
function render(t){fit();if(w<5||h<5)return;
 const c=ctx,current=snapshot?.current||{},code=Number(current.weather_code||0);const phase=root.dataset.phase||((current.is_day===0)?'night':'day');const night=phase==='night',dusk=phase==='dawn'||phase==='dusk';
 const mode=root.dataset.weather||(code>=95?'storm':code>=71&&code<=86?'snow':code>=51?'rain':'clear');
 const rain=['rain','showers','sleet','storm'].includes(mode),snow=['snow','sleet'].includes(mode),storm=mode==='storm',fog=mode==='fog';
 c.fillStyle=gradient(0,0,0,h,night?[[0,'#1c3558'],[.55,'#617f99'],[1,'#afbdba']]:dusk?[[0,'#3b456f'],[.55,'#ce8b86'],[1,'#e3c3aa']]:[[0,'#397db6'],[.55,'#a0c6d5'],[1,'#dce0d5']]);c.fillRect(0,0,w,h);
 const sx=w*.76,sy=h*(night?.19:dusk?.48:.29);let glow=c.createRadialGradient(sx,sy,1,sx,sy,h*.45);glow.addColorStop(0,night?'rgba(201,224,247,.23)':'rgba(255,235,175,.54)');glow.addColorStop(1,'rgba(255,238,180,0)');c.fillStyle=glow;c.fillRect(0,0,w,h);
 if(night){c.globalCompositeOperation='screen';for(let k=0;k<4;k++){const x=w*(k*.28+.04),shift=Math.sin(t*.00023+k)*w*.05;const g=gradient(x-w*.2,0,x+w*.3,h*.65,[[0,'rgba(18,218,151,0)'],[.45,k%2?'rgba(133,119,229,.16)':'rgba(24,220,166,.22)'],[1,'rgba(18,218,151,0)']]);c.fillStyle=g;c.beginPath();c.moveTo(x-w*.18,-10);c.bezierCurveTo(x+shift,h*.20,x-w*.1,h*.35,x+w*.1,h*.68);c.lineTo(x+w*.24,h*.64);c.bezierCurveTo(x+w*.13+shift,h*.33,x+w*.25,h*.16,x+w*.15,-10);c.closePath();c.fill()}c.globalCompositeOperation='source-over';}
 c.fillStyle=night?'#e3effa':'#fff1c8';c.beginPath();c.arc(sx,sy,h*(night?.028:.039),0,Math.PI*2);c.fill();
 mountain(.69,.54,1.1,night?'#a0b1c2':'#bdcbd0','#6e8798',3);if(fog)haze(w*.4,h*.61,w*.65,.3);
 mountain(.81,.44,2.7,night?'#78979f':'#8baba6','#40656f',4);haze(w*.55,h*.72,w*.52,.17);
 mountain(.99,.31,4.6,night?'#527a76':'#64886e','#1f4449',5);
 c.beginPath();c.moveTo(w*.46,h*.75);c.bezierCurveTo(w*.63,h*.81,w*.30,h*.91,w*.38,h);c.lineTo(w*.72,h);c.bezierCurveTo(w*.44,h*.92,w*.70,h*.83,w*.51,h*.75);c.closePath();c.fillStyle=gradient(0,h*.76,0,h,[[0,night?'#b1cfd0':'#d4e3db'],[1,night?'#426c82':'#478596']]);c.fill();
 if(mode!=='clear'){for(let i=0;i<5;i++){const x=(((rand(i*8)+t*.000009*(1+Number(current.wind_speed_10m||0)/35))%1.35)-.18)*w;haze(x,h*(.18+.075*i),w*.30,storm?.28:.17)}}
 const n=Math.floor((rain?83:snow?58:0)*(1+Math.min(1,Number(current.precipitation||0)/5)));
 if(n){c.beginPath();for(let i=0;i<n;i++){const z=rand(i*3+7),x=((rand(i*13)+t*(rain?.00007:.000012)*(z+.5))%1)*w,y=((rand(i*19)+t*(rain?.00022:.000035)*(z+.3))%1)*h;if(rain){c.moveTo(x,y);c.lineTo(x-2-z*3,y+7+z*12)}else{c.moveTo(x,y);c.arc(x,y,1.1+z*1.5,0,Math.PI*2)}}c.strokeStyle='rgba(232,245,255,.43)';c.fillStyle='rgba(243,250,255,.75)';c.lineWidth=.75;if(rain)c.stroke();else c.fill()}
 // Weathered glass surface: optical droplet contours only, no artificial mirror reflections.
 if(rain){for(let i=0;i<23;i++){const z=rand(i*5+3),r=1.4+z*3.6,x=rand(i*11+2)*w,y=((rand(i*17+8)+t*.000004*(z+.1))%1)*h;const gg=c.createRadialGradient(x-r*.25,y-r*.30,.2,x,y,r*1.5);gg.addColorStop(0,'rgba(236,248,255,.13)');gg.addColorStop(.7,'rgba(190,221,235,.035)');gg.addColorStop(1,'rgba(190,221,235,0)');c.fillStyle=gg;c.beginPath();c.ellipse(x,y,r*.72,r*1.2,0,0,Math.PI*2);c.fill();c.strokeStyle='rgba(224,244,253,.20)';c.lineWidth=.65;c.stroke()}}
 if(storm&&Math.sin(t*.0031)>.997){c.fillStyle='rgba(235,245,255,.25)';c.fillRect(0,0,w,h)}
}
function draw(now){raf=0;if(!visible||document.hidden||!root.isConnected)return; if(now-last<50){raf=requestAnimationFrame(draw);return}last=now;try{render(now);frames++;if(!firstFrame){firstFrame=performance.now();window.IVY_WEATHER_BOOT={renderer:'canvas2d',firstFrameMs:Math.round(firstFrame),shaderMs:0,webgl:false};root.dispatchEvent(new Event('ivy-hq-ready'))}}catch(e){root.dataset.ivyHq='error';window.IVY_WEATHER_BOOT={renderer:'canvas2d',error:String(e)};console.warn('Weather canvas:',e);return}raf=requestAnimationFrame(draw)}
function wake(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(draw)}
const observer=new IntersectionObserver(es=>{visible=es[0]?.isIntersecting??true;if(visible)wake();else if(raf){cancelAnimationFrame(raf);raf=0}},{threshold:0});observer.observe(root);
if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>wake()).observe(root);
document.addEventListener('visibilitychange',wake,{passive:true});window.addEventListener('ivy-weather-snapshot',e=>{snapshot=e.detail||read();wake()},{passive:true});
window.IVY_WEATHER_BOOT={renderer:'canvas2d',startedAt:Math.round(t0),shaderMs:0,webgl:false};wake();
})();
