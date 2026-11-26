import * as THREE from "three";

const $ = id => document.getElementById(id);
const initData = window.Telegram?.WebApp?.initData || "";
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const state = { cash:0, level:1, customers:0, xp:0, stations:4, adLevel:0, hourlyIncome:0, clubData:{stations:[],queue:[],sessions:[]} };
let renderer, scene, camera, player, clock, ready = false, raf = 0;
let yaw = 0, moveX = 0, moveY = 0, activeObject = null, actionBusy = false;
let joyPointer = null, lookPointer = null, lookLastX = 0, joyCenter = { x: 0, y: 0 };
let joystickRadius = 48, cameraDistance = 5.8, cameraHeight = 3.2;
const interactables = [], animated = [], keys = Object.create(null);
const stationGroups=[], clubNPCs=[];let statePollTimer=0, receptionGuestId=null, receptionDuration=180;
const tempForward = new THREE.Vector3(), tempRight = new THREE.Vector3(), tempMove = new THREE.Vector3();
const _v = new THREE.Vector3();

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", "x-telegram-init-data": initData, ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Ошибка сервера");
  return data;
}
function toast(message, type = "success") {
  if (typeof window.showToast === "function") window.showToast(message, type);
  else window.alert(message);
}
function mat(color, roughness = .75, metalness = 0, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
}
const M = {
  wall: mat("#d9d3c8"), wallDark: mat("#a8a398"), floor: mat("#aaa79f", .9),
  grout: mat("#77766f"), dark: mat("#25292c", .45), metal: mat("#879197", .32, .72),
  steel: mat("#c3c9c9", .25, .8), wood: mat("#805632"), woodLight: mat("#bd8b50"),
  gold: mat("#c89a42", .35, .55), glass: mat("#9cc5d1", .15, .2, { transparent: true, opacity: .42 }),
  green: mat("#47734c"), red: mat("#a84235"), cream: mat("#eee9df"),
  skin: mat("#c9906d"), shirtBlue: mat("#304d70"), shirtGreen: mat("#49634a"),
  shirtRust: mat("#86523b"), pants: mat("#292c32"), shoe: mat("#17191c")
};
function addMesh(parent, geometry, material, position, cast = true, receive = true) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = cast; mesh.receiveShadow = receive;
  parent.add(mesh);
  return mesh;
}
function box(parent, w, h, d, x, y, z, material, cast = true) {
  return addMesh(parent, new THREE.BoxGeometry(w, h, d), material, [x, y, z], cast);
}
function cylinder(parent, rt, rb, h, x, y, z, material, segments = 16) {
  return addMesh(parent, new THREE.CylinderGeometry(rt, rb, h, segments), material, [x, y, z]);
}
function sphere(parent, r, x, y, z, material, width = 16, height = 12) {
  return addMesh(parent, new THREE.SphereGeometry(r, width, height), material, [x, y, z]);
}
function canvasTexture(draw, width = 512, height = 256) {
  const c = document.createElement("canvas"); c.width = width; c.height = height;
  const ctx = c.getContext("2d"); draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer?.capabilities?.getMaxAnisotropy?.() || 4;
  return texture;
}
function signMaterial(title, subtitle = "") {
  const texture = canvasTexture((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#28231a"); g.addColorStop(1, "#0e1215");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#cda253"; ctx.lineWidth = 9; ctx.strokeRect(7, 7, w - 14, h - 14);
    ctx.textAlign = "center"; ctx.fillStyle = "#ffe3a0";
    ctx.font = "bold 58px Arial"; ctx.fillText(title, w / 2, 112);
    ctx.fillStyle = "#d2c7ad"; ctx.font = "24px Arial"; ctx.fillText(subtitle, w / 2, 164);
  }, 512, 210);
  return new THREE.MeshStandardMaterial({ map: texture, roughness: .5, metalness: .1 });
}
function floorTexture() {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = "#b9b5ac"; ctx.fillRect(0, 0, w, h);
    const s = 64;
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
      ctx.fillStyle = ((x / s + y / s) % 2) ? "#c5c1b8" : "#b7b3aa";
      ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
      ctx.strokeStyle = "rgba(80,78,72,.16)"; ctx.lineWidth = 2; ctx.strokeRect(x + 2, y + 2, s - 4, s - 4);
    }
  });
}
function makeLabel(parent, text, x, y, z, width = 2.2, height = .65) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTexture((ctx, w, h) => {
    ctx.fillStyle = "#171b1d"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#d3a653"; ctx.lineWidth = 8; ctx.strokeRect(5, 5, w - 10, h - 10);
    ctx.fillStyle = "#ffe6ad"; ctx.font = "bold 52px Arial"; ctx.textAlign = "center";
    ctx.textBaseline = "middle"; ctx.fillText(text, w / 2, h / 2);
  }, 512, 128), transparent: false }));
  sprite.position.set(x, y, z); sprite.scale.set(width, height, 1); parent.add(sprite);
  return sprite;
}
function makeCan(parent, x, y, z, color, label = "") {
  const can = new THREE.Group(); can.position.set(x, y, z); parent.add(can);
  cylinder(can, .105, .105, .31, 0, 0, 0, mat(color, .32, .18), 16);
  cylinder(can, .108, .108, .025, 0, .16, 0, M.steel, 16);
  cylinder(can, .108, .108, .025, 0, -.16, 0, M.steel, 16);
  if (label) {
    const stripe = box(can, .012, .12, .212, .103, 0, 0, mat("#f2e6c8", .5), false);
    stripe.rotation.y = .08;
  }
  return can;
}
function makeBoxProduct(parent, x, y, z, color, label = false) {
  const group = new THREE.Group(); group.position.set(x, y, z); parent.add(group);
  box(group, .27, .34, .24, 0, 0, 0, mat(color, .78), true);
  box(group, .275, .045, .245, 0, .13, 0, mat("#eee2c8"), false);
  if (label) box(group, .012, .14, .13, .14, -.01, 0, mat("#f3e8d2"), false);
  return group;
}
function addCeilingLight(x, z) {
  box(scene, 1.35, .07, .48, x, 3.78, z, M.steel, false);
  box(scene, 1.15, .035, .31, x, 3.73, z, mat("#fff4d9", .2), false);
  const light = new THREE.PointLight("#ffe7c3", 38, 8, 2);
  light.position.set(x, 3.45, z); scene.add(light);
}
function addShelf(x, z, facing = 1) {
  const rack = new THREE.Group(); rack.position.set(x, 0, z); scene.add(rack);
  const width = 2.45, depth = .86;
  for (const side of [-1, 1]) {
    box(rack, .09, 2.25, .09, -width / 2 + .05, 1.12, side * depth / 2, M.metal);
    box(rack, .09, 2.25, .09, width / 2 - .05, 1.12, side * depth / 2, M.metal);
  }
  for (let level = 0; level < 4; level++) {
    const y = .28 + level * .59;
    box(rack, width, .075, depth, 0, y, 0, M.woodLight);
    box(rack, width, .035, .045, 0, y + .055, depth / 2 - .02, M.gold);
    for (let i = 0; i < 9; i++) {
      const xx = -1.03 + i * .257;
      if ((i + level) % 2) makeCan(rack, xx, y + .26, facing * .22, ["#a84235", "#46734d", "#b58a35", "#557b9b"][i % 4]);
      else makeBoxProduct(rack, xx, y + .22, facing * .22, ["#c7a56a", "#9a5944", "#d4d0c6", "#6c8050"][i % 4], true);
    }
  }
  return rack;
}
function makePerson(x,z,shirt,isPlayer=false,variant=0){
 const root=new THREE.Group();root.position.set(x,0,z);scene.add(root);
 const skins=["#f0b58a","#a96f4f","#e1a078","#c58b68","#f2c29c"],skin=mat(skins[variant%skins.length],.82),clothes=mat(shirt,.66),pants=mat(["#27344f","#30333c","#3b2e4d","#25413f"][variant%4],.82);
 const accent=mat(["#ffd34f","#34d8ff","#ff6a8a","#9b79ff"][variant%4],.35,.12,{emissive:["#5b3b00","#003d55","#501020","#28104d"][variant%4],emissiveIntensity:.28});
 const pelvis=new THREE.Group();pelvis.position.set(0,.91,0);root.add(pelvis);addMesh(pelvis,new THREE.CapsuleGeometry(.235,.22,4,12),pants,[0,-.02,0]);
 const torsoPivot=new THREE.Group();torsoPivot.position.set(0,1.12,0);root.add(torsoPivot);addMesh(torsoPivot,new THREE.CapsuleGeometry(.31,.48,6,16),clothes,[0,.02,0]);
 box(torsoPivot,.42,.13,.08,0,-.27,-.275,accent,false);cylinder(root,.095,.105,.16,0,1.49,0,skin,16);
 const head=new THREE.Group();head.position.set(0,1.76,0);root.add(head);const skull=sphere(head,.245,0,0,0,skin,24,20);skull.scale.set(.91,1.12,.9);
 const hair=mat(["#28202b","#4a2b1c","#171b28","#b77b35"][variant%4]);const cap=sphere(head,.25,0,.13,.005,hair,22,14);cap.scale.set(1,.55,1);
 const white=mat("#fff8e9",.5),dark=mat("#20232b",.72);
 for(const side of [-1,1]){sphere(head,.067,side*.235,-.015,0,skin,12,10);sphere(head,.052,side*.088,.035,-.205,white,14,10);sphere(head,.024,side*.088,.035,-.248,dark,12,10);box(head,.105,.018,.025,side*.088,.105,-.222,hair,false).rotation.z=side*-.1;}
 sphere(head,.035,0,-.025,-.245,skin,12,8);box(head,.085,.018,.018,0,-.105,-.226,mat("#75483d"),false);box(torsoPivot,.18,.07,.07,0,.245,-.265,accent,false);
 const limbs=[];
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.355,1.34,0);root.add(arm);addMesh(arm,new THREE.CapsuleGeometry(.105,.27,4,10),clothes,[0,-.17,0]);
  const forearm=new THREE.Group();forearm.position.set(0,-.34,0);arm.add(forearm);addMesh(forearm,new THREE.CapsuleGeometry(.082,.24,4,10),clothes,[0,-.14,-.005]);sphere(forearm,.082,0,-.29,-.005,skin,12,10);
  const leg=new THREE.Group();leg.position.set(side*.145,.79,0);root.add(leg);addMesh(leg,new THREE.CapsuleGeometry(.125,.29,4,12),pants,[0,-.18,0]);
  const calf=new THREE.Group();calf.position.set(0,-.36,0);leg.add(calf);addMesh(calf,new THREE.CapsuleGeometry(.092,.27,4,12),pants,[0,-.15,0]);
  const foot=new THREE.Group();foot.position.set(0,-.32,-.075);calf.add(foot);box(foot,.22,.13,.36,0,-.005,-.045,mat("#202633",.42,.08),false);box(foot,.225,.025,.35,0,-.073,-.045,accent,false);
  limbs.push({arm,forearm,leg,calf,foot,side});
 }
 animated.push({type:"character",root,torsoPivot,limbs,phase:variant*.71,isPlayer});return root;
}
function makeGamingPC(parent,x,y,z,tier=1,cpuTier=1,ramTier=1){
 const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);
 const colors=["#202d3d","#15506d","#17634e","#56377c"],lights=["#27c8ff","#7c69ff","#35f0c0","#ffbf45"],emissives=["#0877a8","#3820a1","#087b55","#9c5700"],idx=clamp((tier||1)-1,0,3);
 const glow=mat(lights[idx],.24,.15,{emissive:emissives[idx],emissiveIntensity:1.55});
 box(g,.46,.68,.43,0,.36,0,mat(colors[idx],.28,.48),true);
 box(g,.012,.57,.35,.237,.37,0,mat("#7892a9",.2,.35,{transparent:true,opacity:.72}),false);box(g,.018,.57,.35,.245,.37,0,glow,false);
 for(let i=0;i<3;i++){const fan=cylinder(g,.078,.078,.022,0,.56-i*.19,-.224,glow,24);fan.rotation.x=Math.PI/2;const hub=cylinder(g,.025,.025,.026,0,.56-i*.19,-.24,mat("#d9f7ff",.2,.45),16);hub.rotation.x=Math.PI/2;}
 box(g,.31,.025,.018,0,.69,-.225,mat("#d8eaff",.22,.35),false);box(g,.12,.035,.025,.14,.69,-.23,glow,false);
 for(let i=0;i<4;i++)box(g,.025,.19,.012,-.14+i*.045,.36,.219,mat("#9fb3c8",.3,.65),false);
 const cpuIndex=clamp(cpuTier,1,4)-1,ramIndex=clamp(ramTier,1,4)-1;
 const partColors=["#ffbd45","#24cfff","#42e6a5","#bf82ff"],partEmits=["#704000","#00618a","#087a4d","#4a1a83"];
 const cpuGlow=mat(partColors[cpuIndex],.24,.2,{emissive:partEmits[cpuIndex],emissiveIntensity:.35+cpuTier*.15});
 const ramGlow=mat(partColors[ramIndex],.24,.2,{emissive:partEmits[ramIndex],emissiveIntensity:.35+ramTier*.15});
 box(g,.055,.22,.018,.14,.36,-.225,cpuGlow,false);
 for(let i=0;i<Math.min(4,ramTier);i++)box(g,.035,.16,.018,-.12+i*.07,.35,-.226,ramGlow,false);
 return g;
}
function makeGamingStation(x,z,index,data){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 const c=data.components||{},levels=Object.values(c).map(Number).filter(v=>v>0),tier=levels.length?Math.min(4,...levels):Math.max(1,Number(data.tier)||1);
 const gpu=clamp(Number(c.gpu)||tier,1,4),cpu=clamp(Number(c.cpu)||tier,1,4),ram=clamp(Number(c.ram)||tier,1,4),monitor=clamp(Number(c.monitor)||tier,1,4),keyboard=clamp(Number(c.keyboard)||tier,1,4),mouse=clamp(Number(c.mouse)||tier,1,4),chairLevel=clamp(Number(c.chair)||tier,1,4),deskLevel=clamp(Number(c.desk)||tier,1,4);
 const palette=["#ffbd45","#24cfff","#42e6a5","#bf82ff"],emit=["#704000","#00618a","#087a4d","#4a1a83"],trim=mat(palette[gpu-1],.26,.42,{emissive:emit[gpu-1],emissiveIntensity:.55});
 const screenMat=mat("#fff",.24,.05,{map:canvasTexture((ctx,w,h)=>{const gr=ctx.createLinearGradient(0,0,w,h);gr.addColorStop(0,["#12314c","#0a5276","#104a38","#48265f"][monitor-1]);gr.addColorStop(1,["#07111f","#142b5a","#102b25","#211333"][monitor-1]);ctx.fillStyle=gr;ctx.fillRect(0,0,w,h);ctx.fillStyle="#fff";ctx.font="bold 38px Arial";ctx.fillText("UGLY",18,57);ctx.font="16px Arial";ctx.fillText("GAMING ARENA / PC "+(index+1),18,83);ctx.fillStyle=palette[monitor-1];ctx.fillRect(18,104,w*.72,7);},256,160),emissive:palette[monitor-1],emissiveIntensity:.12+monitor*.055});
 const deskPalette=["#26374b","#174d68","#18513f","#49315f"],deskGlow=["#71869c","#2b9ab5","#398b6c","#9270b8"],deskShell=mat(deskPalette[deskLevel-1],.3,.42);box(g,2.1,.15,.92,0,.78,0,deskShell);box(g,2.12,.045,.94,0,.87,0,mat(palette[deskLevel-1],.26,.15,{emissive:emit[deskLevel-1],emissiveIntensity:.28+deskLevel*.1}),false);
 for(const sx of [-.9,.9]){box(g,.12,.76,.13,sx,.38,0,mat(deskGlow[deskLevel-1],.28,.62));box(g,.13,.035,.14,sx,.72,.03,mat(palette[deskLevel-1],.26,.15,{emissive:emit[deskLevel-1],emissiveIntensity:.35}),false);}
 box(g,.88,.56,.11,0,1.28,-.36,mat("#111b2b",.2,.42));box(g,.76,.42,.016,0,1.29,-.422,screenMat,false);
 box(g,.12,.17,.13,0,1.02,-.34,mat("#71849a",.26,.58));box(g,.34,.035,.25,0,.98,-.19,mat("#182536",.3,.35));
 const boardGlow=mat(palette[keyboard-1],.3,.15,{emissive:emit[keyboard-1],emissiveIntensity:.2+keyboard*.12});
 box(g,.64,.045,.24,-.12,.925,.22,mat("#121b29",.3,.3));
 for(let row=0;row<4;row++)for(let col=0;col<12;col++)box(g,.039,.025,.038,-.405+col*.052,.96,.135+row*.052,keyboard>=2?boardGlow:mat("#8493a4",.42,.2),false);
 box(g,.15,.018,.035,-.12,.963,.385,boardGlow,false);
 box(g,.31,.025,.25,.57,.91,.235,mat("#101a29",.45,.12));box(g,.32,.012,.26,.57,.925,.235,mat("#203d57",.38,.15,{emissive:palette[mouse-1],emissiveIntensity:.12+mouse*.08}),false);
 const mouseBody=sphere(g,.075,.57,.98,.22,mat(["#222d3c","#1a526e","#1d674f","#563c79"][mouse-1],.28,.25),18,12);mouseBody.scale.set(.72,.42,1.12);
 box(g,.012,.025,.065,.57,.997,.16,mat("#d8e8f6",.24,.3),false);cylinder(g,.018,.018,.022,.57,1.005,.215,mat(palette[mouse-1],.25,.1,{emissive:emit[mouse-1],emissiveIntensity:.8}),12).rotation.x=Math.PI/2;
 makeGamingPC(g,.78,.9,.02,gpu,cpu,ram);
 const rgbLight=new THREE.PointLight(palette[gpu-1],1.8,2.2,2);rgbLight.position.set(x+.78,1.35,z-.32);scene.add(rgbLight);
 const chair=new THREE.Group();chair.position.set(0,0,1.05);g.add(chair);const chairMat=mat(["#222d3c","#173e58","#174b3b","#3e2b58"][chairLevel-1],.38,.18);
 cylinder(chair,.065,.075,.48,0,.28,0,mat("#71849a",.25,.6),14);cylinder(chair,.42,.42,.1,0,.07,0,mat("#182332",.35,.2),24);
 box(chair,.65,.65,.17,0,.72,.12,chairMat);box(chair,.5,.12,.18,0,1.1,.1,trim,false);
 for(const sx of [-1,1]){box(chair,.08,.38,.48,sx*.37,.48,.02,chairMat,false);box(chair,.1,.08,.34,sx*.37,.67,.02,trim,false);}
 makeLabel(g,"PC "+String(index+1).padStart(2,"0"),0,2.15,-.4,1.3,.3);g.userData={index,tier,components:{gpu,cpu,ram,monitor,keyboard,mouse,chair:chairLevel,desk:deskLevel}};stationGroups.push(g);
 const keys=["gpu","cpu","ram","monitor","keyboard","mouse","chair","desk"],names=["Видеокарта","Процессор","ОЗУ","Монитор","Клавиатура","Мышь","Кресло","Стол"];
 keys.forEach((key,k)=>interactables.push({position:new THREE.Vector3(x+((k%4)-1.5)*.3,0,z+1.15+Math.floor(k/4)*.28),name:names[k],hint:"Улучшение компонента ПК · "+names[k],action:"upgrade_component",station:index,component:key,radius:1.9}));
}
function buildStore(){
 scene=new THREE.Scene();scene.background=new THREE.Color("#101a32");scene.fog=new THREE.Fog("#101a32",27,52);camera=new THREE.PerspectiveCamera(58,1,.1,100);
 scene.add(new THREE.HemisphereLight("#c8eaff","#22233d",1.8));
 const key=new THREE.DirectionalLight("#fff0d4",2.8);key.position.set(-6,12,7);key.castShadow=true;key.shadow.mapSize.set(1536,1536);key.shadow.camera.left=-15;key.shadow.camera.right=15;key.shadow.camera.top=15;key.shadow.camera.bottom=-15;scene.add(key);
 for(const [color,intensity,pos] of [["#21cfff",70,[-5,3,-4]],["#9c4dff",65,[6,3,2]],["#ff4e9b",35,[0,3,7]]]){const l=new THREE.PointLight(color,intensity,20,2);l.position.set(...pos);scene.add(l);}
 const roomSize=18+Number(state.clubData.roomLevel||0)*4,roomHalf=roomSize/2;
 box(scene,roomSize,.35,roomSize,0,-.18,0,mat("#263449",.72,.18));
 for(let x=-8;x<=8;x+=2)for(let z=-8;z<=8;z+=2)box(scene,1.96,.018,1.96,x,.008,z,mat((x+z)%4?"#293b53":"#202f45",.68,.12),false);
 box(scene,roomSize,5,.32,0,2.35,-roomHalf,mat("#263b59"));box(scene,.32,5,roomSize,-roomHalf,2.35,0,mat("#263b59"));box(scene,.32,5,roomSize,roomHalf,2.35,0,mat("#263b59"));box(scene,roomSize,.25,roomSize,0,5,0,mat("#111a2b"));
 for(let i=0;i<7;i++){const p=box(scene,.12,3.6,.08,-7.2+i*2.4,2.25,-8.78,mat(i%2?"#1bd5ff":"#a56cff",.32,.25,{emissive:i%2?"#087a9d":"#4d1684",emissiveIntensity:.55}),false);p.rotation.z=i%2?.18:-.18;}
 box(scene,7,.95,.22,0,4.12,-8.72,mat("#121d31",.3,.3));const sign=new THREE.Mesh(new THREE.PlaneGeometry(6.5,.72),signMaterial("UGLY CYBER CLUB","PLAY • COMPETE • LEVEL UP"));sign.position.set(0,4.12,-8.57);scene.add(sign);
 for(const z of [-6,-1,4]){box(scene,17,.08,.16,0,3.45,z,mat("#20cfff",.28,.4,{emissive:"#087fa8",emissiveIntensity:.9}),false);box(scene,17,.06,.14,0,3.28,z+.12,mat("#a55cff",.28,.4,{emissive:"#4a138c",emissiveIntensity:.75}),false);}
 // Premium reception desk and an interactive admin laptop.
 const reception=new THREE.Group();reception.position.set(0,0,7.1);scene.add(reception);
 box(reception,3.8,.92,.78,0,.52,0,mat("#14243a",.28,.42));
 box(reception,3.92,.12,.9,0,1.04,0,mat("#263d58",.24,.5));
 box(reception,3.55,.035,.045,0,.94,.405,mat("#25dfff",.2,.3,{emissive:"#0788aa",emissiveIntensity:1.15}),false);
 box(reception,3.55,.045,.055,0,.19,.405,mat("#a56cff",.22,.3,{emissive:"#5c21a5",emissiveIntensity:.9}),false);
 for(const x of [-1.42,1.42]){box(reception,.12,.72,.7,x,.52,0,mat("#304c69",.3,.45));box(reception,.16,.08,.72,x,.12,0,mat("#21cfff",.2,.3,{emissive:"#087d9d",emissiveIntensity:.8}),false);}
 const laptop=new THREE.Group();laptop.position.set(.18,1.12,.12);laptop.rotation.y=Math.PI;laptop.scale.set(.78,.78,.78);reception.add(laptop);
 box(laptop,.9,.045,.58,0,.02,0,mat("#8798aa",.25,.72));
 box(laptop,.86,.48,.035,0,.275,-.255,mat("#202b3a",.2,.55));
 box(laptop,.78,.39,.012,0,.28,-.232,mat("#0a1b2d",.18,.2,{emissive:"#087ba5",emissiveIntensity:.4}),false);
 box(laptop,.58,.012,.2,0,.052,.12,mat("#263c52",.3,.35),false);
 box(laptop,.2,.008,.11,0,.052,.28,mat("#7894aa",.25,.55),false);
 const laptopScreen=new THREE.Mesh(new THREE.PlaneGeometry(.72,.32),signMaterial("UGLY ADMIN","TAP TO MANAGE GUESTS"));laptopScreen.material.side=THREE.DoubleSide;laptopScreen.material.needsUpdate=true;laptopScreen.position.set(0,.28,-.222);laptop.add(laptopScreen);
 makeLabel(scene,"RECEPTION",0,2.12,6.48,2.5,.4);
 interactables.push({position:new THREE.Vector3(0,0,7.22),name:"Ноутбук администратора",hint:"НОУТБУК РЕСЕПШЕНА · НАЖМИ, ЧТОБЫ ПРИНЯТЬ ПОСЕТИТЕЛЯ",action:"open_reception",radius:2.25});
 const spots=[[-5.1,-3.4],[-1.8,-3.4],[1.8,-3.4],[5.1,-3.4],[-5.1,2],[-1.8,2],[1.8,2],[5.1,2]];
 for(let i=0;i<8;i++)makeGamingStation(spots[i][0],spots[i][1],i,state.clubData?.stations?.[i]||{tier:1});
 for(const x of [-7,-3,3,7]){box(scene,.13,4.5,.13,x,2.5,-5.2,mat("#71849a",.28,.65));box(scene,1.8,.07,.3,x,4.55,-5.2,mat("#f2f7ff",.2,.1,{emissive:"#cceeff",emissiveIntensity:1.2}),false);}
 for(const x of [-6,0,6])for(const z of [-6,0,6]){box(scene,1.8,.07,.38,x,4.65,z,mat("#dcecff",.2,.1,{emissive:"#8bdcff",emissiveIntensity:1}),false);const l=new THREE.PointLight("#77bfff",28,8);l.position.set(x,4.05,z);scene.add(l);}
 for(const x of [-7.8,7.8]){box(scene,.05,2.4,4.4,x,2.25,-1,mat("#12253b",.25,.25));for(let i=0;i<5;i++)box(scene,.035,.12,.55,x+(x<0?.04:-.04),1.4+i*.35,-1.8+i*.75,mat(i%2?"#21d5ff":"#b66cff",.22,.3,{emissive:i%2?"#0780a5":"#6125a0",emissiveIntensity:.9}),false);}
 player=makePerson(0,7.7,"#2877c9",true,0);makeLabel(scene,"YOU",0,2.3,7.7,1,.28);
 syncClubNPCs();
}
function resize() {
  const canvas = $("uglyBusinessCanvas");
  if (!renderer || !canvas || !camera) return;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
function currentInput() {
  let x = moveX, y = moveY;
  if (keys.KeyA || keys.ArrowLeft) x -= 1;
  if (keys.KeyD || keys.ArrowRight) x += 1;
  if (keys.KeyW || keys.ArrowUp) y -= 1;
  if (keys.KeyS || keys.ArrowDown) y += 1;
  const length = Math.hypot(x, y);
  if (length > 1) { x /= length; y /= length; }
  return { x, y, length: Math.min(1, length) };
}
function findInteractable() {
  let best = null, bestDistance = Infinity;
  for (const item of interactables) {
    if ((item.station ?? item.index ?? 0) >= (state.stations || 4)) continue;
    const d = player.position.distanceTo(item.position);
    if (d < item.radius && d < bestDistance) { best = item; bestDistance = d; }
  }
  return best;
}
function updateCamera(dt) {
  const behindX = Math.sin(yaw) * cameraDistance;
  const behindZ = Math.cos(yaw) * cameraDistance;
  const desired = _v.set(player.position.x + behindX, player.position.y + cameraHeight, player.position.z + behindZ);
  camera.position.lerp(desired, 1 - Math.pow(.001, dt));
  camera.lookAt(player.position.x, player.position.y + 1.05, player.position.z);
}
function animate() {
  raf = requestAnimationFrame(animate);
  if (!ready) return;
  const dt = Math.min(clock.getDelta(), .04), input = currentInput();
  // Forward is the direction the character faces; up on the stick moves into the store.
  tempForward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
  tempRight.set(Math.cos(yaw), 0, -Math.sin(yaw));
  tempMove.copy(tempForward).multiplyScalar(-input.y).addScaledVector(tempRight, input.x);
  if (tempMove.lengthSq() > .002) {
    tempMove.normalize();
    player.position.addScaledVector(tempMove, dt * 3.65 * Math.max(.25, input.length));
    const targetYaw = Math.atan2(-tempMove.x, -tempMove.z);
    let diff = targetYaw - player.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    player.rotation.y += diff * (1-Math.exp(-dt*9));
  }
  const roomBound=7.15+Number(state.clubData.roomLevel||0)*2;
  player.position.x = clamp(player.position.x, -roomBound, roomBound);
  player.position.z = clamp(player.position.z, -roomBound, roomBound);
  const moving = input.length > .08;
  for (const a of animated) {
    if (a.type === "idle") a.mesh.position.y = Math.sin(performance.now() * .0017 + a.phase) * .025;
    if(a.type==="character"){
 const npc=clubNPCs.find(n=>n.mesh===a.root),walk=a.isPlayer?moving:!!npc&&(npc.mode==="toSeat"||npc.mode==="toQueue");
 const speed=a.isPlayer?(moving?Math.max(.25,input.length)*3.65:0):(walk?1.35:0),stride=walk?Math.min(.62,speed*.2):0,phase=a.phase;
 a.phase=(a.phase+dt*(walk?speed*2.45:1.05))%(Math.PI*2);
 a.torsoPivot.position.y=1.12+(walk?Math.abs(Math.sin(phase*2))*.045:Math.sin(a.phase)*.006);
 a.torsoPivot.rotation.x=walk?.045:0;a.torsoPivot.rotation.z=walk?Math.sin(phase)*.035:0;
 a.limbs.forEach(l=>{const swing=Math.sin(phase+l.side*Math.PI),lift=Math.max(0,Math.cos(phase+l.side*Math.PI));const seated=!a.isPlayer&&npc?.mode==="play";l.leg.rotation.x=seated?-.95:swing*stride;l.calf.rotation.x=seated?1.05:walk?lift*.48:0;l.foot.rotation.x=seated?-.12:walk?-lift*.12:0;l.arm.rotation.x=seated?-.72:-swing*stride*.78;l.forearm.rotation.x=seated?-.42:walk?-.12-lift*.22:0;});
}
  }
  const now = performance.now();
  for (const npc of clubNPCs) {
    const qi=(state.clubData.queue||[]).findIndex(q=>q.id===npc.id),session=(state.clubData.sessions||[]).find(q=>q.id===npc.id);let dest;
    if(session){const spots=[[-5.1,-3.4],[-1.8,-3.4],[1.8,-3.4],[5.1,-3.4],[-5.1,2],[-1.8,2],[1.8,2],[5.1,2]],p=spots[session.station]||spots[0];dest=new THREE.Vector3(p[0],npc.mode==="play"?.24:0,p[1]+1.05);if(npc.mode!=="play")npc.mode="toSeat";}
    else if(qi>=0){dest=new THREE.Vector3(-.9+(qi%3)*.9,0,5.82+Math.floor(qi/3)*.42);if(npc.mode!=="queue")npc.mode="toQueue";}
    else{npc.mode="exit";dest=new THREE.Vector3(0,0,8.5);}
    const delta=dest.clone().sub(npc.mesh.position),distance=delta.length();
    if(distance>.09){const target=Math.atan2(-delta.x,-delta.z);let turn=Math.atan2(Math.sin(target-npc.mesh.rotation.y),Math.cos(target-npc.mesh.rotation.y));npc.mesh.rotation.y+=turn*Math.min(1,dt*7);npc.mesh.position.addScaledVector(delta.normalize(),Math.min(distance,dt*1.5));}
    else if(session){npc.mode="play";npc.mesh.position.y=.24;npc.mesh.rotation.y=0;npc.mesh.scale.y=.82;const a=animated.find(x=>x.root===npc.mesh);if(a)a.limbs.forEach(l=>{l.arm.rotation.x=-.7;l.leg.rotation.x=.8;});}
    else if(qi>=0){npc.mode="queue";npc.mesh.position.y=Math.sin(now*.004+npc.phase)*.018;}
  }
  for(let i=clubNPCs.length-1;i>=0;i--){if(clubNPCs[i].mode==="exit"&&clubNPCs[i].mesh.position.z>8.25){scene.remove(clubNPCs[i].mesh);const ai=animated.findIndex(a=>a.root===clubNPCs[i].mesh);if(ai>=0)animated.splice(ai,1);clubNPCs.splice(i,1);}}

  stationGroups.forEach((g,i)=>g.visible=i<(state.stations||4));
  updateCamera(dt);
  activeObject = findInteractable();
  $("simHint").textContent = activeObject ? activeObject.hint : "Двигайся по клубу. Подойди к ресепшену или игровому месту.";
  $("simAction").disabled = !activeObject || actionBusy;
  if(activeObject?.action==="upgrade_component"){
    const st=(state.clubData.stations||[])[Number(activeObject.station)],lv=Number(st?.components?.[activeObject.component]||st?.tier||1),next=lv+1,price=[0,500,2500,11000,24000][next]||0;
    $("simAction").textContent=lv>=4?"МАКСИМАЛЬНЫЙ УРОВЕНЬ":"УЛУЧШИТЬ "+activeObject.name.toUpperCase()+" · $"+price.toLocaleString("ru-RU");
    $("simAction").disabled=actionBusy||lv>=4;
  }else{
    $("simAction").textContent = activeObject ? (activeObject.action==="open_reception"?"ОТКРЫТЬ НОУТБУК":"УЛУЧШИТЬ · "+activeObject.name.toUpperCase()) : "ПОДОЙДИ БЛИЖЕ";
  }
  if (renderer) renderer.render(scene, camera);
}
function syncClubNPCs(){
 const desired=(state.clubData.queue||[]).concat(state.clubData.sessions||[]);
 for(const d of desired){
  if(clubNPCs.some(n=>n.id===d.id))continue;
  const colors=["#e45d48","#43a77b","#8357b9","#e2a33b","#347db7","#d65b9a"];
  const mesh=makePerson(3.4,8.1,colors[clubNPCs.length%colors.length],false,clubNPCs.length+1);
  clubNPCs.push({id:d.id,mesh,phase:Math.random()*6,mode:"toQueue",station:d.station});
 }
 for(let i=clubNPCs.length-1;i>=0;i--){
  if(!desired.some(d=>d.id===clubNPCs[i].id)){
   scene.remove(clubNPCs[i].mesh);
   const ai=animated.findIndex(a=>a.root===clubNPCs[i].mesh);
   if(ai>=0)animated.splice(ai,1);
   clubNPCs.splice(i,1);
  }
 }
}
function renderClubPanels(){
 const qb=$("simQueue"),ub=$("simUpgradePanel"),sb=$("simSessions");
 const queue=state.clubData.queue||[],sessions=state.clubData.sessions||[],stations=state.clubData.stations||[];
 const busy=new Set(sessions.map(x=>Number(x.station)));
 const free=stations.map((x,i)=>i).filter(i=>!busy.has(i));
 if(qb){
  qb.innerHTML="";
  if(!queue.length)qb.textContent="Ожидаем посетителей у стойки ресепшена.";
  queue.forEach((q,i)=>{
   const row=document.createElement("div");row.className="sim-queue-row";
   const label=document.createElement("b");label.textContent="🧍 "+(q.name||"Посетитель")+" · ожидает у стойки №"+(i+1);row.appendChild(label);
   const status=document.createElement("span");status.textContent=free.length?"Готов к оформлению на ноутбуке администратора":"Нет свободных компьютеров";row.appendChild(status);qb.appendChild(row);
  });
 }
 const names={gpu:"Видеокарта",cpu:"Процессор",ram:"ОЗУ",monitor:"Монитор",keyboard:"Клавиатура",mouse:"Мышь",chair:"Кресло",desk:"Стол"};
 if(ub){
  ub.innerHTML="";
  stations.forEach((st,i)=>{
   const wrap=document.createElement("div");wrap.className="sim-upgrade-station";
   const head=document.createElement("b");head.textContent="ИГРОВОЕ МЕСТО №"+(i+1);wrap.appendChild(head);
   const grid=document.createElement("div");grid.className="sim-component-grid";
   Object.keys(names).forEach(k=>{
    const lv=Number((st.components||{})[k]||st.tier||1),next=lv+1,price=[0,500,2500,11000,24000][next]||0;
    const item=document.createElement("div");item.className="sim-component";
    const title=document.createElement("span");title.textContent=names[k];
    const level=document.createElement("b");level.textContent="LVL "+lv+"/4";
    const button=document.createElement("button");button.type="button";button.dataset.upgradeStation=i;button.dataset.upgradeComponent=k;button.disabled=lv>=4;button.textContent=lv>=4?"MAX":"УЛУЧШИТЬ ДО LVL "+next+" · $"+price.toLocaleString("ru-RU");
    item.append(title,level,button);grid.appendChild(item);
   });
   wrap.appendChild(grid);ub.appendChild(wrap);
  });
 }
 if(sb){
  sb.innerHTML="";
  if(!sessions.length)sb.textContent="Сейчас никто не играет.";
  sessions.forEach(x=>{
   const left=Math.max(0,Math.ceil((new Date(x.endsAt).getTime()-Date.now())/1000));
   const row=document.createElement("div");row.className="sim-session-row";
   const title=document.createElement("b");title.textContent=(x.name||"Посетитель")+" · ПК №"+(Number(x.station)+1);
   const time=document.createElement("span");time.textContent="Осталось "+Math.floor(left/60)+":"+String(left%60).padStart(2,"0")+" · оплата $"+Number(x.reward||0).toLocaleString("ru-RU");
   row.append(title,time);sb.appendChild(row);
  });
 }
}
async function tapClub(){
 const button=$("simTapButton");if(button)button.disabled=true;
 try{const data=await api("/api/simulator/tap",{method:"POST",body:"{}"});Object.assign(state,data.state||{});updateHUD();toast("+$"+data.reward+" на счёт клуба");}
 catch(error){toast(error.message,"error");}
 finally{if(button)button.disabled=false;}
}
function openReception(){
 const modal=$("simReceptionModal"),queue=state.clubData.queue||[];if(!modal)return;
 if(!queue.length){toast("Пока никто не подошёл к ресепшену","info");return;}
 receptionGuestId=queue[0].id;receptionDuration=120+Math.floor(Math.random()*181);renderReceptionModal();modal.classList.add("open");modal.setAttribute("aria-hidden","false");
}
function closeReception(){const modal=$("simReceptionModal");if(modal){modal.classList.remove("open");modal.setAttribute("aria-hidden","true");}receptionGuestId=null;}
function renderReceptionModal(){
 const modal=$("simReceptionModal");if(!modal)return;const guest=(state.clubData.queue||[]).find(x=>x.id===receptionGuestId);if(!guest){closeReception();return;}
 const sessions=state.clubData.sessions||[],stations=state.clubData.stations||[],busy=new Set(sessions.map(x=>Number(x.station)));
 const select=$("simReceptionStation");$("simReceptionGuest").textContent=guest.name||"Посетитель";
 $("simReceptionDuration").textContent=Math.floor(receptionDuration/60)+" мин "+String(receptionDuration%60).padStart(2,"0")+" сек";
 select.innerHTML="";
 stations.forEach((st,i)=>{if(busy.has(i))return;const c=st.components||{},tier=Math.max(1,Math.min(4,...["gpu","cpu","ram","monitor","keyboard","mouse","chair","desk"].map(k=>Number(c[k]||st.tier||1))));const paymentRange=[null,[500,1000],[2000,4000],[5000,7000],[10000,15000]][tier];const opt=document.createElement("option");opt.value=i;const quotedReward=paymentRange[0]+Math.floor(Math.random()*(paymentRange[1]-paymentRange[0]+1));opt.dataset.reward=quotedReward;opt.textContent="ПК №"+(i+1)+" · "+["","Бюджет","Средний","Высокий","Премиум"][tier]+" · оплата $"+quotedReward.toLocaleString("ru-RU");select.appendChild(opt);});
 const update=()=>{const opt=select.selectedOptions[0],reward=Number(opt?.dataset.reward||0);$("simReceptionPrice").textContent=opt?"$"+reward.toLocaleString("ru-RU"):"—";$("simReceptionConfirm").disabled=!opt;$("simReceptionHint").textContent=opt?"Выдай посетителю свободный ПК. Оплата поступит в кассу после окончания сессии.":"Свободных ПК нет — дождись освобождения места.";};select.onchange=update;update();
}
function rebuildClubScene(){
 const position=player?player.position.clone():new THREE.Vector3(0,0,7.7),rotation=player?player.rotation.y:0;
 interactables.length=0;animated.length=0;stationGroups.length=0;clubNPCs.length=0;
 buildStore();player.position.copy(position);player.rotation.y=rotation;resize();
}
function updateHUD() {
  $("simCash").textContent = "$" + Number(state.cash || 0).toLocaleString("ru-RU");
  $("simLevel").textContent = state.level || 1;
  $("simCustomers").textContent = state.customers || 0;
  $("simXpText").textContent = (Number(state.xp || 0) % 100) + " / 100 опыта";
  $("simXpFill").style.width = (Number(state.xp || 0) % 100) + "%";
  if ($("simStations")) $("simStations").textContent = (state.stations || 4) + " / 8";
  if ($("simIncome")) $("simIncome").textContent = "$" + Number(state.hourlyIncome || 0).toLocaleString("ru-RU") + "/ч";
  if ($("simAdLevel")) $("simAdLevel").textContent = state.adLevel || 0;
  const expand=$("simExpandRoom"),rl=Number(state.clubData.roomLevel||0),rp=[12000,25000,50000];if(expand){expand.disabled=rl>=3;expand.textContent=rl>=3?"🏢 ЗАЛ МАКСИМАЛЬНОГО УРОВНЯ":"🏢 РАСШИРИТЬ ЗАЛ · $"+rp[rl].toLocaleString("ru-RU");}
  stationGroups.forEach((g,i)=>g.visible=i<(state.stations||4));
  renderClubPanels();if(scene)syncClubNPCs();
}
async function loadState() {
  try {
    const data = await api("/api/simulator/state");
    Object.assign(state, data.state || {}); updateHUD();
  } catch (error) { $("simHint").textContent = error.message; }
}
async function doAction(action,extra={}){if(actionBusy)return;actionBusy=true;$("simAction").disabled=true;try{const d=await api("/api/simulator/action",{method:"POST",body:JSON.stringify({action,...extra})});Object.assign(state,d.state||{});updateHUD();if(["expand_room","upgrade_component","buy_station"].includes(action)&&scene)rebuildClubScene();if(action==="start_session")closeReception();toast(d.message||"Готово");$("simHint").textContent=d.message||"Готово";}catch(e){toast(e.message,"error");}finally{actionBusy=false;$("simAction").disabled=!activeObject;}}
function joystickPoint(event) {
  const dx = event.clientX - joyCenter.x, dy = event.clientY - joyCenter.y;
  const length = Math.hypot(dx, dy), deadZone = 5;
  const max = joystickRadius;
  const scaled = length <= deadZone ? 0 : Math.min(1, (length - deadZone) / (max - deadZone));
  const angleScale = length > 0 ? scaled / length : 0;
  const x = dx * angleScale * max, y = dy * angleScale * max;
  $("simStick").style.transform = "translate(" + x + "px," + y + "px)";
  moveX = x / max; moveY = y / max;
}
function bindControls() {
  const joy = $("simJoystick"), canvas = $("uglyBusinessCanvas"), stick = $("simStick");
  joy.addEventListener("pointerdown", event => {
    event.preventDefault(); event.stopPropagation();
    if (joyPointer !== null) return;
    joyPointer = event.pointerId; joy.setPointerCapture(event.pointerId);
    const rect = joy.getBoundingClientRect();
    joyCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    joystickPoint(event);
  });
  joy.addEventListener("pointermove", event => {
    if (event.pointerId !== joyPointer) return;
    event.preventDefault(); joystickPoint(event);
  });
  const releaseJoy = event => {
    if (event.pointerId !== joyPointer) return;
    joyPointer = null; moveX = 0; moveY = 0; stick.style.transform = "translate(0,0)";
  };
  joy.addEventListener("pointerup", releaseJoy);
  joy.addEventListener("pointercancel", releaseJoy);
  joy.addEventListener("lostpointercapture", releaseJoy);
  // Swipe on the right side of the scene to orbit the camera without stealing the joystick.
  canvas.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.clientX < canvas.getBoundingClientRect().left + canvas.clientWidth * .42) return;
    lookPointer = event.pointerId; lookLastX = event.clientX;
    try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
  });
  canvas.addEventListener("pointermove", event => {
    if (event.pointerId !== lookPointer) return;
    const dx = event.clientX - lookLastX; lookLastX = event.clientX;
    yaw -= dx * .0065;
  });
  const releaseLook = event => { if (event.pointerId === lookPointer) lookPointer = null; };
  canvas.addEventListener("pointerup", releaseLook);
  canvas.addEventListener("pointercancel", releaseLook);
  $("simAction").addEventListener("click",()=>{if(!activeObject)return;if(activeObject.action==="open_reception"){openReception();return;}doAction(activeObject.action||"upgrade_station",{station:activeObject.station??activeObject.index,component:activeObject.component});});
  $("simReceptionClose")?.addEventListener("click",closeReception);
  $("simReceptionModal")?.addEventListener("click",e=>{if(e.target===$("simReceptionModal"))closeReception();});
  $("simReceptionConfirm")?.addEventListener("click",()=>{const select=$("simReceptionStation");if(receptionGuestId&&select?.value!=="")doAction("start_session",{queueId:receptionGuestId,station:Number(select.value),duration:receptionDuration,expectedReward:Number(select.selectedOptions[0]?.dataset.reward||0)});});
  $("simTapButton")?.addEventListener("click",tapClub);
  $("simQueue")?.addEventListener("click",event=>{const b=event.target.closest("[data-confirm-guest]");if(!b)return;const id=b.dataset.confirmGuest,sel=$("simQueue").querySelector('[data-station-for="'+id+'"]');if(sel)doAction("start_session",{queueId:id,station:Number(sel.value)});});
  $("simUpgradePanel")?.addEventListener("click",event=>{const b=event.target.closest("[data-upgrade-component]");if(!b)return;doAction("upgrade_component",{station:Number(b.dataset.upgradeStation),component:b.dataset.upgradeComponent});});
  $("simBuyStation")?.addEventListener("click",()=>doAction("buy_station"));
  $("simExpandRoom")?.addEventListener("click",()=>doAction("expand_room"));
  $("simAdvertise")?.addEventListener("click",()=>doAction("advertise"));
  $("simCashout")?.addEventListener("click",async()=>{try{const d=await api("/api/simulator/exchange",{method:"POST",body:JSON.stringify({currency:"gramm"})});Object.assign(state,d.state||{});updateHUD();toast("Зачислено "+d.gramm+" GRAMM на основной баланс");}catch(e){toast(e.message,"error");}});
  window.addEventListener("keydown", event => {
    if (["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.code)) {
      keys[event.code] = true; event.preventDefault();
    }
    if (event.code === "KeyE" && activeObject) {if(activeObject.action==="open_reception")openReception();else doAction(activeObject.action||"upgrade_station",{station:activeObject.station??activeObject.index,component:activeObject.component});}
  });
  window.addEventListener("keyup", event => { keys[event.code] = false; });
  window.addEventListener("blur", () => { Object.keys(keys).forEach(key => keys[key] = false); moveX = moveY = 0; });
}
window.initUglyBusiness = async function() {
  if (ready) { resize(); return; }
  if (!initData) { $("simHint").textContent = "Открой игру через Telegram"; return; }
  try {
    const canvas = $("uglyBusinessCanvas");
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
    await loadState(); buildStore(); clock = new THREE.Clock(); bindControls(); ready = true; resize();
    if(statePollTimer)clearInterval(statePollTimer);statePollTimer=setInterval(()=>{if(ready&&$("simulator")?.classList.contains("active"))loadState();},5000);
    yaw = 0; camera.position.set(0, 3.2, 11.2); camera.lookAt(player.position.x, 1, player.position.z);
    animate();
  } catch (error) {
    $("simHint").textContent = "Не удалось запустить 3D: " + error.message;
    console.error("UGLY BUSINESS 3D:", error);
  }
};
const page = $("simulator");
if (page) {
  const observer = new MutationObserver(() => {
    if (page.classList.contains("active")) window.initUglyBusiness();
    else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  });
  observer.observe(page, { attributes: true, attributeFilter: ["class"] });
  if (page.classList.contains("active")) window.initUglyBusiness();
}
window.addEventListener("resize", resize);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
  else if (!document.hidden && ready && $("simulator")?.classList.contains("active") && !raf) { clock.start(); animate(); }
});
