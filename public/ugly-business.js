import * as THREE from "three";
const $=id=>document.getElementById(id);
const tg=window.Telegram?.WebApp;const initData=tg?.initData||"";
let renderer,scene,camera,player,clock,ready=false,raf=0;
let yaw=0,moveX=0,moveY=0,activeObject=null,simState={cash:0,level:1,customers:0,xp:0};
const interactables=[];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
async function api(path,options={}){const r=await fetch(path,{...options,headers:{"Content-Type":"application/json","x-telegram-init-data":initData,...(options.headers||{})}});const d=await r.json();if(!r.ok)throw new Error(d.error||"Ошибка сервера");return d;}
function material(color,roughness=.8,metalness=0){return new THREE.MeshStandardMaterial({color,roughness,metalness});}
function box(w,h,d,x,y,z,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
function labelSprite(text){const c=document.createElement("canvas");c.width=512;c.height=128;const g=c.getContext("2d");g.fillStyle="#17130c";g.fillRect(0,0,512,128);g.strokeStyle="#d6a94f";g.lineWidth=6;g.strokeRect(4,4,504,120);g.fillStyle="#ffe5a5";g.font="bold 42px Arial";g.textAlign="center";g.fillText(text,256,80);const t=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:false}));s.scale.set(2.6,.65,1);return s;}
function buildStore(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x9daab2);scene.fog=new THREE.Fog(0x9daab2,13,30);
 camera=new THREE.PerspectiveCamera(62,1,.1,80);
 scene.add(new THREE.HemisphereLight(0xffe7c2,0x50545b,2.0));
 const sun=new THREE.DirectionalLight(0xffedcf,2.8);sun.position.set(-5,10,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
 const floorMat=material(0xb8b4a9,.92),wall=material(0xd8d1c1),dark=material(0x34383b),wood=material(0x76502d),metal=material(0x737b80,.42,.55),green=material(0x456b42),red=material(0xa83e32),white=material(0xe9e4d8);
 box(14,.25,14,0,-.16,0,floorMat);box(14,4,.25,0,1.85,-7,wall);box(.25,4,14,-7,1.85,0,wall);box(.25,4,14,7,1.85,0,wall);
 box(14,.2,.25,0,3.85,0,white);
 for(let i=-4;i<=4;i+=2){box(.08,.03,13,i,3.7,0,material(0xffffff));}
 // entrance glazing
 box(3,2.5,.12,0,1.3,6.82,material(0x9bb9c5,.15,.15));box(3.2,.16,.18,0,2.65,6.75,metal);
 // checkout counter and terminal
 box(2.4,1,.9,-3,.5,-3,wood);box(1.1,.08,.65,-3,1.05,-3,metal);box(.38,.35,.3,-2.5,1.25,-3,dark);box(.45,.06,.3,-2.5,1.45,-3,green);
 const till=labelSprite("КАССА");till.position.set(-3,2.1,-3);scene.add(till);
 interactables.push({mesh:new THREE.Vector3(-3,0,-3),name:"Касса",hint:"Нажми действие: обслужить клиента",action:"checkout"});
 // shelves with products
 for(let row=0;row<2;row++){const z=-.2+row*2.8;box(1.5,2.1,.55,2.7,1,z,metal);for(let level=0;level<3;level++){box(1.45,.07,.58,2.7,.35+level*.67,z,wood);for(let n=0;n<4;n++){const colors=[red,green,white,material(0xd6a13e)];const item=box(.22,.32,.24,2.15+n*.36,.56+level*.67,z,colors[(n+level)%4]);item.position.x+=row*.12;}}interactables.push({mesh:new THREE.Vector3(2.7,0,z),name:"Полки с товарами",hint:"Нажми действие: пополнить полки",action:"restock"});}
 const fridge=box(1.1,2.5,.85,5,1.25,-3,white);box(.04,2.2,.04,4.55,1.25,-3,metal);const fr=labelSprite("ХОЛОДИЛЬНИК");fr.position.set(5,2.9,-3);scene.add(fr);
 // ceiling lamps
 for(const x of [-4,0,4]){const lamp= new THREE.PointLight(0xffe5b5,25,9);lamp.position.set(x,3.4,1);scene.add(lamp);box(1.1,.07,.35,x,3.55,1,white);}
 // NPC customer mannequins
 for(const [x,z,shirt] of [[-.4,-1,0x344f73],[4,3,0x7b4931],[-4,2,0x485c3e]]){const body=new THREE.Mesh(new THREE.CylinderGeometry(.23,.28,.9,12),material(shirt));body.position.set(x,.78,z);body.castShadow=true;scene.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.2,16,12),material(0xc99570));head.position.set(x,1.38,z);scene.add(head);}
 // player rig
 player=new THREE.Group();const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.27,.55,5,10),material(0x263c54));torso.position.y=.85;torso.castShadow=true;player.add(torso);const head=new THREE.Mesh(new THREE.SphereGeometry(.22,16,12),material(0xc99570));head.position.y=1.42;player.add(head);const legMat=material(0x25282c);for(const x of [-.13,.13]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.09,.11,.48,10),legMat);leg.position.set(x,.27,0);player.add(leg);}player.position.set(0,0,4.5);scene.add(player);
 camera.position.set(0,3.4,8);camera.lookAt(player.position);
}
function resize(){if(!renderer||!$("uglyBusinessCanvas"))return;const c=$("uglyBusinessCanvas"),w=c.clientWidth,h=c.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
function frame(){raf=requestAnimationFrame(frame);if(!ready)return;const dt=Math.min(clock.getDelta(),.04);const forward=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));const right=new THREE.Vector3(forward.z,0,-forward.x);const v=forward.multiplyScalar(-moveY).add(right.multiplyScalar(moveX));if(v.lengthSq()>.001){v.normalize();player.position.addScaledVector(v,dt*3.2);player.rotation.y=Math.atan2(v.x,v.z);}player.position.x=clamp(player.position.x,-5.8,5.8);player.position.z=clamp(player.position.z,-5.8,5.8);const target=new THREE.Vector3(player.position.x+Math.sin(yaw)*5,3.1,player.position.z+Math.cos(yaw)*5);camera.position.lerp(new THREE.Vector3(player.position.x-Math.sin(yaw)*5,3.2,player.position.z-Math.cos(yaw)*5),.08);camera.lookAt(player.position.x,1,player.position.z);let nearest=null,dist=2.1;for(const item of interactables){const d=player.position.distanceTo(item.mesh);if(d<dist){nearest=item;dist=d;}}activeObject=nearest;$("simHint").textContent=nearest?nearest.hint:"Подойди к кассе или полкам";$("simAction").disabled=!nearest;renderer.render(scene,camera);}
function updateHud(){ $("simCash").textContent="$"+Number(simState.cash||0).toLocaleString("ru-RU");$("simLevel").textContent=simState.level||1;$("simCustomers").textContent=simState.customers||0;$("simXpText").textContent=(simState.xp%100)+" / 100 опыта";$("simXpFill").style.width=((simState.xp%100))+"%";}
async function doAction(action){try{const d=await api("/api/simulator/action",{method:"POST",body:JSON.stringify({action})});simState=d.state;updateHud();const msg=action==="checkout"?"Клиент обслужен! Деньги добавлены в кассу.":"Полки пополнены!";if(window.showToast)window.showToast(msg);$("simHint").textContent=msg;}catch(e){if(window.showToast)window.showToast(e.message,"error");}}
async function loadState(){try{const d=await api("/api/simulator/state");simState=d.state;updateHud();}catch(e){$("simHint").textContent=e.message;}}
function bindControls(){
 const joy=$("simJoystick"),stick=$("simStick");let joyId=null,center={x:0,y:0};
 joy.addEventListener("pointerdown",e=>{e.preventDefault();joyId=e.pointerId;joy.setPointerCapture(joyId);const r=joy.getBoundingClientRect();center={x:r.left+r.width/2,y:r.top+r.height/2};moveJoy(e);});
 function moveJoy(e){if(joyId!==e.pointerId)return;const dx=e.clientX-center.x,dy=e.clientY-center.y,len=Math.hypot(dx,dy),scale=Math.min(1,43/(len||1));const x=dx*scale,y=dy*scale;stick.style.transform="translate("+x+"px,"+y+"px)";moveX=x/43;moveY=y/43;}
 joy.addEventListener("pointermove",moveJoy);const release=e=>{if(joyId!==e.pointerId)return;joyId=null;moveX=0;moveY=0;stick.style.transform="translate(0,0)";};joy.addEventListener("pointerup",release);joy.addEventListener("pointercancel",release);
 const canvas=$("uglyBusinessCanvas");let lookId=null,lastX=0;canvas.addEventListener("pointerdown",e=>{if(e.clientX<canvas.getBoundingClientRect().left+145&&e.clientY>canvas.getBoundingClientRect().bottom-145)return;lookId=e.pointerId;lastX=e.clientX;});canvas.addEventListener("pointermove",e=>{if(lookId!==e.pointerId)return;yaw-= (e.clientX-lastX)*.008;lastX=e.clientX;});const end=e=>{if(lookId===e.pointerId)lookId=null;};canvas.addEventListener("pointerup",end);canvas.addEventListener("pointercancel",end);
 $("simAction").addEventListener("click",()=>{if(activeObject)doAction(activeObject.action);});
 document.querySelectorAll("[data-sim-action]").forEach(b=>b.addEventListener("click",()=>doAction(b.dataset.simAction)));
 window.addEventListener("keydown",e=>{if(e.key==="w"||e.key==="ArrowUp")moveY=1;if(e.key==="s"||e.key==="ArrowDown")moveY=-1;if(e.key==="a"||e.key==="ArrowLeft")moveX=-1;if(e.key==="d"||e.key==="ArrowRight")moveX=1;if(e.key==="e"&&activeObject)doAction(activeObject.action);});
 window.addEventListener("keyup",e=>{if(["w","s","ArrowUp","ArrowDown"].includes(e.key))moveY=0;if(["a","d","ArrowLeft","ArrowRight"].includes(e.key))moveX=0;});
}
window.initUglyBusiness=async function(){if(ready){resize();return;}if(!initData){$("simHint").textContent="Открой игру через Telegram";return;}try{renderer=new THREE.WebGLRenderer({canvas:$("uglyBusinessCanvas"),antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;buildStore();clock=new THREE.Clock();bindControls();ready=true;resize();await loadState();frame();}catch(e){$("simHint").textContent="3D не запустилось: "+e.message;console.error(e);}};
const observer=new MutationObserver(()=>{if($("simulator")?.classList.contains("active"))window.initUglyBusiness?.();});observer.observe($("simulator"),{attributes:true,attributeFilter:["class"]});window.addEventListener("resize",resize);
