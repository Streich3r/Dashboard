/* from <script id="ivy-natural-weather-v37"> */

(()=>{'use strict';
function init(){
const root=document.getElementById('ivy-weather-scene');if(!root||root.querySelector('.ivy-natural-canvas'))return;root.dataset.ivyNatural='starting';
const canvas=document.createElement('canvas');canvas.className='ivy-natural-canvas';canvas.setAttribute('aria-hidden','true');root.prepend(canvas);
const mobileGpu=matchMedia('(pointer:coarse)').matches||Math.min(innerWidth,screen.width||innerWidth)<=600;
const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:mobileGpu?'low-power':'default',preserveDrawingBuffer:false});
if(!gl){canvas.remove();root.dataset.ivyNatural='fallback';document.documentElement.classList.remove('ivy-natural-boot');return;}
const vertexSource='attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}';
const geometrySource=`precision highp float;
uniform vec2 resolution;
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float gn(vec2 p){return noise(vec3(p.x,1.7,p.y));}
float terrainFbm(vec2 p){return gn(p)*.53+gn(p*2.03)*.26+gn(p*4.13)*.13+gn(p*8.21)*.06+gn(p*16.3)*.02;}
float riverCourse(float z){return sin(z*.13)*.75+sin(z*.037+1.)*1.3;}
float terrain(vec2 p){
float n=terrainFbm(p*.12);float crag=1.-abs(gn(p*.38)*2.-1.);
float valley=abs(p.x-riverCourse(p.y));float sides=smoothstep(1.5,15.,valley);
float mountains=sides*(1.2+n*n*14.+crag*1.1);
float distant=smoothstep(36.,100.,p.y)*(2.+pow(terrainFbm(p*.052+24.),2.)*23.);
return .13+mountains+distant+gn(p*.65)*.12*sides;
}
vec2 encodeDepth(float d){vec2 e=fract(d*vec2(1.,255.));e.x-=e.y/255.;return e;}
void main(){
vec2 xy=(gl_FragCoord.xy-.5*resolution)/resolution.y;
vec3 eye=vec3(0.,5.6,-8.),ray=normalize(vec3(xy.x,xy.y+.10,1.15));
float t=.2,previous=t;bool hit=false;vec3 pos=eye;
for(int i=0;i<125;i++){pos=eye+ray*t;float gap=pos.y-terrain(pos.xz);if(gap<.0025*t){hit=true;break;}previous=t;t+=max(.065,gap*.43);if(t>155.)break;}
if(!hit){gl_FragColor=vec4(1.,1.,.5,.5);return;}
for(int i=0;i<4;i++){float mid=(previous+t)*.5;vec3 p=eye+ray*mid;if(p.y-terrain(p.xz)>.0)previous=mid;else t=mid;}
pos=eye+ray*t;float eps=max(.035,t*.0012);vec2 e=vec2(eps,0.);
vec3 n=normalize(vec3(terrain(pos.xz-e.xy)-terrain(pos.xz+e.xy),2.*eps,terrain(pos.xz-e.yx)-terrain(pos.xz+e.yx)));
gl_FragColor=vec4(encodeDepth(min(t/160.,.999)),n.xz*.5+.5);
}
`;
const sceneSource=`precision highp float;
uniform sampler2D geometryTex;
uniform vec2 resolution,sunPosition;
uniform vec3 skyWeights;
uniform float clock,cloud,wind,rain,fog,snow,freeze,storm,flash,wetGround,drift;
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return noise(p)*.55+noise(p*2.04)*.28+noise(p*4.1)*.12+noise(p*8.2)*.05;}
float gn(vec2 p){return noise(vec3(p.x,1.7,p.y));}
float groundFbm(vec2 p){return gn(p)*.53+gn(p*2.03)*.26+gn(p*4.13)*.13+gn(p*8.21)*.06+gn(p*16.3)*.02;}
float riverCourse(float z){return sin(z*.13)*.75+sin(z*.037+1.)*1.3;}
float density(vec3 p){float profile=smoothstep(1.9,2.4,p.y)*(1.-smoothstep(3.2,5.1,p.y));p.x+=drift;p.z+=drift*.24;float mass=fbm(p*.88);return max(0.,mass-(.76-cloud*.45))*profile*3.4;}
vec3 sky(vec3 ray,vec3 top,vec3 horizon){return mix(horizon,top,pow(clamp(ray.y,0.,1.),.62));}
void main(){
vec2 uv=gl_FragCoord.xy/resolution,xy=(gl_FragCoord.xy-.5*resolution)/resolution.y;
vec3 ray=normalize(vec3(xy.x,xy.y+.10,1.15));
float day=skyWeights.x,twilight=skyWeights.y,night=skyWeights.z;
vec3 top=vec3(.16,.37,.64)*day+vec3(.14,.185,.32)*twilight+vec3(.17,.26,.42)*night;
vec3 horizon=vec3(.74,.81,.84)*day+vec3(.95,.59,.39)*twilight+vec3(.37,.46,.60)*night;
vec3 overcast=vec3(.49,.54,.58)*day+vec3(.36,.32,.34)*twilight+vec3(.23,.30,.40)*night;
float heavy=cloud*cloud*(.45+storm*.18);
top=mix(top,overcast*.63,heavy);horizon=mix(horizon,overcast,heavy*.7);
vec3 atmosphere=mix(horizon,top,.1),sunColor=vec3(1.,.94,.78)*day+vec3(1.,.66,.39)*twilight+vec3(.61,.72,.87)*night;
vec3 sunDir=normalize(vec3(sunPosition,1.));
vec4 geom=texture2D(geometryTex,uv);float distance=dot(geom.rg,vec2(1.,1./255.))*160.;
vec3 col=sky(ray,top,horizon);
float sunDot=max(0.,dot(ray,sunDir));
col+=sunColor*pow(sunDot,24.)*.20*(1.-heavy)*(1.-night*.85);
col+=sunColor*smoothstep(.99980,.99992,sunDot)*(1.-cloud*.78)*(day+twilight*.8);
vec3 moonDir=normalize(vec3(-.52,.47,1.));float moonDot=dot(ray,moonDir);
col+=vec3(.62,.71,.86)*smoothstep(.99978,.99991,moonDot)*night*(1.-heavy);
float star=hash(vec3(floor(uv*resolution*.6),7.));col+=pow(star,310.)*night*(1.-cloud)*smoothstep(.14,.5,ray.y)*.68;
// Atmospheric aurora: wide, continuously moving curtains behind the actual clouds.
// Starts during night, fades at dawn, and weakens naturally under overcast/storms.
if(night>.002&&ray.y>.04){
 float x=ray.x*3.6, y=ray.y;
 float swing=sin(x*1.2+clock*.048)*.062+sin(x*2.7-clock*.073)*.024;
 float arc=.36+swing;
 float fold=.46+.54*pow(.5+.5*sin(x*15.2+sin(x*4.5-clock*.06)*2.+clock*.115),2.);
 float bandA=exp(-pow((y-arc)*11.5,2.));
 float bandB=exp(-pow((y-(arc+.115+sin(x*2.3+clock*.03)*.035))*14.,2.));
 float veil=exp(-pow((y-arc)*4.3,2.))*.18;
 float visible=smoothstep(.08,.20,y)*(1.-smoothstep(.79,.97,y))*night*(1.-cloud*.80)*(1.-storm*.35);
 vec3 mint=vec3(.09,.76,.55),violet=vec3(.32,.33,.77);
 vec3 aurora=mix(mint,violet,smoothstep(-.9,.95,x+sin(clock*.025)*.6));
 col+=(aurora*(bandA*.52+bandB*.29)*fold+vec3(.07,.27,.29)*veil)*visible;
}
if(distance>155.){
 if(ray.y>.02){
  float start=1.2/max(.025,ray.y),end=min(82.,4.4/max(.025,ray.y));
  if(end>start){float stepSize=(end-start)/64.;float jitter=.1+hash(vec3(gl_FragCoord.xy,1.))*.8;float trans=1.;vec3 accum=vec3(0.);
   for(int i=0;i<64;i++){
    float t=start+(float(i)+jitter)*stepSize;vec3 p=vec3(0.,.7,0.)+ray*t;float d=density(p);
    if(d>.005){float shade=density(p+sunDir*.65);float forward=pow(max(0.,dot(ray,sunDir)),8.);
     vec3 amb=vec3(.42,.49,.56)*day+vec3(.30,.29,.35)*twilight+vec3(.29,.37,.49)*night;
     vec3 lit=amb+sunColor*exp(-shade*3.8)*(.48+forward*.25)*(day+twilight*.8+night*.26);
     lit=mix(lit,atmosphere,1.-exp(-t*.016));lit+=vec3(.76,.84,1.)*flash*.5;
     float a=1.-exp(-d*stepSize*2.);
     accum+=lit*a*trans;trans*=1.-a;}
    if(trans<.025)break;
   }
   col=mix(col,col*trans+accum,smoothstep(.025,.21,ray.y));
  }
 }
 col=mix(col,atmosphere,exp(-abs(ray.y)*18.)*(.12+fog*.22));
}else{
 vec3 eye=vec3(0.,5.6,-8.),pos=eye+ray*distance;
 vec2 nXZ=geom.ba*2.-1.;vec3 normal=normalize(vec3(nXZ.x,sqrt(max(.01,1.-dot(nXZ,nXZ))),nXZ.y));
 float detail=groundFbm(pos.xz*2.2),macro=groundFbm(pos.xz*.36),slope=1.-normal.y;
 float canopy=groundFbm(pos.xz*.84);
 vec3 grass=mix(vec3(.09,.165,.082),vec3(.28,.31,.14),smoothstep(.2,.85,macro));
 grass=mix(grass,vec3(.065,.125,.093),smoothstep(.43,.65,canopy)*.48);
 vec3 rock=mix(vec3(.235,.24,.225),vec3(.40,.395,.36),detail);
 vec3 material=mix(grass,rock,smoothstep(.22,.55,slope));
 float snowLine=smoothstep(6.9,9.8,pos.y+groundFbm(pos.xz*.9)*1.3)*(1.-smoothstep(.5,.84,slope));
 float winter=snow*.88*(1.-smoothstep(.25,.8,slope));snowLine=max(snowLine,winter);
 material=mix(material,vec3(.76,.83,.86),snowLine);
 material*=.89+detail*.18;material*=1.-wetGround*.17*(1.-snowLine);
 vec3 litDirection=normalize(vec3(sunPosition.x,.50+sunPosition.y, .65));
 float diffuse=max(0.,dot(normal,litDirection));
 float occlusion=.75+.25*normal.y;
 float cloudShade=mix(1.,.52,smoothstep(.39,.68,fbm(vec3(pos.x*.055+drift*.20,1.,pos.z*.055)))*cloud);
 vec3 ambient=vec3(.47,.55,.61)*day+vec3(.35,.34,.42)*twilight+vec3(.43,.49,.58)*night;
 vec3 direct=sunColor*(.78-cloud*.42)*(day+twilight*.8+night*.14)*diffuse*cloudShade;
 vec3 land=material*(ambient*occlusion+direct+vec3(.65,.74,.91)*flash*.8);
 land=mix(land,land*1.24+vec3(.018,.026,.036),night*.76);
 float bank=abs(pos.x-riverCourse(pos.z));float riverWidth=.29+sin(pos.z*.37)*.055;float river=(1.-smoothstep(riverWidth-.05,riverWidth+.10,bank))*(1.-smoothstep(.3,.7,pos.y));
 float ripples=sin(pos.z*16.+pos.x*29.+clock*.8)*.005+sin(pos.z*41.-clock*1.3)*.0025;
 vec3 reflection=sky(reflect(ray,vec3(0,1,0)),top,horizon);
 float fresnel=.07+.93*pow(1.-max(.0,-ray.y),5.);
 vec3 water=mix(vec3(.06,.16,.145)*(day+twilight*.4+night*.22),reflection,fresnel*.68)+ripples;
 water+=sunColor*pow(max(0.,dot(reflect(ray,vec3(0,1,0)),sunDir)),90.)*.28;
 water=mix(water,vec3(.45,.56,.62)*(day+twilight*.4+night*.33),freeze*.5);
 land=mix(land,water,river);
 float aerial=1.-exp(-distance*(.007+fog*.032+rain*.006));
 col=mix(land,atmosphere,aerial);
 float valleyMist=exp(-max(pos.y-.25,0.)*.50)*(1.-exp(-distance*.024))*(.13+fog*.35);
 col=mix(col,atmosphere,valleyMist);
}
col+=vec3(.43,.53,.7)*flash*.06;
col=mix(col,vec3(dot(col,vec3(.2126,.7152,.0722))),storm*.09);
gl_FragColor=vec4(max(col,vec3(0.)),1.);
}
`;
const glassSource=`precision highp float;
uniform sampler2D sceneTex,precipTex;
uniform vec2 resolution;
uniform vec4 drops[48];
uniform float freezeGlass,exposure,glassWet;
float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 sceneAt(vec2 uv){uv=clamp(uv,vec2(.001),vec2(.999));vec4 p=texture2D(precipTex,uv);return mix(texture2D(sceneTex,uv).rgb,p.rgb,p.a);}
void main(){
vec2 uv=gl_FragCoord.xy/resolution,px=1./resolution;float aspect=resolution.x/resolution.y;
float coverage=0.,trail=0.,radius=0.;vec3 n=vec3(0,0,1);
for(int i=0;i<48;i++){
 vec4 d=drops[i];
 if(d.z>.00005){
  vec2 local=(uv-d.xy)*vec2(aspect,1.);float ry=d.z*(1.12+min(1.,d.w*8.));
  if(abs(local.x)<d.z*1.2&&local.y>-ry*1.2&&local.y<max(ry*1.2,d.w)){
   vec2 p=local/vec2(d.z,ry);float q=dot(p,p);float aa=min(.3,1./max(1.,d.z*resolution.y));float a=1.-smoothstep(1.-aa,1.+aa,q);
   if(a>coverage){coverage=a;radius=d.z;n=normalize(vec3(p.x,p.y,sqrt(max(.001,1.-min(.999,q)))));}
   if(d.w>0.002&&local.y>0.){float meander=sin(local.y*130.+d.x*44.)*.0007;float across=(local.x+meander)/max(.0005,d.z*.18);float taper=1.-smoothstep(d.w*.40,d.w,local.y);float stream=exp(-across*across)*taper*smoothstep(.0,ry,local.y);trail=max(trail,stream);}
  }
 }
}
// Quiet microbeads add scale between the larger, persistent droplets.
vec2 cell=floor(uv*vec2(aspect,1.)*135.);vec2 f=fract(uv*vec2(aspect,1.)*135.)-.5;float bead=exp(-dot(f,f)*240.)*smoothstep(.91,1.,hash2(cell))*glassWet;
vec2 warp=n.xy*vec2(1./aspect,1.)*radius*2.8*coverage;
warp+=vec2(sin(uv.y*87.)*.00065*trail,0.);
vec3 color=sceneAt(uv-warp);
vec3 soft=(sceneAt(uv-warp+px*vec2(1.5,0))+sceneAt(uv-warp-px*vec2(1.5,0))+sceneAt(uv-warp+px*vec2(0,1.5))+sceneAt(uv-warp-px*vec2(0,1.5)))*.25;
color=mix(color,soft,coverage*.12+trail*.22);
// Transparent wet pane: lens distortion, small beads and runnels, NO reflected
// environment, NO reflective highlight, NO diagonal gloss strip or fake vignette.
color*=1.-coverage*.05*(1.-n.z);
color+=vec3(.075,.09,.11)*bead;
vec2 edgeUV=uv*2.-1.;
// Ice forms gradually around cold glass edges and melts without an abrupt cut.
float rim=pow(abs(edgeUV.y),7.)*.7+pow(abs(edgeUV.x),9.)*.3;
float iceGrain=hash2(floor(uv*resolution*.58));float frost=freezeGlass*rim*(.22+iceGrain*.16);
color=mix(color,soft*.65+vec3(.30,.36,.39),clamp(frost,0.,.44));
color*=exposure;
float luma=dot(color,vec3(.2126,.7152,.0722));color=mix(vec3(luma),color,1.035);
color=(color-.45)*1.025+.45;color=pow(clamp(color,0.,1.),vec3(.97));
gl_FragColor=vec4(color,1.);
}
`;
function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
function program(fragment,uniforms){const p=gl.createProgram();gl.attachShader(p,compile(gl.VERTEX_SHADER,vertexSource));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fragment));gl.bindAttribLocation(p,0,'position');gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));const u={};for(const name of uniforms)u[name]=gl.getUniformLocation(p,name);return {p,u};}
let geometry,scene,glass;
// Mobile-specific shader budgets: fewer ray steps and fragment uniforms.
// Small GPUs often fail to link the 48-drop shader; adapt to their actual limit.
const uniformLimit=gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)||32;
const dropCount=Math.max(8,Math.min(mobileGpu?20:48,uniformLimit-12));
const lowPrecision=!(gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT)?.precision>0);
const precision=source=>lowPrecision?source.replace('precision highp float;','precision mediump float;'):source;
const geometryShader=precision(mobileGpu?geometrySource.replace('i<125','i<62'):geometrySource);
const sceneShader=precision(mobileGpu?sceneSource.replace('i<64','i<22').replace('/64.','/22.'):sceneSource);
const glassShader=precision(glassSource.replace(/\b48\b/g,String(dropCount)));
try{
 geometry=program(geometryShader,['resolution']);
 scene=program(sceneShader,['geometryTex','resolution','sunPosition','skyWeights','clock','cloud','wind','rain','fog','snow','freeze','storm','flash','wetGround','drift']);
 glass=program(glassShader,['sceneTex','precipTex','resolution','drops[0]','freezeGlass','exposure','glassWet']);
}catch(e){canvas.remove();root.dataset.ivyNatural='fallback';document.documentElement.classList.remove('ivy-natural-boot');console.warn('IVY weather renderer unavailable',e);return;}
const quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
function texture(filter){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filter);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;}
function renderTarget(filter){const tex=texture(filter),fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);return {tex,fbo};}
const geometryTarget=renderTarget(gl.NEAREST),sceneTarget=renderTarget(gl.LINEAR),weatherTexture=texture(gl.LINEAR);
const weatherCanvas=document.createElement('canvas'),ctx=weatherCanvas.getContext('2d');
// Weather observations are the only source for the visual state. Glass defaults are fixed.
const controls={glass:{value:'100'},exposure:{value:'108'},transition:{value:'5'}};
const q=id=>controls[id];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=t=>t*t*(3-2*t),approach=(a,b,dt,tau)=>a+(b-a)*(1-Math.exp(-dt/tau));
const numeric=v=>v!==null&&v!==''&&v!==undefined&&Number.isFinite(Number(v))?Number(v):null;
const keys=['cloud','wind','precip','fog','snow','hail','freeze','storm','day','twilight','night','sunX','sunY'];
const template={cloud:.46,wind:.15,precip:0,fog:.08,snow:0,hail:0,freeze:0,storm:0,day:1,twilight:0,night:0,sunX:.60,sunY:.50};
let current={...template},from={...template},target={...template},progress=1,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,clock=18,drift=.6,groundWet=0,glassWet=0,snowCover=0,frost=0,flash=0;
let latest=null,hasObservation=false,intersecting=true;
function visualConditions(c){
 const code=numeric(c.weather_code),speed=numeric(c.wind_speed_10m)??0;
 const s={...template,wind:clamp(speed/65)};
 if(code===0){s.cloud=.07;s.fog=.035;}
 else if(code===1){s.cloud=.30;s.fog=.06;}
 else if(code===2){s.cloud=.58;s.fog=.09;}
 else if(code===3){s.cloud=.97;s.fog=.18;}
 else if([45,48].includes(code)){s.cloud=.80;s.fog=code===48?.98:.88;s.freeze=code===48?.35:0;}
 else if([51,53,55,56,57].includes(code)){s.cloud=.84;s.precip=({51:.16,53:.28,55:.44,56:.25,57:.45})[code];s.fog=.30;s.freeze=code>=56?1:0;}
 else if([61,63,65,66,67,80,81,82].includes(code)){s.cloud=.94;s.precip=({61:.38,63:.66,65:.97,66:.42,67:.78,80:.52,81:.78,82:1})[code];s.fog=.22+s.precip*.10;s.freeze=[66,67].includes(code)?1:0;}
 else if([71,73,75,77,85,86].includes(code)){s.cloud=.88;s.precip=({71:.32,73:.60,75:.94,77:.43,85:.62,86:.96})[code];s.snow=1;s.fog=.20+s.precip*.18;}
 else if([95,96,99].includes(code)){s.cloud=1;s.precip=code===95?.78:.98;s.storm=1;s.fog=.26;s.hail=code===96?.60:code===99?.90:0;}
 const cover=numeric(c.cloud_cover);if(cover!==null)s.cloud=clamp(s.cloud*.35+cover/100*.65);
 return s;
}
function timeLighting(s,now){
 const lat=numeric(s.latitude),lon=numeric(s.longitude);let solar=null;
 if(lat!==null&&lon!==null&&Math.abs(lat)<=90&&Math.abs(lon)<=180)solar=window.ivyV27Weather?.solarPosition?.(lat,lon,now);
 let alt=solar?.altitude;
 if(!Number.isFinite(alt)){
  const rise=window.ivyV27Weather?.weatherEpoch?.(s.daily?.sunrise?.[0],s.utc_offset_seconds),set=window.ivyV27Weather?.weatherEpoch?.(s.daily?.sunset?.[0],s.utc_offset_seconds);
  if(Number.isFinite(rise)&&Number.isFinite(set)&&set>rise){const ratio=(now-rise)/(set-rise);alt=ratio>=0&&ratio<=1?20*Math.sin(ratio*Math.PI):-12;}
 }
 if(Number.isFinite(alt)){
  const day=ease(clamp((alt-3)/13)),night=1-ease(clamp((alt+7)/6));
  return {day,night,twilight:clamp(1-day-night),sunX:Number.isFinite(solar?.azimuth)?clamp(-Math.sin(solar.azimuth*Math.PI/180)*.72,-.85,.85):.6,sunY:clamp(Math.tan(alt*Math.PI/180)*.75,-.25,.72)};
 }
 const isDay=Number(s.current?.is_day)!==0;return {day:isDay?1:0,night:isDay?0:1,twilight:0,sunX:.6,sunY:isDay?.5:-.25};
}
function applySnapshot(s){if(!s?.current)return;latest=s;const next={...visualConditions(s.current),...timeLighting(s,Date.now())};from={...current};target=next;
 if(!hasObservation){current={...next};from={...next};progress=1;hasObservation=true;const liquid=next.precip*clamp(1-next.snow-next.hail);glassWet=groundWet=liquid;snowCover=next.snow*.75;frost=next.freeze*.5;}
 else progress=0;
}
let rng=62017;const random=()=>{rng=(rng*1664525+1013904223)>>>0;return rng/4294967296;};

const rainParticles=Array.from({length:300},(_,i)=>({x:random(),y:random(),z:random(),rank:(i+.5)/300,life:random()*12,seed:random()*6.28}));
const snowParticles=Array.from({length:210},(_,i)=>({x:random(),y:random(),z:random(),rank:(i+.5)/210,life:random()*15,seed:random()*6.28,rotation:random()*6.28}));
const hailParticles=Array.from({length:64},(_,i)=>({x:random(),y:random(),z:random(),rank:(i+.5)/64,phase:0,vy:0,vx:0,age:0,hitY:.22+random()*.7,seed:random()}));
const splashes=[];
const glassDrops=Array.from({length:dropCount},()=>({active:false,x:random(),y:random(),r:0,age:0,wait:0,speed:0,tail:0,seed:random()*6.28}));
const dropUniforms=new Float32Array(dropCount*4);let mergeClock=0;
function snowSprite(type){const c=document.createElement('canvas');c.width=c.height=40;const x=c.getContext('2d');const g=x.createRadialGradient(20,20,0,20,20,18);g.addColorStop(0,'rgba(247,250,252,.88)');g.addColorStop(.32,'rgba(237,244,248,.55)');g.addColorStop(.7,'rgba(230,240,247,.11)');g.addColorStop(1,'rgba(230,240,247,0)');x.fillStyle=g;x.fillRect(0,0,40,40);if(type!==2){for(let j=0;j<6;j++){const a=j*Math.PI/3+type*.5;x.fillStyle='rgba(240,248,252,.18)';x.beginPath();x.ellipse(20+Math.cos(a)*4,20+Math.sin(a)*4,5,2.3,a,0,Math.PI*2);x.fill();}}return c;}
const snowSprites=[snowSprite(0),snowSprite(1),snowSprite(2)];
const iceSprite=document.createElement('canvas');iceSprite.width=iceSprite.height=32;{const c=iceSprite.getContext('2d');const g=c.createRadialGradient(12,10,0,16,16,13);g.addColorStop(0,'rgba(251,254,255,.95)');g.addColorStop(.3,'rgba(220,236,245,.91)');g.addColorStop(.68,'rgba(167,193,210,.70)');g.addColorStop(1,'rgba(101,133,154,0)');c.fillStyle=g;c.beginPath();c.ellipse(16,16,12,11.3,-.35,0,Math.PI*2);c.fill();c.strokeStyle='rgba(247,252,255,.45)';c.lineWidth=1.3;c.beginPath();c.ellipse(15,15,8,7.5,0,3.3,5.2);c.stroke();}
function resetHail(p){p.x=random()*1.12-.06;p.y=-.08-random()*.24;p.phase=0;p.age=0;p.hitY=.25+random()*.68;p.z=random();}
function updateParticles(dt,liquid){
 const gust=(Math.sin(clock*.47)+Math.sin(clock*.19+1.5)*.5)*current.wind;
 if(liquid>.001){for(const p of rainParticles){p.life+=dt;p.y+=dt*(.25+p.z*1.45);p.x+=dt*(current.wind*.15+gust*.025)*(.3+p.z);if(p.y>1.1){p.y=-.1-random()*.1;p.x=random()*1.15-.08;}if(p.x>1.12)p.x=-.10;}}
 if(current.snow*current.precip>.001){for(const p of snowParticles){p.life+=dt;p.rotation+=dt*(p.z-.35)*.5;p.y+=dt*(.025+p.z*p.z*.16);p.x+=dt*(current.wind*.07+gust*.025+Math.sin(p.life*.8+p.seed)*(.008+p.z*.015));if(p.y>1.07){p.y=-.07;p.x=random()*1.16-.08;}if(p.x>1.1)p.x=-.08;if(p.x<-.12)p.x=1.06;}}
 if(current.hail*current.precip>.001){for(const p of hailParticles){p.age+=dt;if(!p.phase){const speed=.95+p.z*1.5;p.y+=dt*speed;p.x+=dt*(current.wind*.24+p.z*.03);if(p.y>=p.hitY){p.phase=1;p.age=0;p.y=p.hitY;p.vy=-(.2+p.z*.48);p.vx=(random()-.5)*.48;if(splashes.length<75)splashes.push({x:p.x,y:p.y,z:p.z,age:0,kind:'ice',seed:random()*6.28,rank:p.rank});}}else{p.vy+=dt*2.9;p.y+=p.vy*dt;p.x+=p.vx*dt;if(p.age>.50||p.y>1.08)resetHail(p);}if(p.x>1.1||p.x<-.1)resetHail(p);}}
 for(let i=splashes.length-1;i>=0;i--){splashes[i].age+=dt;if(splashes[i].age>.40)splashes.splice(i,1);}
}
function updateDrops(dt,liquid){
 const allowed=+q('glass').value/100;mergeClock+=dt;
 for(const d of glassDrops){if(!d.active){if(dt>0&&liquid>.02&&random()<dt*liquid*.45){d.active=true;d.x=.015+random()*.97;d.y=random()*.99;d.r=.0014+Math.pow(random(),1.8)*.0075;d.age=0;d.wait=1.4+random()*14;d.speed=0;d.tail=0;}continue;}
  d.age+=dt;const moving=d.r>.0039&&d.age>d.wait;
  const targetSpeed=moving?(.003+d.r*d.r*630)*(1-current.freeze*.85):0;d.speed=approach(d.speed,targetSpeed,dt,.7);
  d.y+=dt*d.speed;d.x+=dt*Math.sin(d.y*31+d.seed)*d.speed*.025;
  d.tail=approach(d.tail,moving?Math.min(.15,d.speed*1.8):0,dt,1.7);
  d.r*=Math.exp(-dt*(liquid>.02?.0005:.026));
  if(d.y>1.06||d.r<.0008){d.active=false;d.r=0;}
 }
 // Coalescence conserves droplet area; larger beads begin to run down the pane.
 if(mergeClock>.22){mergeClock=0;const ar=width/height;for(let i=0;i<glassDrops.length;i++){const a=glassDrops[i];if(!a.active)continue;for(let j=i+1;j<glassDrops.length;j++){const b=glassDrops[j];if(!b.active)continue;const dx=(a.x-b.x)*ar,dy=a.y-b.y;if(dx*dx+dy*dy<(a.r+b.r)*(a.r+b.r)*.55){const aa=a.r*a.r,bb=b.r*b.r;a.x=(a.x*aa+b.x*bb)/(aa+bb);a.y=Math.max(a.y,b.y);a.r=Math.min(.018,Math.sqrt(aa+bb));a.wait=0;a.age=Math.max(a.age,1);b.active=false;b.r=0;}}}}
 for(let i=0;i<glassDrops.length;i++){const d=glassDrops[i],j=i*4;dropUniforms[j]=d.x;dropUniforms[j+1]=1-d.y;dropUniforms[j+2]=d.active?d.r*Math.sqrt(ease(clamp(d.age/.8)))*allowed:0;dropUniforms[j+3]=d.tail*allowed;}
}
let bolt=null,boltAge=100,nextLightning=clock+5,previousStorm=0;
function lightningPath(){const start=.27+random()*.45,endY=.44+random()*.16;let x=start,y=.10;const points=[[x,y]];while(y<endY){x+=(random()-.50)*.065;y+=.018+random()*.033;points.push([x,y]);}const branches=[];for(let i=2;i<points.length-2;i+=3){let [bx,by]=points[i];const side=random()>.5?1:-1,branch=[[bx,by]];for(let j=0;j<3;j++){bx+=side*(.012+random()*.03);by+=.012+random()*.025;branch.push([bx,by]);}branches.push(branch);}return {points,branches,x:start};}
function updateLightning(dt){
 if(current.storm>.25&&previousStorm<=.25)nextLightning=clock+2.2+random()*1.8;previousStorm=current.storm;boltAge+=dt;
 if(dt>0&&current.storm>.40&&clock>=nextLightning){bolt=lightningPath();boltAge=0;nextLightning=clock+6+random()*7;}
 const first=Math.exp(-Math.pow((boltAge-.04)/.045,2)),second=Math.exp(-Math.pow((boltAge-.18)/.035,2))*.55;
 flash=(first+second+Math.exp(-boltAge*8)*.10)*current.storm;
}
let overlayWasActive=true,weatherTextureReady=false;
function drawWeather(){
 const liquid=current.precip*clamp(1-current.snow-current.hail);
 // Do not redraw or re-upload a completely dry, static weather overlay.
 const overlayActive=liquid>.003||current.snow*current.precip>.003||current.hail*current.precip>.003||splashes.length>0||(bolt&&boltAge<.42&&current.storm>.02);
 if(!overlayActive&&!overlayWasActive)return false;
 overlayWasActive=overlayActive;
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,width,height);const w=width,h=height;
 // Lightning illuminates distant cloud first; every subsequent effect is refracted by the glass pass.
 if(bolt&&boltAge<.42&&current.storm>.02){const strength=flash,radial=ctx.createRadialGradient(bolt.x*w,h*.15,0,bolt.x*w,h*.15,w*.42);radial.addColorStop(0,'rgba(220,232,255,'+strength*.10+')');radial.addColorStop(1,'rgba(200,220,255,0)');ctx.fillStyle=radial;ctx.fillRect(0,0,w,h);
  function path(points,lineWidth,alpha){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x*w,y*h):ctx.moveTo(x*w,y*h));ctx.strokeStyle='rgba(227,239,255,'+alpha+')';ctx.lineWidth=lineWidth;ctx.lineJoin='round';ctx.stroke();}
  path(bolt.points,5,clamp(strength*.06));path(bolt.points,1.1,clamp(strength*.86));for(const b of bolt.branches)path(b,.65,clamp(strength*.48));
 }
 ctx.lineCap='round';
 if(liquid>.003){for(const p of rainParticles){const alpha=clamp((liquid-p.rank)*7);if(alpha<.005)continue;const depth=.22+p.z*.78,x=p.x*w,y=p.y*h,len=(.008+depth*.027)*h;ctx.strokeStyle='rgba(218,230,238,'+alpha*(.06+p.z*.14)*(1-current.night*.65+flash*.8)+')';ctx.lineWidth=.4+p.z*.65;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-current.wind*len*.22,y-len);ctx.stroke();}}
 const solid=current.snow*current.precip;
 if(solid>.003){for(let i=0;i<snowParticles.length;i++){const p=snowParticles[i],alpha=clamp((solid-p.rank)*8);if(alpha<.005)continue;const size=(1.1+p.z*p.z*8.2)*(h/440),x=p.x*w,y=p.y*h;ctx.save();ctx.translate(x,y);ctx.rotate(p.rotation);ctx.globalAlpha=alpha*(.35+p.z*.35)*(1-current.night*.28+flash*.3);ctx.drawImage(snowSprites[i%3],-size,-size,size*2,size*2);ctx.restore();}}
 const hailAmount=current.hail*current.precip;
 if(hailAmount>.003){for(const p of hailParticles){let alpha=clamp((hailAmount-p.rank)*8);if(p.phase)alpha*=1-ease(clamp((p.age-.14)/.36));if(alpha<.005)continue;const x=p.x*w,y=p.y*h,r=(1.4+p.z*2.1)*(h/440)*(p.phase?Math.max(.50,1-p.age*.65):1);ctx.globalAlpha=alpha*.88;ctx.drawImage(iceSprite,x-r*1.5,y-r*1.5,r*3,r*3);if(!p.phase){ctx.strokeStyle='rgba(220,234,244,'+alpha*.10+')';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x,y-r*2);ctx.lineTo(x-current.wind*r,y-r*5);ctx.stroke();}}ctx.globalAlpha=1;}
 for(const s of splashes){const fade=(1-s.age/.40)*clamp((hailAmount-s.rank)*8);if(fade<.01)continue;const x=s.x*w,y=s.y*h,size=(1.5+s.age*15)*(h/440);ctx.strokeStyle='rgba(218,238,246,'+fade*.13+')';ctx.lineWidth=.65;ctx.beginPath();ctx.ellipse(x,y,size,size*.58,s.seed,.2,2.8);ctx.stroke();for(let j=0;j<5;j++){const a=j*1.256+s.seed;ctx.fillStyle='rgba(230,243,249,'+fade*.5+')';ctx.beginPath();ctx.arc(x+Math.cos(a)*size*1.35,y+Math.sin(a)*size*.85,.6,0,6.283);ctx.fill();}}
 ctx.globalAlpha=1;
 return true;
}

let width=0,height=0,last=performance.now(),lastScene=-100,sceneBudget=0,stopped=false,lastDraw=0;
const maxFPS=paused?6:(mobileGpu?20:30);
root.dataset.ivyNatural='starting';let firstFrameDone=false;

function resize(){const scale=Math.min(mobileGpu?.9:1.2,devicePixelRatio||1);const w=Math.max(2,Math.min(mobileGpu?420:640,Math.round(canvas.clientWidth*scale))),h=Math.max(2,Math.round(w*canvas.clientHeight/Math.max(1,canvas.clientWidth)));if(w===width&&h===height)return false;width=w;height=h;canvas.width=w;canvas.height=h;weatherCanvas.width=w;weatherCanvas.height=h;weatherTextureReady=false;overlayWasActive=true;
 for(const t of [geometryTarget,sceneTarget]){gl.bindTexture(gl.TEXTURE_2D,t.tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.bindFramebuffer(gl.FRAMEBUFFER,t.fbo);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Wetter-Framebuffer nicht verfügbar');}
 gl.viewport(0,0,w,h);gl.bindFramebuffer(gl.FRAMEBUFFER,geometryTarget.fbo);gl.useProgram(geometry.p);gl.uniform2f(geometry.u.resolution,w,h);gl.drawArrays(gl.TRIANGLES,0,6);lastScene=-100;return true;}
function scenePass(){gl.bindFramebuffer(gl.FRAMEBUFFER,sceneTarget.fbo);gl.useProgram(scene.p);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,geometryTarget.tex);gl.uniform1i(scene.u.geometryTex,0);gl.uniform2f(scene.u.resolution,width,height);gl.uniform2f(scene.u.sunPosition,current.sunX,current.sunY);gl.uniform3f(scene.u.skyWeights,current.day,current.twilight,current.night);
 const scalar={clock,cloud:current.cloud,wind:current.wind,rain:current.precip*(1-current.snow*.8),fog:current.fog,snow:Math.max(current.snow*.62,snowCover),freeze:current.freeze,storm:current.storm,flash,wetGround:groundWet,drift};for(const [name,value] of Object.entries(scalar))gl.uniform1f(scene.u[name],value);gl.drawArrays(gl.TRIANGLES,0,6);}
function finalPass(overlayChanged){gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.useProgram(glass.p);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,sceneTarget.tex);gl.uniform1i(glass.u.sceneTex,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,weatherTexture);if(overlayChanged||!weatherTextureReady){
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
 if(!weatherTextureReady){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,weatherCanvas);weatherTextureReady=true;}
 else gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,weatherCanvas);
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
}gl.uniform1i(glass.u.precipTex,1);gl.uniform2f(glass.u.resolution,width,height);gl.uniform4fv(glass.u['drops[0]'],dropUniforms);const scalar={freezeGlass:frost,exposure:+q('exposure').value/100,glassWet:glassWet*(+q('glass').value/100)};for(const [name,value] of Object.entries(scalar))gl.uniform1f(glass.u[name],value);gl.drawArrays(gl.TRIANGLES,0,6);}
function frame(now){if(stopped||!root.isConnected)return;if(document.hidden||!intersecting||canvas.clientWidth<2||canvas.clientHeight<2){last=now;setTimeout(()=>requestAnimationFrame(safeFrame),700);return;}if(lastDraw&&now-lastDraw<1000/maxFPS){requestAnimationFrame(safeFrame);return;}lastDraw=now;const realDt=Math.min(.08,Math.max(0,(now-last)/1000));last=now;const dt=paused?0:realDt;
 if(progress<1){progress=clamp(progress+realDt/Math.max(1,+q('transition').value));const t=ease(progress);for(const key of keys)current[key]=from[key]+(target[key]-from[key])*t;}
 clock+=dt;drift+=dt*(.012+current.wind*.035);
 const liquid=current.precip*clamp(1-current.snow-current.hail);
 groundWet=approach(groundWet,Math.max(liquid,current.hail*.4),realDt,liquid>groundWet?4:25);
 glassWet=approach(glassWet,liquid,realDt,liquid>glassWet?1.8:14);
 snowCover=approach(snowCover,current.snow*.9,realDt,current.snow>snowCover?6:18);
 frost=approach(frost,(current.freeze*.65+current.snow*.28)*(+q('glass').value/100),realDt,8);
 sceneBudget+=dt;const resized=resize();updateParticles(dt,liquid);updateDrops(dt,liquid);updateLightning(dt);
 const overlayChanged=drawWeather();if(resized||sceneBudget+1e-6>=1/30||progress<1||flash>.01||paused){scenePass();lastScene=clock;sceneBudget%=1/30;}finalPass(overlayChanged);
 if(!firstFrameDone){firstFrameDone=true;root.classList.add('ivy-natural-active');root.dataset.ivyNatural='webgl';document.documentElement.classList.remove('ivy-natural-boot');}
 requestAnimationFrame(safeFrame);}
function fallback(reason){stopped=true;root.classList.remove('ivy-natural-active');canvas.remove();root.dataset.ivyNatural='fallback';document.documentElement.classList.remove('ivy-natural-boot');if(reason)console.warn('IVY Wetter: mobile WebGL fallback',reason);}
function safeFrame(time){try{frame(time)}catch(error){fallback(error)}}
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fallback('WebGL context lost');});
document.addEventListener('visibilitychange',()=>{last=performance.now();if(!document.hidden&&latest)applySnapshot(latest);});
if(typeof IntersectionObserver==='function')new IntersectionObserver(entries=>{intersecting=entries[0]?.isIntersecting!==false;},{threshold:0}).observe(root);
window.addEventListener('ivy-weather-snapshot',event=>applySnapshot(event.detail));
setInterval(()=>{if(latest&&!document.hidden)applySnapshot(latest);},60000);
try{applySnapshot(JSON.parse(localStorage.getItem('ivyWeatherSnapshot')||'null'));}catch(_){}
window.ivyNaturalWeather={version:39,applySnapshot,getState:()=>({renderer:root.dataset.ivyNatural,hasObservation,glassReflection:0,waterOnGlass:1,auroraEnabled:true,maxFPS,dropCount,mobileGpu,current:{...current},target:{...target},transition:progress})};
requestAnimationFrame(safeFrame);

}
function startDeferred(){
  // Wait for two actual paint opportunities: WebGL shader compilation must not delay the first dashboard frame.
  requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(init,180)));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startDeferred,{once:true});else startDeferred();
})();

;
