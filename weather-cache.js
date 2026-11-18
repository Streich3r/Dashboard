/* IVY: quiet offline HQ frame, then the original animated WebGL renderer. */
(()=>{'use strict';
 const root=document.getElementById('ivy-weather-scene');if(!root)return;
 const KEY='ivyWeatherHqFrames.v1';
 const preview=document.createElement('img');preview.className='ivy-hq-still';preview.alt='';preview.decoding='async';preview.setAttribute('aria-hidden','true');
 root.prepend(preview);
 const last=()=>{try{return JSON.parse(localStorage.getItem('ivyWeatherSnapshot')||'null')}catch(_){return null}};
 const city=()=>localStorage.getItem('weatherCity')||'';
 function matches(pack){const s=last();return pack&&pack.city===city()&&Date.now()-(pack.saved||0)<18*3600000&&(!s||pack.code===undefined||pack.code===s.current?.weather_code)&&(!s||pack.day===undefined||pack.day===s.current?.is_day)&&Array.isArray(pack.frames)&&typeof pack.frames[0]==='string'&&pack.frames[0].startsWith('data:image/jpeg;base64,')&&pack.frames[0].length<150000}
 let hasStill=false,stamp=0;
 try{const pack=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('ivyWeatherHqFramesV42')||localStorage.getItem('ivyWeatherHqFramesV41')||'null');
  if(matches(pack)){stamp=pack.saved;hasStill=true;preview.src=pack.frames[0];preview.addEventListener('load',()=>root.classList.add('ivy-hq-still-visible'),{once:true});if(preview.complete&&preview.naturalWidth)root.classList.add('ivy-hq-still-visible');}
 }catch(_){}
 let lastCapture=stamp,first=0;
 function capture(gl,w,h){
  if(document.hidden||root.dataset.ivyHq==='unavailable')return;
  const now=Date.now();if(!first){first=now;return}
  if(now-first<60000||now-lastCapture<20*60*1000)return;
  const s=last();if(!s?.current||!city()||w<2||h<2||w*h>1100000)return;
  // One readback after warm-up; never a frame-by-frame buffer recorder.
  lastCapture=now;
  try{
   const pixels=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   if(gl.getError()!==gl.NO_ERROR)return;
   const full=document.createElement('canvas');full.width=w;full.height=h;
   const x=full.getContext('2d');if(!x)return;
   const rgba=x.createImageData(w,h);
   for(let y=0;y<h;y++)rgba.data.set(pixels.subarray((h-y-1)*w*4,(h-y)*w*4),y*w*4);
   x.putImageData(rgba,0,0);
   const small=document.createElement('canvas'),ww=Math.min(320,w);
   small.width=ww;small.height=Math.max(2,Math.round(ww*h/w));small.getContext('2d').drawImage(full,0,0,small.width,small.height);
   const jpg=small.toDataURL('image/jpeg',.65);
   if(jpg.length<150000)localStorage.setItem(KEY,JSON.stringify({city:city(),saved:now,code:s.current.weather_code,day:s.current.is_day,frames:[jpg]}));
  }catch(_){/* optional preview; live weather must remain usable */}
 }
 root.addEventListener('ivy-hq-ready',()=>{root.classList.remove('ivy-hq-still-visible');},{once:true});
 root.addEventListener('ivy-hq-unavailable',()=>{root.classList.remove('ivy-hq-still-visible');},{once:true});
 window.addEventListener('ivy-weather-snapshot',e=>{if(e.detail?.searchQuery&&e.detail.searchQuery!==city())root.classList.remove('ivy-hq-still-visible')});
 window.ivyHqFrameBuffer={capture,getState:()=>({cached:hasStill,frames:hasStill?1:0,lastCaptured:lastCapture})};
})();
