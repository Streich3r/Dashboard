/* IVY V41: locally cached frames from the ACTUAL WebGL engine (not an artistic substitute). */
(()=>{'use strict';
 const root=document.getElementById('ivy-weather-scene');if(!root)return;
 const KEY='ivyWeatherHqFramesV41';let frames=[],interval=0,active=false,frameIndex=0;
 const preview=document.createElement('div');preview.className='ivy-hq-cached-preview';preview.setAttribute('aria-hidden','true');
 const a=new Image(),b=new Image();a.className='ivy-hq-buffer-img active';b.className='ivy-hq-buffer-img';a.decoding='async';b.decoding='async';preview.append(a,b);root.prepend(preview);
 const last=()=>{try{return JSON.parse(localStorage.getItem('ivyWeatherSnapshot')||'null')}catch(_){return null}};
 const match=(item)=>{const s=last(),city=localStorage.getItem('weatherCity')||'';return item&&item.city===city&&(!s||!s.searchQuery||s.searchQuery===city)&&Date.now()-item.saved<18*3600000&&Array.isArray(item.frames)&&item.frames.length>0&&item.frames.every(f=>typeof f==='string'&&f.startsWith('data:image/jpeg;base64,')&&f.length<130000)};
 function stop(){if(interval){clearInterval(interval);interval=0}preview.classList.remove('ivy-hq-buffer-visible');active=false;}
 function rotate(){if(!active||frames.length<2||document.hidden)return;frameIndex=(frameIndex+1)%frames.length;const front=preview.querySelector('.active'),back=front===a?b:a;back.src=frames[frameIndex];back.classList.add('active');front.classList.remove('active')}
 try{const stored=JSON.parse(localStorage.getItem(KEY)||'null');if(match(stored)&&localStorage.getItem('ivyWeatherRenderQualityV39')!=='fast'){
    frames=stored.frames;a.src=frames[0];b.src=frames[0];active=true;root.classList.add('ivy-hq-has-buffer');
    a.onload=()=>{if(active){preview.classList.add('ivy-hq-buffer-visible');root.dataset.ivyHq='buffered';}};
    if(a.complete&&a.naturalWidth)preview.classList.add('ivy-hq-buffer-visible');
    if(frames.length>1)interval=setInterval(rotate,1600);
 }}catch(_){}
 let captureFrames=[],captureStarted=0,completedAt=0,recording=false;
 // Called only from the live WebGL draw loop after finalPass, never during boot.
 function capture(gl,width,height){
  if(document.hidden||!root.isConnected||root.dataset.ivyHq==='unavailable')return;
  const now=Date.now();if(!captureStarted){captureStarted=now;return}
  if(now-captureStarted<3200||now-completedAt<12*60*1000||recording)return;
  const s=last();if(!s||!localStorage.getItem('weatherCity'))return;
  if(captureFrames.length&&now-(captureFrames.at(-1).t)<1450)return;
  recording=true;
  try{
   const w=Math.min(320,width),h=Math.max(2,Math.round(w*height/width));
   const pixels=new Uint8Array(width*height*4);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   if(gl.getError()!==gl.NO_ERROR)throw Error('readPixels');
   const full=document.createElement('canvas');full.width=width;full.height=height;
   const x=full.getContext('2d',{willReadFrequently:false});const im=x.createImageData(width,height);
   for(let y=0;y<height;y++)im.data.set(pixels.subarray((height-y-1)*width*4,(height-y)*width*4),y*width*4);
   x.putImageData(im,0,0);
   const small=document.createElement('canvas');small.width=w;small.height=h;small.getContext('2d').drawImage(full,0,0,w,h);
   const data=small.toDataURL('image/jpeg',.64);if(data.length<130000)captureFrames.push({t:now,data});
   if(captureFrames.length>=3){const pack={city:localStorage.getItem('weatherCity'),saved:now,frames:captureFrames.map(f=>f.data)};
    try{localStorage.setItem(KEY,JSON.stringify(pack))}catch(_){/* quota: optional only */}
    captureFrames=[];completedAt=now;
   }
  }catch(_){completedAt=now;captureFrames=[]}
  finally{recording=false}
 }
 window.ivyHqFrameBuffer={capture,stop,getState:()=>({cached:active,frames:frames.length,recorded:completedAt>0})};
 root.addEventListener('ivy-hq-ready',stop,{once:true});
 root.addEventListener('ivy-hq-unavailable',()=>{stop();root.classList.remove('ivy-hq-has-buffer')},{once:true});
 window.addEventListener('ivy-weather-snapshot',e=>{if(active&&e.detail?.searchQuery&&e.detail.searchQuery!==localStorage.getItem('weatherCity')){stop();root.classList.remove('ivy-hq-has-buffer')}});
})();
