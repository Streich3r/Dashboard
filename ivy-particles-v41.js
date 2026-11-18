/* IVY V40 – immediate offline particle background, no weather dependency. */
(() => {
 'use strict';
 const canvas = document.getElementById('ivy-particles-canvas');
 if (!canvas) return;
 const ctx = canvas.getContext('2d',{alpha:false,desynchronized:true});
 if (!ctx) return;
 const isCoarse=matchMedia('(pointer:coarse)').matches;
 const lowPower=(navigator.hardwareConcurrency||4)<=4;
 const reduce=matchMedia('(prefers-reduced-motion:reduce)');
 const cfg={count:isCoarse?42:70, distance:isCoarse?116:145, speed:20, dprCap:isCoarse?1:1.25};
 let W=1,H=1,D=1,pts=[],sprites=[],raf=0,prev=0,lastPaint=0,paused=false,warmed=false;
 const fps=(isCoarse||lowPower)?18:24;
 const colors=[[34,221,255],[72,121,255],[164,72,255],[224,81,255]];
 const rnd=(a,b)=>a+Math.random()*(b-a);
 // Render radial glows only once, then reuse cached sprites for every frame.
 function makeSprites(){
   sprites=colors.map(([r,g,b])=>{
     const c=document.createElement('canvas');c.width=c.height=64;
     const g2=c.getContext('2d');const grad=g2.createRadialGradient(32,32,0,32,32,32);
     grad.addColorStop(0,`rgba(${r},${g},${b},1)`);
     grad.addColorStop(.10,`rgba(${r},${g},${b},.95)`);
     grad.addColorStop(.20,`rgba(${r},${g},${b},.28)`);
     grad.addColorStop(1,`rgba(${r},${g},${b},0)`);
     g2.fillStyle=grad;g2.fillRect(0,0,64,64);
     return c;
   });
 }
 function resize(){
   const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);
   const d=Math.min(devicePixelRatio||1,cfg.dprCap);
   if(w===W&&h===H&&d===D)return;
   const ow=W,oh=H;W=w;H=h;D=d;
   canvas.width=Math.round(W*D);canvas.height=Math.round(H*D);
   ctx.setTransform(D,0,0,D,0,0);
   pts.forEach(p=>{p.x*=W/ow;p.y*=H/oh});
   const count=Math.min(cfg.count,Math.max(32,Math.round(w*h/13500)));
   while(pts.length<count)pts.push({x:rnd(0,W),y:rnd(0,H),vx:rnd(-1,1),vy:rnd(-1,1),r:rnd(1,2.5),ci:Math.floor(rnd(0,4)),phase:rnd(0,6.283)});
   pts.length=count;
 }
 const touch={x:-10000,y:-10000,on:false};
 addEventListener('pointermove',e=>{if(e.pointerType==='touch' && e.buttons===0)return;touch.x=e.clientX;touch.y=e.clientY;touch.on=true},{passive:true});
 addEventListener('pointerleave',()=>{touch.on=false},{passive:true});
 function draw(t){
   if(paused||document.hidden){raf=0;return;}
   raf=requestAnimationFrame(draw);
   if(lastPaint && t-lastPaint < 1000/(reduce.matches?8:fps))return;
   lastPaint=t;
   // Conservative frame budget; animation speed is time-based.
   let dt=prev?Math.min((t-prev)/1000,.048):1/60;prev=t;
   if(dt<.001)return;
   ctx.fillStyle='#02030a';ctx.fillRect(0,0,W,H);
   const move=reduce.matches?0:cfg.speed;
   for(const p of pts){
      p.x+=p.vx*move*dt;p.y+=p.vy*move*dt;
      if(p.x<-12)p.x=W+12;else if(p.x>W+12)p.x=-12;
      if(p.y<-12)p.y=H+12;else if(p.y>H+12)p.y=-12;
      if(touch.on&&!reduce.matches){const dx=p.x-touch.x,dy=p.y-touch.y,d2=dx*dx+dy*dy;if(d2<12000&&d2>1){const f=27*dt*(1-d2/12000)/Math.sqrt(d2);p.x+=dx*f;p.y+=dy*f}}
   }
   // Low-cost spatial grid avoids all-pairs scans on large screens.
   const cell=cfg.distance,grid=new Map();
   for(let i=0;i<pts.length;i++){
     const p=pts[i],cx=Math.floor(p.x/cell),cy=Math.floor(p.y/cell);p.gx=cx;p.gy=cy;
     const k=cx+','+cy;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(i);
   }
   ctx.lineWidth=.7;
   for(let i=0;i<pts.length;i++){
     const a=pts[i];
     for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){
       const candidates=grid.get((a.gx+ox)+','+(a.gy+oy));if(!candidates)continue;
       for(const j of candidates){if(j<=i)continue;const b=pts[j],dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy;if(d2>cell*cell)continue;
         const alpha=.22*(1-Math.sqrt(d2)/cell);
         const [r,g,bb]=colors[(a.ci+b.ci)>>1];
         ctx.strokeStyle=`rgba(${r},${g},${bb},${alpha.toFixed(3)})`;
         ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
       }
     }
   }
   for(const p of pts){
      const pulse=.83+.17*Math.sin(t*.0015+p.phase);
      const radius=p.r*11;
      ctx.globalAlpha=pulse;ctx.drawImage(sprites[p.ci],p.x-radius,p.y-radius,2*radius,2*radius);
   }
   ctx.globalAlpha=1;
 }
 function start(){if(!warmed||document.hidden)return;paused=false;if(!raf){prev=0;raf=requestAnimationFrame(draw)}}
 document.addEventListener('visibilitychange',()=>{if(document.hidden){paused=true;cancelAnimationFrame(raf);raf=0}else start()});
 addEventListener('resize',()=>resize(),{passive:true});
 addEventListener('pagehide',()=>{paused=true;cancelAnimationFrame(raf);raf=0});
 addEventListener('pageshow',()=>start());
 // Runs as an independent, tiny deferred file BEFORE the main dashboard application.
 // Draw the first frame immediately; no DOMContentLoaded + 750 ms artificial delay.
 const warmup=()=>{makeSprites();warmed=true;resize();if(!document.hidden){paused=false;draw(performance.now());}};
 warmup();
 window.IVY_PARTICLES={readyAt:performance.now(),pause(){paused=true;cancelAnimationFrame(raf);raf=0},resume:start,stats:()=>({particles:pts.length,width:W,height:H,dpr:D})};
})();
