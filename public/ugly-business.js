import * as THREE from "three";

const $ = id => document.getElementById(id);
const initData = window.Telegram?.WebApp?.initData || "";
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const state = { cash:0, level:1, customers:0, xp:0, stations:4, adLevel:0, hourlyIncome:0, clubData:{stations:[],queue:[],consoleQueue:[],sessions:[],consoleSessions:[]} };
let renderer, scene, camera, player, clock, ready = false, raf = 0;
let compactDevice=false, lowPowerDevice=false, frameInterval=0, lastFrameAt=0, stageResizeObserver=null;
let yaw = 0, moveX = 0, moveY = 0, activeObject = null, actionBusy = false;
let joyPointer = null, lookPointer = null, lookLastX = 0, joyCenter = { x: 0, y: 0 };
let joystickRadius = 48, cameraDistance = 5.8, cameraHeight = 3.2;
const interactables = [], animated = [], keys = Object.create(null);
const stationGroups=[],consoleGroups=[], clubNPCs=[];let statePollTimer=0, receptionGuestId=null, receptionDuration=180, receptionMode="pc";
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
  dark: mat("#25292c", .45),
  metal: mat("#879197", .32, .72),
  steel: mat("#c3c9c9", .25, .8),
  woodLight: mat("#bd8b50"),
  gold: mat("#c89a42", .35, .55)
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
  texture.anisotropy = Math.min(16,renderer?.capabilities?.getMaxAnisotropy?.() || 4);
  return texture;
}
function studioEnvironmentTexture() {
  const texture = canvasTexture((ctx,w,h) => {
    const sky=ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,"#52647d");sky.addColorStop(.42,"#202d43");sky.addColorStop(1,"#080e1b");
    ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    const panels=[
      [w*.12,h*.34,w*.055,h*.3,"rgba(111,224,255,.95)"],
      [w*.36,h*.28,w*.075,h*.22,"rgba(255,222,177,.92)"],
      [w*.64,h*.31,w*.07,h*.26,"rgba(164,125,255,.9)"],
      [w*.88,h*.38,w*.045,h*.28,"rgba(255,111,170,.82)"]
    ];
    for(const [x,y,pw,ph,color] of panels){
      const glow=ctx.createRadialGradient(x,y,2,x,y,Math.max(pw,ph)*1.9);
      glow.addColorStop(0,color);glow.addColorStop(1,"rgba(20,35,58,0)");
      ctx.fillStyle=glow;ctx.fillRect(x-pw*2,y-ph*2,pw*4,ph*4);
      ctx.fillStyle=color;ctx.fillRect(x-pw/2,y-ph/2,pw,ph);
    }
    const warm=ctx.createRadialGradient(w*.5,h*.08,4,w*.5,h*.08,h*.48);
    warm.addColorStop(0,"rgba(255,236,205,.36)");warm.addColorStop(1,"rgba(255,236,205,0)");
    ctx.fillStyle=warm;ctx.fillRect(0,0,w,h);
  },1024,512);
  texture.mapping=THREE.EquirectangularReflectionMapping;
  texture.needsUpdate=true;
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
const surfaceMaps = Object.create(null);
function surfaceTexture(kind) {
  if (surfaceMaps[kind]) return surfaceMaps[kind];
  const texture = canvasTexture((ctx,w,h) => {
    const palettes = {
      floor:["#29384b","#35475d"], wall:["#101b31","#1c3150"],
      wood:["#765039","#a87950"], metal:["#8798a8","#bac5cf"],
      fabric:["#202d40","#34465d"], plastic:["#182638","#293c52"],
      rubber:["#171e29","#252e3a"], ceiling:["#101827","#1b2940"]
    };
    const p=palettes[kind]||palettes.plastic;
    ctx.fillStyle=p[0];ctx.fillRect(0,0,w,h);
    if(kind==="floor"){
      const tile=128;
      for(let y=0;y<h;y+=tile)for(let x=0;x<w;x+=tile){
        const g=ctx.createLinearGradient(x,y,x+tile,y+tile);g.addColorStop(0,"#52657a");g.addColorStop(1,"#2d3e53");
        ctx.fillStyle=g;ctx.fillRect(x+3,y+3,tile-6,tile-6);
        ctx.strokeStyle="rgba(5,12,22,.88)";ctx.lineWidth=7;ctx.strokeRect(x+3,y+3,tile-6,tile-6);
        ctx.strokeStyle="rgba(190,218,239,.2)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+12,y+12);ctx.lineTo(x+tile-12,y+12);ctx.stroke();
        ctx.strokeStyle="rgba(255,255,255,.08)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+14,y+tile-18);ctx.lineTo(x+tile-14,y+tile-18);ctx.stroke();
        for(let n=0;n<90;n++){const px=x+8+Math.random()*(tile-16),py=y+8+Math.random()*(tile-16);ctx.fillStyle=Math.random()>.5?"rgba(255,255,255,.045)":"rgba(0,0,0,.055)";ctx.fillRect(px,py,1.5,1.5);}
      }
    } else if(kind==="wood"){
      for(let i=0;i<150;i++){const y=(i/150)*h,alpha=.035+Math.random()*.11;ctx.strokeStyle="rgba(24,10,4,"+alpha+")";ctx.lineWidth=1+Math.random()*4;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(w*.28,y-8,w*.66,y+9,w,y+(Math.random()-.5)*14);ctx.stroke();}
      for(let i=0;i<18;i++){ctx.strokeStyle="rgba(220,174,119,.12)";ctx.beginPath();ctx.ellipse(Math.random()*w,Math.random()*h,12+Math.random()*34,3+Math.random()*7,0,0,Math.PI*2);ctx.stroke();}
    } else if(kind==="plastic"){
      const sheen=ctx.createLinearGradient(0,0,w,h);sheen.addColorStop(0,"rgba(255,255,255,.12)");sheen.addColorStop(.22,"rgba(255,255,255,.015)");sheen.addColorStop(.7,"rgba(0,0,0,.12)");sheen.addColorStop(1,"rgba(255,255,255,.06)");ctx.fillStyle=sheen;ctx.fillRect(0,0,w,h);
      for(let y=0;y<h;y+=12){ctx.strokeStyle="rgba(180,220,255,.035)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
      for(let i=0;i<2600;i++){const a=Math.random()*.045;ctx.fillStyle=Math.random()>.5?"rgba(255,255,255,"+a+")":"rgba(0,0,0,"+a+")";ctx.fillRect(Math.random()*w,Math.random()*h,1,1);}
    } else if(kind==="metal"){
      for(let i=0;i<900;i++){const y=Math.random()*h;ctx.fillStyle="rgba(255,255,255,"+(Math.random()*.09)+")";ctx.fillRect(0,y,w,1);}
      for(let i=0;i<260;i++){ctx.fillStyle="rgba(5,15,25,"+(Math.random()*.07)+")";ctx.fillRect(Math.random()*w,Math.random()*h,1,2);}
    } else if(kind==="fabric"){
      for(let y=0;y<h;y+=5)for(let x=0;x<w;x+=5){ctx.fillStyle=((x+y)%10===0)?"rgba(255,255,255,.075)":"rgba(0,0,0,.12)";ctx.fillRect(x,y,2,2);}
      ctx.strokeStyle="rgba(190,215,238,.08)";ctx.lineWidth=1;for(let i=0;i<w;i+=16){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,h);ctx.stroke();}
    } else if(kind==="wall"){
      const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,"#182943");bg.addColorStop(.52,"#0d1729");bg.addColorStop(1,"#223958");ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
      const panelW=128;
      for(let x=0;x<w;x+=panelW){
        const pg=ctx.createLinearGradient(x,0,x+panelW,0);pg.addColorStop(0,"rgba(255,255,255,.055)");pg.addColorStop(.12,"rgba(255,255,255,.012)");pg.addColorStop(.88,"rgba(0,0,0,.12)");pg.addColorStop(1,"rgba(255,255,255,.045)");
        ctx.fillStyle=pg;ctx.fillRect(x+3,4,panelW-6,h-8);
        ctx.strokeStyle="rgba(105,166,211,.22)";ctx.lineWidth=2;ctx.strokeRect(x+7,9,panelW-14,h-18);
        ctx.fillStyle="rgba(34,207,255,.28)";ctx.fillRect(x+12,18,3,h-36);
        ctx.fillStyle="rgba(177,111,255,.2)";ctx.fillRect(x+panelW-16,18,2,h-36);
        for(const yy of [22,h-22]){ctx.fillStyle="rgba(195,220,245,.35)";ctx.beginPath();ctx.arc(x+panelW/2,yy,2.5,0,Math.PI*2);ctx.fill();}
        ctx.strokeStyle="rgba(180,210,240,.09)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+24,h*.34);ctx.lineTo(x+panelW-24,h*.34);ctx.moveTo(x+24,h*.68);ctx.lineTo(x+panelW-24,h*.68);ctx.stroke();
      }
      ctx.fillStyle="rgba(20,210,255,.22)";ctx.fillRect(0,0,w,7);ctx.fillStyle="rgba(155,91,255,.2)";ctx.fillRect(0,h-7,w,7);
      for(let i=0;i<1800;i++){const a=Math.random()*.045;ctx.fillStyle=Math.random()>.5?"rgba(255,255,255,"+a+")":"rgba(0,0,0,"+a+")";ctx.fillRect(Math.random()*w,Math.random()*h,1,1);}
    } else if(kind==="ceiling"){
      const panel=ctx.createLinearGradient(0,0,w,h);panel.addColorStop(0,"rgba(130,175,220,.13)");panel.addColorStop(.5,"rgba(0,0,0,.04)");panel.addColorStop(1,"rgba(130,175,220,.1)");ctx.fillStyle=panel;ctx.fillRect(0,0,w,h);
      for(let x=0;x<w;x+=128){ctx.fillStyle="rgba(0,0,0,.2)";ctx.fillRect(x,0,4,h);ctx.fillStyle="rgba(140,205,245,.1)";ctx.fillRect(x+5,0,2,h);}
      for(let y=0;y<h;y+=128){ctx.fillStyle="rgba(0,0,0,.16)";ctx.fillRect(0,y,w,4);ctx.fillStyle="rgba(140,205,245,.08)";ctx.fillRect(0,y+5,w,2);}
      for(let i=0;i<3600;i++){const v=Math.random(),a=.018+Math.random()*.045;ctx.fillStyle=v>.5?"rgba(255,255,255,"+a+")":"rgba(0,0,0,"+a+")";ctx.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*2);}
    } else {
      for(let i=0;i<4200;i++){const a=Math.random()*.08;ctx.fillStyle=Math.random()>.5?"rgba(255,255,255,"+a+")":"rgba(0,0,0,"+a+")";ctx.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*2);}
    }
  },1024,1024);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(kind==="floor"?2.5:kind==="wall"?1.35:1,kind==="floor"?2.5:kind==="wall"?1.35:1);
  texture.anisotropy=Math.min(16,renderer?.capabilities?.getMaxAnisotropy?.()||8);
  surfaceMaps[kind]=texture;return texture;
}
function surfaceMat(color,kind,roughness=.65,metalness=0,extra={}) {
  const map=surfaceTexture(kind);
  const scale=kind==="metal"?.012:kind==="fabric"?.035:kind==="wall"?.04:kind==="wood"?.028:kind==="floor"?.022:.012;
  const material=mat(color,roughness,metalness,{map,bumpMap:map,bumpScale:scale,...extra});
  material.envMapIntensity=kind==="metal"?.9:kind==="plastic"?.55:.35;
  return material;
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
  // Recessed fixture mounted directly below the room ceiling, with a visible luminous diffuser.
  box(scene, 1.65, .10, .62, x, 4.78, z, surfaceMat("#26384c","metal",.28,.72), false);
  box(scene, 1.42, .035, .40, x, 4.705, z, mat("#fff4d9", .16, .05, {emissive:"#ffe5b2",emissiveIntensity:1.35}), false);
  const light = new THREE.PointLight("#ffe7c3", 48, 10, 2);
  light.position.set(x, 4.48, z); light.castShadow = false; scene.add(light);
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
 animated.push({type:"character",root,torsoPivot,pelvis,head,limbs,phase:variant*.71,isPlayer});return root;
}
function makeGamingPC(parent,x,y,z,tier=1,cpuTier=1,ramTier=1){
 const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);
 const colors=["#202d3d","#15506d","#17634e","#56377c"],lights=["#27c8ff","#7c69ff","#35f0c0","#ffbf45"],emissives=["#0877a8","#3820a1","#087b55","#9c5700"],idx=clamp((tier||1)-1,0,3);
 const shell=surfaceMat(colors[idx],"plastic",.24,.58),dark=mat("#080e18",.22,.72),glass=mat("#7898b8",.12,.42,{transparent:true,opacity:.22,metalness:.42});
 const glow=mat(lights[idx],.2,.22,{emissive:emissives[idx],emissiveIntensity:1.35});
 // Premium tower chassis with glass side panel, machined trim and separated front intake.
 box(g,.52,.76,.48,0,.39,0,shell);
 box(g,.012,.65,.405,.267,.4,0,glass,false);
 box(g,.018,.67,.42,.277,.4,0,mat(lights[idx],.2,.35,{emissive:emissives[idx],emissiveIntensity:.18}),false);
 box(g,.018,.66,.018,.285,.4,-.205,mat("#b9d1e5",.22,.78),false);
 for(let i=0;i<4;i++)box(g,.018,.09,.018,.285,.12+i*.18,.205,mat("#a9bacb",.22,.75),false);
 // Three individually framed RGB intake fans.
 for(let i=0;i<3;i++){
  const yy=.61-i*.205;
  const ring=cylinder(g,.092,.092,.018,0,yy,-.252,mat("#0b1422",.22,.7),32);ring.rotation.x=Math.PI/2;
  const torus=new THREE.Mesh(new THREE.TorusGeometry(.071,.009,8,32),glow);torus.position.set(0,yy,-.267);torus.rotation.x=0;g.add(torus);
  const fan=cylinder(g,.055,.055,.012,0,yy,-.27,mat("#182b40",.26,.55),24);fan.rotation.x=Math.PI/2;
  for(let b=0;b<7;b++){const blade=box(g,.012,.055,.008,Math.cos(b*Math.PI*2/7)*.027,yy+Math.sin(b*Math.PI*2/7)*.027,-.28,mat("#9bb2c8",.3,.68),false);blade.rotation.z=b*Math.PI*2/7;}
  sphere(g,.018,0,yy,-.289,mat("#eaf8ff",.18,.65),16,12);
 }
 // Interior motherboard, GPU, memory and cooling hardware visible through the glass.
 box(g,.025,.48,.31,.225,.39,.015,mat("#142b35",.32,.65),false);
 const cpuIndex=clamp(cpuTier,1,4)-1,ramIndex=clamp(ramTier,1,4)-1;
 const partColors=["#ffbd45","#24cfff","#42e6a5","#bf82ff"],partEmits=["#704000","#00618a","#087a4d","#4a1a83"];
 box(g,.045,.18,.11,.245,.43,-.075,mat("#a6b5c5",.24,.82),false);
 box(g,.052,.13,.08,.245,.43,-.075,mat(partColors[cpuIndex],.22,.45,{emissive:partEmits[cpuIndex],emissiveIntensity:.65}),false);
 for(let i=0;i<Math.min(4,ramTier);i++){box(g,.018,.24,.035,.245,.37,.095+i*.047,mat(partColors[ramIndex],.22,.48,{emissive:partEmits[ramIndex],emissiveIntensity:.75}),false);box(g,.022,.018,.038,.245,.25,.095+i*.047,mat("#d7e1eb",.22,.8),false);}
 // Graphics card with dual fans and support bracket.
 box(g,.045,.105,.31,.245,.24,-.055,mat("#25374a",.24,.78),false);
 for(let i=0;i<2;i++){const fan=new THREE.Mesh(new THREE.TorusGeometry(.039,.006,6,24),glow);fan.position.set(.273,.24,-.13+i*.15);g.add(fan);cylinder(g,.012,.012,.012,.273,.24,-.13+i*.15,mat("#dbe8f2",.2,.75),12);}
 box(g,.02,.16,.31,.285,.24,-.055,mat("#a9b9c8",.22,.82),false);
 // Top I/O, vents and rubber feet.
 box(g,.27,.018,.16,0,.78,.02,mat("#101b2a",.3,.5),false);
 for(let i=0;i<8;i++)box(g,.012,.012,.11,-.12+i*.034,.794,.02,mat("#6e8298",.28,.7),false);
 for(const xx of [-.17,.17])for(const zz of [-.16,.16])cylinder(g,.035,.035,.035,xx,.02,zz,mat("#0a1018",.62,.1),16);
 const badge=mat("#d7e8f8",.24,.65,{emissive:lights[idx],emissiveIntensity:.35});box(g,.12,.025,.012,0,.71,-.247,badge,false);
 return g;
}function makeGamingStation(x,z,index,data){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 const c=data.components||{},levels=Object.values(c).map(Number).filter(v=>v>0),tier=levels.length?Math.min(4,...levels):Math.max(1,Number(data.tier)||1);
 const gpu=clamp(Number(c.gpu)||tier,1,4),cpu=clamp(Number(c.cpu)||tier,1,4),ram=clamp(Number(c.ram)||tier,1,4),monitor=clamp(Number(c.monitor)||tier,1,4),keyboard=clamp(Number(c.keyboard)||tier,1,4),mouse=clamp(Number(c.mouse)||tier,1,4),chairLevel=clamp(Number(c.chair)||tier,1,4),deskLevel=clamp(Number(c.desk)||tier,1,4);
 const palette=["#ffbd45","#24cfff","#42e6a5","#bf82ff"],emit=["#704000","#00618a","#087a4d","#4a1a83"],trim=mat(palette[gpu-1],.26,.42,{emissive:emit[gpu-1],emissiveIntensity:.55});
 const screenMat=mat("#fff",.24,.05,{map:canvasTexture((ctx,w,h)=>{const gr=ctx.createLinearGradient(0,0,w,h);gr.addColorStop(0,["#12314c","#0a5276","#104a38","#48265f"][monitor-1]);gr.addColorStop(1,["#07111f","#142b5a","#102b25","#211333"][monitor-1]);ctx.fillStyle=gr;ctx.fillRect(0,0,w,h);ctx.fillStyle="#fff";ctx.font="bold 38px Arial";ctx.fillText("UGLY",18,57);ctx.font="16px Arial";ctx.fillText("GAMING ARENA / PC "+(index+1),18,83);ctx.fillStyle=palette[monitor-1];ctx.fillRect(18,104,w*.72,7);},256,160),emissive:palette[monitor-1],emissiveIntensity:.12+monitor*.055});
 const deskPalette=["#26374b","#174d68","#18513f","#49315f"],deskGlow=["#71869c","#2b9ab5","#398b6c","#9270b8"],deskShell=surfaceMat(deskPalette[deskLevel-1],"plastic",.3,.42);box(g,2.1,.15,.92,0,.78,0,deskShell);box(g,2.12,.045,.94,0,.87,0,mat(palette[deskLevel-1],.26,.15,{emissive:emit[deskLevel-1],emissiveIntensity:.28+deskLevel*.1}),false);
 for(const sx of [-.9,.9]){box(g,.12,.76,.13,sx,.38,0,mat(deskGlow[deskLevel-1],.28,.62));box(g,.13,.035,.14,sx,.72,.03,mat(palette[deskLevel-1],.26,.15,{emissive:emit[deskLevel-1],emissiveIntensity:.35}),false);}
 box(g,.92,.60,.12,0,1.28,-.36,surfaceMat("#111b2b","plastic",.2,.52));
 box(g,.82,.49,.018,0,1.29,-.432,screenMat,false);
 box(g,.78,.018,.018,0,1.045,-.444,mat("#8298ad",.24,.62),false);
 sphere(g,.018,0,1.53,-.445,mat("#30dfff",.2,.3,{emissive:"#12a9df",emissiveIntensity:.8}),16,10);
 box(g,.12,.17,.13,0,1.02,-.34,mat("#71849a",.26,.58));box(g,.34,.035,.25,0,.98,-.19,mat("#182536",.3,.35));
 box(g,.48,.018,.28,0,.895,-.17,mat("#52677d",.3,.7),false);
 // Individually modeled keycaps, legends and a braided cable make the desk setup read as real hardware.

 const boardGlow=mat(palette[keyboard-1],.3,.15,{emissive:emit[keyboard-1],emissiveIntensity:.2+keyboard*.12});
 box(g,.64,.045,.24,-.12,.925,.22,surfaceMat("#121b29","plastic",.36,.24));
 for(let row=0;row<4;row++)for(let col=0;col<12;col++)box(g,.039,.025,.038,-.405+col*.052,.96,.135+row*.052,keyboard>=2?boardGlow:surfaceMat("#8493a4","rubber",.52,.08),false);
 box(g,.15,.018,.035,-.12,.963,.385,boardGlow,false);
 box(g,.31,.025,.25,.57,.91,.235,surfaceMat("#101a29","rubber",.72,.02));box(g,.32,.012,.26,.57,.925,.235,mat("#203d57",.38,.15,{emissive:palette[mouse-1],emissiveIntensity:.12+mouse*.08}),false);
 const mouseBody=sphere(g,.075,.57,.98,.22,surfaceMat(["#222d3c","#1a526e","#1d674f","#563c79"][mouse-1],"rubber",.34,.12),18,12);mouseBody.scale.set(.72,.42,1.12);
 box(g,.012,.025,.065,.57,.997,.16,mat("#d8e8f6",.24,.3),false);cylinder(g,.018,.018,.022,.57,1.005,.215,mat(palette[mouse-1],.25,.1,{emissive:emit[mouse-1],emissiveIntensity:.8}),12).rotation.x=Math.PI/2;
 makeGamingPC(g,.78,.9,.02,gpu,cpu,ram);
 const rgbLight=new THREE.PointLight(palette[gpu-1],1.8,2.2,2);rgbLight.position.set(x+.78,1.35,z-.32);scene.add(rgbLight);
 const chair=new THREE.Group();chair.position.set(0,0,1.05);g.add(chair);const chairMat=surfaceMat(["#222d3c","#173e58","#174b3b","#3e2b58"][chairLevel-1],"fabric",.82,.02);
 cylinder(chair,.065,.075,.48,0,.28,0,mat("#71849a",.25,.6),14);cylinder(chair,.42,.42,.1,0,.07,0,surfaceMat("#182332","plastic",.42,.2),24);
 box(chair,.68,.72,.19,0,.76,.12,chairMat);
 box(chair,.52,.20,.205,0,.78,.025,surfaceMat("#34465d","fabric",.9,.02),false);
 box(chair,.48,.22,.21,0,1.12,.105,chairMat,false);
 box(chair,.3,.12,.22,0,1.42,.12,chairMat,false);
 box(chair,.22,.035,.225,0,1.43,.005,trim,false);
 for(const yy of [.55,.82,1.08])box(chair,.48,.018,.012,0,yy,.225,mat("#8195a9",.72,.12),false);
 for(const sx of [-1,1]){box(chair,.09,.4,.5,sx*.39,.52,.02,chairMat,false);box(chair,.12,.07,.37,sx*.39,.72,.02,trim,false);box(chair,.035,.32,.035,sx*.39,.47,.22,mat("#8295aa",.28,.72),false);}
 for(let i=0;i<5;i++){const spoke=new THREE.Group();spoke.rotation.y=i*Math.PI*2/5;spoke.position.set(0,.06,0);chair.add(spoke);box(spoke,.055,.045,.38,0,0,.22,mat("#8295aa",.24,.82),false);const wheel=cylinder(spoke,.055,.055,.09,0,-.04,.42,mat("#111821",.42,.18),16);wheel.rotation.z=Math.PI/2;}
 makeLabel(g,"PC "+String(index+1).padStart(2,"0"),0,2.15,-.4,1.3,.3);g.userData={index,tier,components:{gpu,cpu,ram,monitor,keyboard,mouse,chair:chairLevel,desk:deskLevel}};stationGroups.push(g);
 const keys=["gpu","cpu","ram","monitor","keyboard","mouse","chair","desk"],names=["Видеокарта","Процессор","ОЗУ","Монитор","Клавиатура","Мышь","Кресло","Стол"];
 keys.forEach((key,k)=>interactables.push({position:new THREE.Vector3(x+((k%4)-1.5)*.3,0,z+1.15+Math.floor(k/4)*.28),name:names[k],hint:"Улучшение компонента ПК · "+names[k],action:"upgrade_component",station:index,component:key,radius:1.9}));
}
function makeConsoleStation(x,z,index,data){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 const lv=k=>clamp(Number(data[k]||1),1,4),tv=lv("tv"),con=lv("console"),sofa=lv("sofa"),colors=["#e4b65b","#29c9ff","#42dfa0","#b77cff"],fabric=surfaceMat(["#26374b","#174d68","#18513f","#49315f"][sofa-1],"fabric",.86,.02);
 const tableMat=surfaceMat(["#26384e","#174b66","#18513f","#49315f"][tv-1],"wood",.38,.22),metalLeg=mat("#8295aa",.3,.68),tvGlow=colors[tv-1];
 // TV console table with four legs and a lower shelf.
 box(g,1.9,.13,.72,0,.72,-.92,tableMat);
 for(const sx of [-.78,.78])for(const sz of [-.26,.26])box(g,.075,.68,.075,sx,.34,-.92+sz,metalLeg);
 box(g,1.62,.07,.55,0,.27,-.92,mat("#172538",.42,.45));
 // TV and its feet rest directly on the tabletop.
 box(g,.16,.12,.18,0,.84,-.92,mat("#202a3b",.32,.55));
 box(g,1.68,.96,.13,0,1.37,-.92,mat("#080d16",.18,.72));
 box(g,1.55,.82,.022,0,1.39,-.842,mat("#fff",.16,.08,{emissive:["#17324b","#12445a","#164a39","#38224f"][tv-1],emissiveIntensity:.42+tv*.1}));
 box(g,1.58,.025,.025,0,.895,-.842,mat("#8396a8",.24,.72),false);
 sphere(g,.018,0,.895,-.858,mat("#28dfff",.2,.3,{emissive:"#0d9bcf",emissiveIntensity:.7}),12,8);
 box(g,1.55,.045,.04,0,1.86,-.84,mat(tvGlow,.25,.35,{emissive:tvGlow,emissiveIntensity:.7}),false);
 // Brand-specific console models: PlayStation has the recognizable white split
 // shell and black center; Xbox is a compact upright black tower with green vent.
 const device=new THREE.Group();device.position.set(.58,.84,-.55);g.add(device);
 const isXbox=String(data.name||"").toLowerCase().includes("xbox");
 const shell=mat(isXbox?"#171b20":"#e8edf2",.28,.62),dark=mat("#090d13",.22,.72);
 const accent=mat(isXbox?"#35d66f":"#20bfff",.22,.28,{emissive:isXbox?"#159b45":"#0879bd",emissiveIntensity:.75});
 if(isXbox){
   // Xbox Series-style upright monolithic tower.
   box(device,.3,.43,.29,0,.215,0,dark);
   box(device,.27,.035,.26,0,.43,0,mat("#252b31",.25,.55));
   box(device,.018,.31,.012,.151,.22,-.08,accent,false);
   cylinder(device,.075,.075,.012,0,.451,0,accent,24);
   for(let n=-2;n<=2;n++)box(device,.012,.012,.16,n*.035,.454,0,dark,false);
   makeLabel(device,"XBOX",0,.22,.151,.24,.09);
 }else{
   // PlayStation 5-style horizontal chassis with two white side plates.
   box(device,.43,.105,.29,0,.055,0,dark);
   box(device,.105,.19,.3,-.145,.105,0,shell);
   box(device,.105,.19,.3,.145,.105,0,shell);
   box(device,.205,.145,.275,0,.11,0,dark);
   box(device,.012,.105,.012,-.045,.11,-.146,accent,false);
   box(device,.012,.105,.012,.045,.11,-.146,accent,false);
   box(device,.055,.012,.035,0,.202,.075,mat("#303a46",.3,.6),false);
   makeLabel(device,"PS5",0,.11,.151,.22,.09);
 }
 // Upgrade levels keep their own colored status indicator.
 box(device,.12,.018,.018,0,isXbox?.475:.018,.158,mat(colors[con-1],.22,.28,{emissive:colors[con-1],emissiveIntensity:.5}),false);
 // Sofa is grounded on the floor with short feet, seat, back and armrests.
 for(const sx of [-.82,.82])for(const sz of [.63,1.18])box(g,.09,.16,.09,sx,.08,sz,mat("#202a38",.38,.55));
 box(g,1.95,.22,.82,0,.22,.92,fabric);
 box(g,1.95,.16,.72,0,.39,.9,surfaceMat(["#34465d","#23627b","#28664e","#61417b"][sofa-1],"fabric",.9,.02));
 box(g,2,.7,.2,0,.76,1.27,fabric);
 for(const sx of [-.91,.91])box(g,.18,.54,.82,sx,.53,.92,fabric);
 for(const sx of [-.58,0,.58])box(g,.58,.11,.12,sx,.51,.49,mat(colors[sofa-1],.5,.08),false);
 // Seamed seat cushions and a wireless controller resting on the sofa.
 for(const sx of [-.58,0,.58]){box(g,.53,.055,.58,sx,.49,.91,surfaceMat(["#34465d","#23627b","#28664e","#61417b"][sofa-1],"fabric",.92,.01),false);box(g,.48,.012,.018,sx,.52,1.16,mat("#8296aa",.8,.08),false);}
 const pad=new THREE.Group();pad.position.set(.28,.57,.77);pad.rotation.x=-.18;g.add(pad);
 const padBody=mat("#202a39",.3,.38),padTrim=mat(colors[con-1],.24,.22,{emissive:colors[con-1],emissiveIntensity:.32});
 const body=sphere(pad,.22,0,0,0,padBody,24,16);body.scale.set(1.45,.42,.82);
 for(const side of [-1,1]){const grip=new THREE.Mesh(new THREE.CapsuleGeometry(.065,.17,5,12),padBody);grip.position.set(side*.22,-.015,.035);grip.rotation.z=side*.38;pad.add(grip);}
 cylinder(pad,.045,.045,.025,-.105,.045,-.015,mat("#101722",.3,.2),20);
 cylinder(pad,.045,.045,.025,.105,.045,-.015,mat("#101722",.3,.2),20);
 for(const [bx,bz,col] of [[-.12,-.025,"#e95b69"],[.12,-.025,"#4aa7ef"],[0,.09,"#62cf8a"],[0,-.14,"#e9c45a"]])sphere(pad,.025,bx,.055,bz,mat(col,.24,.12,{emissive:col,emissiveIntensity:.18}),12,8);
 box(pad,.1,.012,.02,0,.055,.12,padTrim,false);
 makeLabel(g,"CONSOLE "+String(index+1).padStart(2,"0"),0,2.12,-.92,1.8,.32);g.userData={consoleIndex:index};consoleGroups.push(g);
 for(const key of ["tv","console","sofa"])interactables.push({position:new THREE.Vector3(x+(key==="tv"?-.65:key==="console"?.65:0),0,z+(key==="sofa"?1.2:-.8)),name:({tv:"Телевизор",console:"Приставка",sofa:"Диван"})[key],hint:"КОНСОЛЬНАЯ ЗОНА · "+({tv:"ТЕЛЕВИЗОР",console:"ПРИСТАВКА",sofa:"ДИВАН"})[key]+" · НАЖМИ ДЛЯ УЛУЧШЕНИЯ",action:"upgrade_console_component",station:index,component:key,radius:1.8});
}
function buildStore(){
 scene=new THREE.Scene();scene.background=new THREE.Color("#111a29");scene.fog=new THREE.Fog("#111a29",36,76);camera=new THREE.PerspectiveCamera(56,1,.1,120);
 // A lightweight procedural studio environment gives metal, glass and glossy plastic subtle reflections.
 scene.environment=studioEnvironmentTexture();
 // Ultra Graphics lighting: soft neutral fill, warm key light and cool cinematic rim.
 scene.add(new THREE.AmbientLight("#9aabc5",.48));
 scene.add(new THREE.HemisphereLight("#d7eaff","#25283a",1.35));
 const key=new THREE.DirectionalLight("#fff0d8",3.35);key.position.set(-7,13,8);key.castShadow=true;key.shadow.mapSize.set(compactDevice?1024:2048,compactDevice?1024:2048);key.shadow.bias=-.00008;key.shadow.normalBias=.02;key.shadow.radius=compactDevice?2:4;key.shadow.camera.left=-19;key.shadow.camera.right=19;key.shadow.camera.top=19;key.shadow.camera.bottom=-19;key.shadow.camera.near=.5;key.shadow.camera.far=42;scene.add(key);
 const rim=new THREE.DirectionalLight("#83bfff",1.05);rim.position.set(9,8,-10);scene.add(rim);
 for(const [color,intensity,pos] of [["#21cfff",27,[-5,3,-4]],["#9c4dff",24,[6,3,2]],["#ff4e9b",14,[0,3,7]]]){const l=new THREE.PointLight(color,intensity,19,2);l.position.set(...pos);scene.add(l);}
 const roomSize=18+Number(state.clubData.roomLevel||0)*4,roomHalf=roomSize/2;
 box(scene,roomSize,.35,roomSize,0,-.18,0,surfaceMat("#ffffff","floor",.32,.18));
  // Apply wall texture directly to the room-facing faces of each solid wall mesh.
  const wallSkin=surfaceMat("#ffffff","wall",.82,.02);
  const wallBox=(w,h,d,x,y,z)=>{
    const mats=Array.from({length:6},()=>wallSkin);
    const mesh=addMesh(scene,new THREE.BoxGeometry(w,h,d),mats,[x,y,z],true,true);
    return mesh;
  };
  wallBox(roomSize,5,.32,0,2.35,-roomHalf);       // rear wall, inside face
  wallBox(.32,5,roomSize,-roomHalf,2.35,0);       // left wall, inside face
  // Partition between PC and console rooms: both sides are textured, doorway stays open.
  const doorwayHalf=1.7,segment=roomHalf-doorwayHalf,segmentCenter=(roomHalf+doorwayHalf)/2;
  for(const side of [-1,1]){
    wallBox(.32,5,segment,roomHalf,2.35,side*segmentCenter);
  }
  box(scene,.34,.28,doorwayHalf*2+.22,roomHalf,4.72,0,surfaceMat("#172a43","metal",.34,.62));
  for(const side of [-1,1]){
    box(scene,.34,4.65,.14,roomHalf,2.34,side*(doorwayHalf+.035),surfaceMat("#172a43","metal",.34,.62));
  }
  box(scene,roomSize,.25,roomSize,0,5,0,surfaceMat("#ffffff","ceiling",.82,.08));
  // Four large recessed soft-white fixtures make the PC room visibly brighter and more dimensional.
  addCeilingLight(-4.8,-4.8);addCeilingLight(4.8,-4.8);addCeilingLight(-4.8,4.8);addCeilingLight(4.8,4.8);
  const wingX=roomHalf+4.75;
  const consoleRoomLevel=Number(state.clubData.consoleRoomLevel||0),consoleDepth=22+consoleRoomLevel*4,consoleCenterZ=consoleRoomLevel*2;
  box(scene,9.5,.3,consoleDepth,wingX,-.18,consoleCenterZ,surfaceMat("#ffffff","floor",.32,.18));
  wallBox(9.5,5,.3,wingX,2.35,-11); // console room rear wall
  wallBox(9.5,5,.3,wingX,2.35,11+consoleRoomLevel*4); // console room front wall
  wallBox(.3,5,consoleDepth,roomHalf+9.5,2.35,consoleCenterZ); // console room outer side wall
  box(scene,9.5,.25,consoleDepth,wingX,5,consoleCenterZ,surfaceMat("#ffffff","ceiling",.88,.04));
  // 3D architectural finishing: metallic skirting, luminous floor guides and wall-corner trims.
  const trimMetal=surfaceMat("#6f879d","metal",.3,.78);
  const cyanGlow=mat("#20dfff",.22,.18,{emissive:"#00a9e8",emissiveIntensity:1.15});
  const violetGlow=mat("#a96bff",.22,.18,{emissive:"#7025d5",emissiveIntensity:1.05});
  // PC room perimeter detailing.
  box(scene,roomSize-.5,.16,.10,0,.09,-roomHalf+.22,trimMetal,false);
  box(scene,.10,.16,roomSize-.5,-roomHalf+.22,.09,0,trimMetal,false);
  box(scene,.10,.16,roomSize-.5,roomHalf-.22,.09,0,trimMetal,false);
  box(scene,roomSize-.5,.035,.055,0,.035,-roomHalf+.29,cyanGlow,false);
  box(scene,.055,.035,roomSize-.5,-roomHalf+.29,.035,0,violetGlow,false);
  box(scene,.055,.035,roomSize-.5,roomHalf-.29,.035,0,cyanGlow,false);
  // Console room gets its own independent trim and light guides.
  box(scene,9.1,.16,.10,wingX,.09,-consoleDepth/2+.22,trimMetal,false);
  box(scene,9.1,.16,.10,wingX,.09,consoleDepth/2-.22,trimMetal,false);
  box(scene,.10,.16,consoleDepth-.5,roomHalf+9.5-.22,.09,consoleCenterZ,trimMetal,false);
  box(scene,9.1,.035,.055,wingX,.035,-consoleDepth/2+.29,violetGlow,false);
  box(scene,9.1,.035,.055,wingX,.035,consoleDepth/2-.29,cyanGlow,false);
  // Visible vertical metal corner guards give the walls real depth.
  for(const [x,z] of [[-roomHalf+.22,-roomHalf+.22],[roomHalf-.22,-roomHalf+.22],[-roomHalf+.22,roomHalf-.22],[roomHalf-.22,roomHalf-.22]]){
    box(scene,.09,4.65,.09,x,2.35,z,trimMetal,false);
  }
  // Warm ceiling fixtures balance the cool RGB accents in the separate console room.
  addCeilingLight(wingX-3.1,-6);addCeilingLight(wingX+3.1,-6);
  addCeilingLight(wingX-3.1,6);addCeilingLight(wingX+3.1,6);
 box(scene,.12,3.5,.18,roomHalf+.08,2.1,-2.3,mat("#21cfff",.2,.3,{emissive:"#087fa8",emissiveIntensity:1}),false);box(scene,.12,3.5,.18,roomHalf+.08,2.1,2.3,mat("#a55cff",.2,.3,{emissive:"#4a138c",emissiveIntensity:1}),false);
 const wingSign=new THREE.Mesh(new THREE.PlaneGeometry(3.4,.65),signMaterial("CONSOLE LOUNGE","PLAYSTATION • XBOX"));wingSign.position.set(roomHalf+4.75,3.7,-10.78);scene.add(wingSign);
 box(scene,.12,2.5,3.2,-2.45,1.25,6.0,surfaceMat("#263d58","plastic",.35,.3));box(scene,.12,2.5,3.2,2.45,1.25,6.0,surfaceMat("#263d58","plastic",.35,.3));// Keep the entrance-to-club passage open: rear reception partition removed.
 box(scene,7,.95,.22,0,4.12,-8.72,mat("#121d31",.3,.3));const sign=new THREE.Mesh(new THREE.PlaneGeometry(6.5,.72),signMaterial("UGLY CYBER CLUB","PLAY • COMPETE • LEVEL UP"));sign.position.set(0,4.12,-8.57);scene.add(sign);
 // Wall art: custom cyber-club posters with distinct graphics and slogans.
 const poster=(x,y,z,title,subtitle,accent,variant=0)=>{
   const tex=canvasTexture((ctx,w,h)=>{
     const grad=ctx.createLinearGradient(0,0,w,h);grad.addColorStop(0,"#101b32");grad.addColorStop(1,"#283c59");ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
     ctx.fillStyle=accent;ctx.fillRect(0,0,w,18);ctx.fillRect(0,h-18,w,18);
     ctx.strokeStyle=accent;ctx.lineWidth=8;ctx.strokeRect(12,12,w-24,h-24);
     ctx.save();ctx.translate(w/2,h*.43);ctx.strokeStyle=accent;ctx.lineWidth=12;
     if(variant%3===0){ctx.beginPath();ctx.arc(0,0,58,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(-78,58);ctx.lineTo(78,-58);ctx.stroke();}
     else if(variant%3===1){ctx.beginPath();ctx.moveTo(-72,60);ctx.lineTo(0,-76);ctx.lineTo(72,60);ctx.closePath();ctx.stroke();ctx.fillStyle=accent;ctx.fillRect(-12,-15,24,100);}
     else{for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-88+i*40,-62);ctx.lineTo(-48+i*40,62);ctx.stroke();}}
     ctx.restore();ctx.textAlign="center";ctx.fillStyle="#fff4db";ctx.font="bold 38px Arial";ctx.fillText(title,w/2,h*.79);
     ctx.fillStyle=accent;ctx.font="bold 18px Arial";ctx.fillText(subtitle,w/2,h*.9);
   },256,384);
   const frame=box(scene,.94,1.42,.09,x,y,z,mat("#17263b",.32,.55),false);
   const art=new THREE.Mesh(new THREE.PlaneGeometry(.84,1.32),new THREE.MeshStandardMaterial({map:tex,roughness:.72,side:THREE.DoubleSide}));
   art.position.set(x,y,z+.052);scene.add(art);
 };
 poster(-5.5,2.75,-roomHalf+.19,"PLAY HARD","NO LIMITS","#20dfff",0);
 poster(-3.45,2.75,-roomHalf+.19,"LEVEL UP","NEXT STAGE","#b66cff",1);
 poster(3.45,2.75,-roomHalf+.19,"CYBER ZONE","GAME ON","#ff5d9e",2);
 poster(5.5,2.75,-roomHalf+.19,"VICTORY","STAY SHARP","#ffc45b",0);
 // Lounge corner: padded two-seat sofa and a low coffee table.
 const lounge=new THREE.Group();lounge.position.set(-4.55,0,-roomHalf+1.12);scene.add(lounge);
 const sofaFabric=surfaceMat("#263c59","fabric",.86,.02),sofaTrim=mat("#21cfff",.3,.18,{emissive:"#087d9d",emissiveIntensity:.35});
 box(lounge,2.65,.28,.92,0,.42,0,sofaFabric);
 box(lounge,2.72,.72,.2,0,.83,-.36,sofaFabric);
 for(const sx of [-1,1]){box(lounge,.22,.62,.92,sx*1.25,.68,0,sofaFabric);box(lounge,.24,.07,.88,sx*1.25,.98,0,sofaTrim,false);}
 for(const sx of [-.83,0,.83]){box(lounge,.78,.16,.12,sx,.72,.36,surfaceMat("#344f70","fabric",.9,.01));}
 for(const sx of [-1,1])for(const sz of [-1,1])box(lounge,.09,.28,.09,sx*1.13,.14,sz*.34,mat("#8798aa",.3,.62));
 const coffee=new THREE.Group();coffee.position.set(-4.55,0,-roomHalf+2.35);scene.add(coffee);
 box(coffee,1.55,.11,.82,0,.52,0,surfaceMat("#765039","wood",.35,.12));
 for(const sx of [-.62,.62])for(const sz of [-.29,.29])box(coffee,.07,.5,.07,sx,.25,sz,mat("#8798aa",.3,.65));
 // Cigarette packet, lighter and phone as small tabletop props.
 const pack=new THREE.Group();pack.position.set(-.42,.61,.02);coffee.add(pack);
 box(pack,.19,.28,.075,0,.14,0,mat("#e8e0cc",.62,.02),false);
 box(pack,.195,.07,.078,0,.245,0,mat("#c94b43",.48,.05),false);
 box(pack,.14,.12,.006,0,.13,.041,mat("#f5eee0",.8),false);
 const lighter=new THREE.Group();lighter.position.set(.02,.61,.13);coffee.add(lighter);
 box(lighter,.09,.17,.055,0,.085,0,mat("#d4a63f",.28,.62),false);
 box(lighter,.095,.025,.06,0,.18,0,M.steel,false);
 box(lighter,.018,.035,.018,.025,.205,0,mat("#20232b",.3,.45),false);
 const phone=new THREE.Group();phone.position.set(.43,.61,-.13);phone.rotation.y=-.22;coffee.add(phone);
 box(phone,.16,.29,.025,0,.15,0,mat("#111923",.25,.45),false);
 box(phone,.135,.245,.008,0,.153,.017,mat("#172d45",.2,.12,{emissive:"#087ba5",emissiveIntensity:.28}),false);
 box(phone,.045,.006,.006,0,.035,.023,M.steel,false);
 // Four leafy potted plants bring greenery into the room corners.
 const addPlant=(x,z,scale=1)=>{
   const pot=new THREE.Group();pot.position.set(x,0,z);pot.scale.setScalar(scale);scene.add(pot);
   const terracotta=mat("#a95f3f",.72,.02),rim=mat("#d18a60",.62,.02),soil=mat("#30251f",1);
   cylinder(pot,.39,.29,.58,0,.29,0,terracotta,24);cylinder(pot,.405,.405,.09,0,.59,0,rim,24);cylinder(pot,.34,.34,.035,0,.64,0,soil,20);
   const greens=["#267447","#328b50","#55a95e","#1e603d","#79bd68","#3c9956"],stems=mat("#527b3d",.9);
   for(let i=0;i<13;i++){const a=i*Math.PI*2/13,h=.95+(i%4)*.13,branch=new THREE.Group();branch.position.set(Math.cos(a)*.07,.66,Math.sin(a)*.07);branch.rotation.y=-a;branch.rotation.z=i%2?-.32:.32;pot.add(branch);cylinder(branch,.018,.025,h*.48,0,h*.24,0,stems,8);const blade=sphere(branch,.19,0,h*.55,0,mat(greens[i%greens.length],.88),14,12);blade.scale.set(.62,1.75,.48);blade.rotation.z=-.18;const side=sphere(branch,.125,.12,h*.39,.025,mat(greens[(i+2)%greens.length],.9),12,10);side.scale.set(.55,1.25,.45);side.rotation.z=-.55;}
   for(let i=0;i<7;i++){const a=i*Math.PI*2/7,leaf=sphere(pot,.17,Math.cos(a)*.23,1.45+(i%3)*.08,Math.sin(a)*.23,mat(greens[(i+3)%greens.length],.86),14,12);leaf.scale.set(.7,1.45,.55);leaf.rotation.z=Math.cos(a)*-.35;}
   const crown=sphere(pot,.19,0,1.58,0,mat("#4a9b58",.9),14,12);crown.scale.set(.9,1.25,.9);
 };
 addPlant(-roomHalf+1,-roomHalf+1,.92);addPlant(roomHalf-1,-roomHalf+1,.92);
 addPlant(-roomHalf+1,roomHalf-1,.92);addPlant(roomHalf-1,roomHalf-1,.92);
 // Console lounge decor: dedicated gaming posters and leafy plants in the wing corners.
 const wingPoster=(x,y,z,title,subtitle,accent,rotationY=0,variant=0)=>{
   const tex=canvasTexture((ctx,w,h)=>{
     ctx.fillStyle="#101827";ctx.fillRect(0,0,w,h);const glow=ctx.createRadialGradient(w*.5,h*.36,8,w*.5,h*.36,180);glow.addColorStop(0,accent+"55");glow.addColorStop(1,"#10182700");ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
     ctx.fillStyle=accent;ctx.fillRect(0,0,w,12);ctx.fillStyle="#fff";ctx.font="bold 19px Arial";ctx.textAlign="left";ctx.fillText("UGLY  /  GAMING",22,42);ctx.strokeStyle=accent;ctx.lineWidth=5;
     if(variant%3===0){ctx.beginPath();ctx.arc(w/2,h*.39,73,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(w/2-94,h*.39);ctx.lineTo(w/2+94,h*.39);ctx.moveTo(w/2,h*.39-94);ctx.lineTo(w/2,h*.39+94);ctx.stroke();}
     else if(variant%3===1){ctx.beginPath();ctx.moveTo(w/2,h*.18);ctx.lineTo(w*.78,h*.58);ctx.lineTo(w*.22,h*.58);ctx.closePath();ctx.stroke();ctx.strokeRect(w*.39,h*.34,w*.22,h*.22);}
     else{ctx.strokeRect(w*.24,h*.22,w*.52,h*.34);ctx.beginPath();ctx.moveTo(w*.18,h*.62);ctx.lineTo(w*.82,h*.62);ctx.moveTo(w*.5,h*.16);ctx.lineTo(w*.5,h*.66);ctx.stroke();}
     ctx.fillStyle="#f5f7fb";ctx.textAlign="center";ctx.font="900 34px Arial";ctx.fillText(title,w/2,h*.79);ctx.fillStyle=accent;ctx.font="bold 18px Arial";ctx.fillText(subtitle,w/2,h*.88);ctx.fillStyle="#8795a8";ctx.font="14px Arial";ctx.fillText("PLAY  •  CONNECT  •  REPEAT",w/2,h*.95);
   },384,576);
   const group=new THREE.Group();group.position.set(x,y,z);group.rotation.y=rotationY;scene.add(group);group.add(new THREE.Mesh(new THREE.PlaneGeometry(1.18,1.62),mat("#0a111e",.42,.28)));
   const art=new THREE.Mesh(new THREE.PlaneGeometry(1.08,1.52),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));art.position.z=.012;group.add(art);
   const edgeMat=mat(accent,.3,.12,{emissive:accent,emissiveIntensity:.22});for(const yy of [-.79,.79])box(group,1.18,.025,.025,0,yy,.018,edgeMat,false);for(const xx of [-.575,.575])box(group,.025,1.58,.025,xx,0,.018,edgeMat,false);
 };
 const wingFrontZ=11+consoleRoomLevel*4;
 wingPoster(wingX-2.35,2.72,-10.79,"PLAYSTATION","EXCLUSIVE GAMES","#20cfff",0,0);
 wingPoster(wingX+2.35,2.72,-10.79,"XBOX","POWER YOUR DREAMS","#6be37a",0,1);
 wingPoster(roomHalf+9.29,2.72,-6.4,"GAME ON","NEXT LEVEL","#b66cff",-Math.PI/2,2);
 wingPoster(roomHalf+9.29,2.72,-1.8,"NO LIMITS","PLAY TO WIN","#ff5d9e",-Math.PI/2,0);
 wingPoster(roomHalf+9.29,2.72,3.0,"CYBER LOUNGE","STAY IN GAME","#ffc45b",-Math.PI/2,1);
 wingPoster(wingX,2.72,wingFrontZ-.18,"LEVEL UP","CHOOSE YOUR SIDE","#20cfff",Math.PI,2);
 addPlant(roomHalf+1.05,-9.35,.82);
 addPlant(roomHalf+8.35,-9.35,.82);
 addPlant(roomHalf+1.05,9.35+consoleRoomLevel*4,.82);
 addPlant(roomHalf+8.35,9.35+consoleRoomLevel*4,.82);
 // Reception counter with a clear staff position behind it.
 const reception=new THREE.Group();reception.position.set(0,0,7.1);scene.add(reception);
 // Raised counter top, front fascia and side cheeks leave the staff side open.
 box(reception,3.95,.13,1.02,0,1.04,0,surfaceMat("#263d58","wood",.3,.24));
 box(reception,3.72,.66,.12,0,.59,-.43,surfaceMat("#14243a","plastic",.32,.38));
 box(reception,3.78,.045,.055,0,.91,-.36,mat("#25dfff",.2,.3,{emissive:"#0788aa",emissiveIntensity:1.15}),false);
 box(reception,3.78,.045,.055,0,.22,-.36,mat("#a56cff",.22,.3,{emissive:"#5c21a5",emissiveIntensity:.9}),false);
 for(const x of [-1.87,1.87]){
   box(reception,.14,.82,.94,x,.53,0,mat("#304c69",.3,.45));
   box(reception,.17,.07,.96,x,.12,0,mat("#21cfff",.2,.3,{emissive:"#087d9d",emissiveIntensity:.8}),false);
   box(reception,.12,.08,.78,x,.98,0,M.gold,false);
 }
 // Staff-side laptop: the display faces the open standing area (+Z).
 const laptop=new THREE.Group();laptop.position.set(.05,1.12,-.08);laptop.rotation.y=0;laptop.scale.set(.82,.82,.82);reception.add(laptop);
 box(laptop,.92,.045,.59,0,.02,0,surfaceMat("#8798aa","metal",.25,.72));
 box(laptop,.86,.48,.035,0,.275,-.255,mat("#202b3a",.2,.55));
 box(laptop,.78,.39,.012,0,.28,-.232,mat("#0a1b2d",.18,.2,{emissive:"#087ba5",emissiveIntensity:.4}),false);
 box(laptop,.58,.012,.2,0,.052,.12,mat("#263c52",.3,.35),false);
 box(laptop,.2,.008,.11,0,.052,.28,mat("#7894aa",.25,.55),false);
 const laptopScreen=new THREE.Mesh(new THREE.PlaneGeometry(.72,.32),signMaterial("UGLY ADMIN","TAP TO MANAGE GUESTS"));laptopScreen.material.side=THREE.DoubleSide;laptopScreen.material.needsUpdate=true;laptopScreen.position.set(0,.28,-.222);laptop.add(laptopScreen);
 // Small desk accessories: collectible figures, paperwork, pen and cash bundles.
 const figureA=new THREE.Group();figureA.position.set(-1.28,1.12,.12);reception.add(figureA);
 cylinder(figureA,.13,.15,.055,0,.025,0,M.dark,20);
 const mascotBody=mat("#23cfff",.38,.12,{emissive:"#07506c",emissiveIntensity:.3});
 sphere(figureA,.105,0,.17,0,mascotBody,16,12);sphere(figureA,.082,0,.34,0,mat("#f0b58a"),16,12);
 for(const sx of [-1,1]){box(figureA,.045,.15,.05,sx*.13,.16,0,mascotBody,false);box(figureA,.055,.12,.06,sx*.07,.07,0,M.gold,false);}
 sphere(figureA,.018,-.03,.36,.071,mat("#20232b"),10,8);sphere(figureA,.018,.03,.36,.071,mat("#20232b"),10,8);
 const figureB=new THREE.Group();figureB.position.set(1.28,1.12,.12);reception.add(figureB);
 cylinder(figureB,.12,.14,.05,0,.025,0,M.dark,20);
 sphere(figureB,.105,0,.16,0,mat("#a56cff",.35,.15,{emissive:"#4d1684",emissiveIntensity:.35}),16,12);
 sphere(figureB,.085,0,.31,0,mat("#e6b18a"),16,12);
 sphere(figureB,.11,0,.39,0,mat("#283449"),16,10).scale.set(1,.42,1);
 // Forms and a clipboard laid out on the right-hand side.
 const paper=mat("#f3eddd",.9),ink=mat("#34465b",.8);
 for(let i=0;i<3;i++){
   const sheet=box(reception,.42,.012,.54,.78+i*.035,1.115,.24-i*.025,paper,false);
   sheet.rotation.y=-.12+i*.035;sheet.rotation.x=-.025;
   for(let line=0;line<4;line++)box(reception,.25,.004,.008,.78+i*.035,1.124,.08+line*.075,ink,false);
 }
 box(reception,.47,.025,.59,.78,1.14,.24,mat("#b58b4f",.55,.18),false);
 box(reception,.18,.012,.025,.78,1.158,-.035,M.steel,false);
 // Cash bundles with visible paper bands.
 for(let stack=0;stack<3;stack++){
   const x=-.62+stack*.22,z=.34+(stack%2)*.08,y=1.13+Math.floor(stack/2)*.055;
   box(reception,.19,.055,.11,x,y,z,mat("#548b62",.82),false);
   box(reception,.195,.012,.018,x,y+.006,z,mat("#e8d8a8",.72),false);
   for(let note=0;note<3;note++)box(reception,.17,.006,.095,x,y+.03+note*.006,z,mat(note%2?"#8caf73":"#67966d",.82),false);
 }
 // Pen and desk cup finish the working reception setup.
 const pen=cylinder(reception,.012,.012,.28,-.15,1.16,.31,mat("#202b3a",.3,.55),10);pen.rotation.z=-.32;
 cylinder(reception,.085,.085,.13,1.58,1.12,.27,mat("#d9e3ec",.3,.3),18);
 cylinder(reception,.065,.065,.012,1.58,1.19,.27,mat("#263d58",.3,.25),18);
 makeLabel(scene,"RECEPTION",0,2.12,6.48,2.5,.4);
 interactables.push({position:new THREE.Vector3(0,0,7.22),name:"Ноутбук администратора",hint:"НОУТБУК РЕСЕПШЕНА · НАЖМИ, ЧТОБЫ ПРИНЯТЬ ПОСЕТИТЕЛЯ",action:"open_reception",radius:2.25});
 const spots=[[-5.1,-3.4],[-1.8,-3.4],[1.8,-3.4],[5.1,-3.4],[-5.1,2],[-1.8,2],[1.8,2],[5.1,2]];
 for(let i=0;i<8;i++)makeGamingStation(spots[i][0],spots[i][1],i,state.clubData?.stations?.[i]||{tier:1});
 (state.clubData?.consoleStations||[]).forEach((st,i)=>makeConsoleStation(roomHalf+2.5+(i%2)*4.2,-7.5+Math.floor(i/2)*5,i,st));
 // Dedicated reception inside the console lounge.
 const consoleDesk=new THREE.Group();consoleDesk.position.set(roomHalf+4.75,0,9.55+consoleRoomLevel*4);scene.add(consoleDesk);
 box(consoleDesk,3.35,.14,.9,0,1.02,0,surfaceMat("#263d58","wood",.3,.24));box(consoleDesk,3.12,.68,.12,0,.58,-.37,surfaceMat("#14243a","plastic",.32,.38));box(consoleDesk,3.2,.045,.05,0,.91,-.31,mat("#25dfff",.2,.3,{emissive:"#0788aa",emissiveIntensity:1.15}),false);
 box(consoleDesk,.72,.045,.48,-.55,1.12,-.02,surfaceMat("#8798aa","metal",.25,.72));box(consoleDesk,.66,.36,.035,-.55,1.31,-.22,mat("#202b3a",.2,.55));const consoleAdminScreen=new THREE.Mesh(new THREE.PlaneGeometry(.58,.25),signMaterial("CONSOLE ADMIN","PLAYSTATION • XBOX"));consoleAdminScreen.material.side=THREE.DoubleSide;consoleAdminScreen.material.needsUpdate=true;consoleAdminScreen.position.set(-.55,1.32,-.195);consoleDesk.add(consoleAdminScreen);
 makeLabel(scene,"CONSOLE RECEPTION",roomHalf+4.75,2.05,8.92+consoleRoomLevel*4,2.9,.34);interactables.push({position:new THREE.Vector3(roomHalf+4.75,0,8.25+consoleRoomLevel*4),name:"Ресепшен консольной зоны",hint:"КОНСОЛЬНЫЙ РЕСЕПШЕН · ОФОРМИТЬ ИГРОКА НА PLAYSTATION / XBOX",action:"open_console_reception",radius:2.35});
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
  if(compactDevice&&window.visualViewport){const vh=window.visualViewport.height;if(vh>0){const stage=canvas.closest(".sim-stage");if(stage)stage.style.setProperty("--sim-vh",Math.round(vh)+"px");}}
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
    const maxItems=item.action==="upgrade_console_component"?(state.clubData.consoleStations||[]).length:(state.stations||4);if(item.station!==undefined&&item.station>=maxItems)continue;
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
  const frameNow=performance.now();
  if(frameInterval&&frameNow-lastFrameAt<frameInterval)return;
  lastFrameAt=frameNow;
  const dt = Math.min(clock.getDelta(), .04), input = currentInput();
  // Forward is the direction the character faces; up on the stick moves into the store.
  tempForward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
  tempRight.set(Math.cos(yaw), 0, -Math.sin(yaw));
  tempMove.copy(tempForward).multiplyScalar(-input.y).addScaledVector(tempRight, input.x);
  if (tempMove.lengthSq() > .002) {
    tempMove.normalize();
    const step=tempMove.clone().multiplyScalar(dt*3.65*Math.max(.25,input.length));
    const roomHalfForCollision=(18+Number(state.clubData.roomLevel||0)*4)/2;
    const nextX=player.position.x+step.x,nextZ=player.position.z+step.z;
    const crossesPartition=(player.position.x<=roomHalfForCollision&&nextX>roomHalfForCollision)||(player.position.x>=roomHalfForCollision&&nextX<roomHalfForCollision);
    if(crossesPartition&&Math.abs(nextZ)>1.34)step.x=0;
    player.position.add(step);
    const targetYaw = Math.atan2(-tempMove.x, -tempMove.z);
    let diff = targetYaw - player.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    player.rotation.y += diff * (1-Math.exp(-dt*9));
  }
  const roomBound=7.15+Number(state.clubData.roomLevel||0)*2;
  player.position.x = clamp(player.position.x, -roomBound, roomBound+9.5);
  player.position.z = clamp(player.position.z, -Math.max(roomBound,10), Math.max(roomBound,10));
  const moving = input.length > .08;
  for (const a of animated) {
    if (a.type === "idle") a.mesh.position.y = Math.sin(performance.now() * .0017 + a.phase) * .025;
    if(a.type==="character"){
      const npc=clubNPCs.find(n=>n.mesh===a.root);
      const walk=a.isPlayer?moving:!!npc&&(npc.mode==="toSeat"||npc.mode==="toQueue"||npc.mode==="exit");
      const seated=!a.isPlayer&&npc?.mode==="play";
      const seatedConsole=seated&&npc?.queueType==="console";
      const speed=a.isPlayer?(moving?Math.max(.2,input.length)*3.65:0):(walk?1.5:0);
      a.gaitWeight??=0;
      const targetWeight=walk?1:0;
      a.gaitWeight+=(targetWeight-a.gaitWeight)*(1-Math.exp(-dt*(walk?11:8)));
      const weight=a.gaitWeight;
      // A full stride cycle follows actual movement speed; limbs ease into and out of motion.
      if(weight>.001)a.phase=(a.phase+dt*Math.max(0.1,speed)*2.65)%(Math.PI*2);
      const phase=a.phase,cycle=Math.sin(phase),opposite=Math.sin(phase+Math.PI);
      const bob=Math.abs(Math.sin(phase*2))*.038*weight;
      a.pelvis.position.y+=((seatedConsole?.56:.91)-a.pelvis.position.y)*(1-Math.exp(-dt*9));
      a.torsoPivot.position.y+=((seatedConsole?.77:1.12)+bob*(seated?0:1)-a.torsoPivot.position.y)*(1-Math.exp(-dt*9));
      a.head.position.y+=((seatedConsole?1.38:1.76)-a.head.position.y)*(1-Math.exp(-dt*9));
      a.torsoPivot.rotation.x+=((seatedConsole?-.08:.035*weight)-a.torsoPivot.rotation.x)*(1-Math.exp(-dt*9));
      a.torsoPivot.rotation.z=Math.sin(phase)*.025*weight;
      a.torsoPivot.rotation.y=Math.sin(phase)*.018*weight;
      a.limbs.forEach(l=>{
        const legWave=l.side<0?cycle:opposite;
        const armWave=-legWave;
        const lift=Math.max(0,Math.cos(phase+(l.side<0?0:Math.PI)));
        if(seated){
          const thigh=seatedConsole?1.02:.92,knee=seatedConsole?-1.18:-1.08,armPose=seatedConsole?.82:.92,forearmPose=seatedConsole?.62:.78;
          l.leg.rotation.x+=(thigh-l.leg.rotation.x)*(1-Math.exp(-dt*8));
          l.calf.rotation.x+=(knee-l.calf.rotation.x)*(1-Math.exp(-dt*8));
          l.foot.rotation.x+=((seatedConsole?-.12:-.08)-l.foot.rotation.x)*(1-Math.exp(-dt*8));
          l.arm.rotation.x+=(armPose-l.arm.rotation.x)*(1-Math.exp(-dt*8));
          l.forearm.rotation.x+=(forearmPose-l.forearm.rotation.x)*(1-Math.exp(-dt*8));
        }else{
          const stride=legWave*.48*weight;
          const calfBend=lift*.58*weight;
          const armSwing=armWave*.38*weight;
          l.leg.rotation.x+=(stride-l.leg.rotation.x)*(1-Math.exp(-dt*14));
          l.calf.rotation.x+=(calfBend-l.calf.rotation.x)*(1-Math.exp(-dt*14));
          l.foot.rotation.x+=(-calfBend*.28-l.foot.rotation.x)*(1-Math.exp(-dt*14));
          l.arm.rotation.x+=(armSwing-l.arm.rotation.x)*(1-Math.exp(-dt*12));
          l.forearm.rotation.x+=(-.08*weight-l.forearm.rotation.x)*(1-Math.exp(-dt*12));
        }
      });
    }
  }
  const now = performance.now();
  for (const npc of clubNPCs) {
    const qi=(npc.queueType==="console"?(state.clubData.consoleQueue||[]):(state.clubData.queue||[])).findIndex(q=>q.id===npc.id),session=(state.clubData.sessions||[]).find(q=>q.id===npc.id),consoleSession=(state.clubData.consoleSessions||[]).find(q=>q.id===npc.id);let dest;
    if(session||consoleSession){if(consoleSession){const ci=Number(consoleSession.station),x=9+Number(state.clubData.roomLevel||0)*2+2.5+(ci%2)*4.2,z=-7.5+Math.floor(ci/2)*5;dest=new THREE.Vector3(x,0,z+.58);}else{const spots=[[-5.1,-3.4],[-1.8,-3.4],[1.8,-3.4],[5.1,-3.4],[-5.1,2],[-1.8,2],[1.8,2],[5.1,2]],p=spots[session.station]||spots[0];dest=new THREE.Vector3(p[0],0,p[1]+1.05);}if(npc.mode!=="play")npc.mode="toSeat";}
    else if(qi>=0){dest=npc.queueType==="console"?new THREE.Vector3(9+Number(state.clubData.roomLevel||0)*2+4.75,0,7.7+Number(state.clubData.consoleRoomLevel||0)*4+Math.floor(qi/3)*.42):new THREE.Vector3(-.9+(qi%3)*.9,0,5.82+Math.floor(qi/3)*.42);if(npc.mode!=="queue")npc.mode="toQueue";}
    else{npc.mode="exit";dest=new THREE.Vector3(0,0,8.5);}
    // Console visitors use the doorway in the right-side wall, not a straight path through it.
    const roomHalf=(18+Number(state.clubData.roomLevel||0)*4)/2;
    if(npc.queueType==="console" && npc.mesh.position.x<roomHalf+1.4){
      dest=npc.mesh.position.x<roomHalf-3.4
        ?new THREE.Vector3(roomHalf-3.2,0,0)
        :new THREE.Vector3(roomHalf+1.55,0,0);
    }
    const delta=dest.clone().sub(npc.mesh.position),distance=delta.length();
    if(distance>.09){const target=Math.atan2(-delta.x,-delta.z);let turn=Math.atan2(Math.sin(target-npc.mesh.rotation.y),Math.cos(target-npc.mesh.rotation.y));npc.mesh.rotation.y+=turn*Math.min(1,dt*7);npc.mesh.position.addScaledVector(delta.normalize(),Math.min(distance,dt*1.5));}
    else if(session||consoleSession){npc.mode="play";npc.mesh.position.y=0;npc.mesh.rotation.y=0;npc.mesh.scale.y=consoleSession?1:.82;}
    else if(qi>=0){npc.mode="queue";npc.mesh.position.y=Math.sin(now*.004+npc.phase)*.018;}
  }
  for(let i=clubNPCs.length-1;i>=0;i--){if(clubNPCs[i].mode==="exit"&&clubNPCs[i].mesh.position.z>8.25){scene.remove(clubNPCs[i].mesh);const ai=animated.findIndex(a=>a.root===clubNPCs[i].mesh);if(ai>=0)animated.splice(ai,1);clubNPCs.splice(i,1);}}

  stationGroups.forEach(g=>{g.visible=true;if(g.parent!==scene)scene.add(g);});consoleGroups.forEach(g=>{g.visible=true;if(g.parent!==scene)scene.add(g);});
  updateCamera(dt);
  activeObject = findInteractable();
  $("simHint").textContent = activeObject ? activeObject.hint : "Двигайся по клубу. Подойди к ресепшену или игровому месту.";
  $("simAction").disabled = !activeObject || actionBusy;
  if(activeObject?.action==="upgrade_component"){
    const st=(state.clubData.stations||[])[Number(activeObject.station)],lv=Number(st?.components?.[activeObject.component]||st?.tier||1),next=lv+1,price=[0,500,2500,11000,24000][next]||0;
    $("simAction").textContent=lv>=4?"МАКСИМАЛЬНЫЙ УРОВЕНЬ":"УЛУЧШИТЬ "+activeObject.name.toUpperCase()+" · $"+price.toLocaleString("ru-RU");
    $("simAction").disabled=actionBusy||lv>=4;
  }else{
    $("simAction").textContent = activeObject ? (activeObject.action==="open_reception"?"ОТКРЫТЬ НОУТБУК":activeObject.action==="open_console_reception"?"ОТКРЫТЬ КОНСОЛЬНЫЙ РЕСЕПШЕН":"УЛУЧШИТЬ · "+activeObject.name.toUpperCase()) : "ПОДОЙДИ БЛИЖЕ";
  }
  if (renderer) renderer.render(scene, camera);
}
function syncClubNPCs(){
 const desired=(state.clubData.queue||[]).map(x=>({...x,queueType:"pc"})).concat((state.clubData.consoleQueue||[]).map(x=>({...x,queueType:"console"})),(state.clubData.sessions||[]).map(x=>({...x,queueType:"pc"})),(state.clubData.consoleSessions||[]).map(x=>({...x,queueType:"console"})));
 for(const d of desired){
  if(clubNPCs.some(n=>n.id===d.id))continue;
  const colors=["#e45d48","#43a77b","#8357b9","#e2a33b","#347db7","#d65b9a"];
  const mesh=makePerson(3.4,8.1,colors[clubNPCs.length%colors.length],false,clubNPCs.length+1);
  clubNPCs.push({id:d.id,mesh,phase:Math.random()*6,mode:"toQueue",station:d.station,queueType:d.queueType});
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
 const qb=$("simQueue"),ub=$("simUpgradePanel"),sb=$("simSessions"),cb=$("simConsoleUpgradePanel");
 const queue=state.clubData.queue||[],consoleQueue=state.clubData.consoleQueue||[],sessions=state.clubData.sessions||[],stations=state.clubData.stations||[],cs=state.clubData.consoleStations||[],css=state.clubData.consoleSessions||[];
 const busy=new Set(sessions.map(x=>Number(x.station))),free=stations.map((x,i)=>i).filter(i=>!busy.has(i)),cbusy=new Set(css.map(x=>Number(x.station))),cfree=cs.map((x,i)=>i).filter(i=>!cbusy.has(i));
 if(qb){qb.innerHTML="";if(!queue.length)qb.textContent="Очередь ПК пуста.";queue.forEach((q,i)=>{const row=document.createElement("div");row.className="sim-queue-row";const label=document.createElement("b");label.textContent="🖥 "+(q.name||"Посетитель")+" · очередь №"+(i+1);row.appendChild(label);const status=document.createElement("span");status.textContent=state.clubData.adminEnabled?(free.length?"Администратор ПК назначит место":"Все ПК заняты"):free.length?"Готов к оформлению на ПК":"Нет свободных ПК";row.appendChild(status);qb.appendChild(row);});}
 const cq=$("simConsoleQueue");if(cq){cq.innerHTML="";if(!consoleQueue.length)cq.textContent="Очередь консолей пуста.";consoleQueue.forEach((q,i)=>{const row=document.createElement("div");row.className="sim-queue-row";const label=document.createElement("b");label.textContent="🎮 "+(q.name||"Посетитель")+" · очередь №"+(i+1);row.appendChild(label);const status=document.createElement("span");status.textContent=state.clubData.consoleAdminEnabled?(cfree.length?"Администратор консолей назначит место":"Все консоли заняты"):cfree.length?"Готов к оформлению на консоль":"Нет свободных консолей";row.appendChild(status);cq.appendChild(row);});}
 const names={gpu:"Видеокарта",cpu:"Процессор",ram:"ОЗУ",monitor:"Монитор",keyboard:"Клавиатура",mouse:"Мышь",chair:"Кресло",desk:"Стол"};
 if(ub){ub.innerHTML="";stations.forEach((st,i)=>{const wrap=document.createElement("div");wrap.className="sim-upgrade-station";const head=document.createElement("b");head.textContent="ИГРОВОЕ МЕСТО №"+(i+1);wrap.appendChild(head);const grid=document.createElement("div");grid.className="sim-component-grid";Object.keys(names).forEach(k=>{const lv=Number((st.components||{})[k]||st.tier||1),next=lv+1,price=[0,500,2500,11000,24000][next]||0,item=document.createElement("div");item.className="sim-component";const title=document.createElement("span");title.textContent=names[k];const level=document.createElement("b");level.textContent="LVL "+lv+"/4";const button=document.createElement("button");button.type="button";button.dataset.upgradeStation=i;button.dataset.upgradeComponent=k;button.disabled=lv>=4;button.textContent=lv>=4?"MAX":"УЛУЧШИТЬ ДО LVL "+next+" · $"+price.toLocaleString("ru-RU");item.append(title,level,button);grid.appendChild(item);});wrap.appendChild(grid);ub.appendChild(wrap);});}
 if(cb){cb.innerHTML="";const labels={tv:"Телевизор",console:"Приставка",sofa:"Диван"};cs.forEach((st,i)=>{const wrap=document.createElement("div");wrap.className="sim-upgrade-station";const head=document.createElement("b");head.textContent=(st.name||"КОНСОЛЬ")+" №"+(i+1);wrap.appendChild(head);const grid=document.createElement("div");grid.className="sim-component-grid";Object.keys(labels).forEach(k=>{const lv=Number(st[k]||1),next=lv+1,price=[0,1800,6500,18000,45000][next]||0,item=document.createElement("div");item.className="sim-component";const title=document.createElement("span");title.textContent=labels[k];const level=document.createElement("b");level.textContent="LVL "+lv+"/4";const button=document.createElement("button");button.type="button";button.dataset.consoleUpgradeStation=i;button.dataset.consoleUpgradeComponent=k;button.disabled=lv>=4;button.textContent=lv>=4?"MAX":"УЛУЧШИТЬ ДО LVL "+next+" · $"+price.toLocaleString("ru-RU");item.append(title,level,button);grid.appendChild(item);});wrap.appendChild(grid);cb.appendChild(wrap);});}
 if(sb){sb.innerHTML="";const all=[...sessions.map(x=>({...x,kind:"ПК"})),...css.map(x=>({...x,kind:"КОНСОЛЬ"}))];if(!all.length)sb.textContent="Сейчас никто не играет.";all.forEach(x=>{const left=Math.max(0,Math.ceil((new Date(x.endsAt).getTime()-Date.now())/1000)),row=document.createElement("div");row.className="sim-session-row";const title=document.createElement("b");title.textContent=(x.name||"Посетитель")+" · "+x.kind+" №"+(Number(x.station)+1);const time=document.createElement("span");time.textContent="Осталось "+Math.floor(left/60)+":"+String(left%60).padStart(2,"0")+" · оплата $"+Number(x.reward||0).toLocaleString("ru-RU");row.append(title,time);sb.appendChild(row);});}
}
async function tapClub(){
 const button=$("simTapButton");if(button)button.disabled=true;
 try{const data=await api("/api/simulator/tap",{method:"POST",body:"{}"});Object.assign(state,data.state||{});updateHUD();toast("+$"+data.reward+" на счёт клуба");}
 catch(error){toast(error.message,"error");}
 finally{if(button)button.disabled=false;}
}
function openReception(){receptionMode="pc";const modal=$("simReceptionModal"),queue=state.clubData.queue||[];if(!modal)return;if(!queue.length){toast("Пока никто не подошёл к ресепшену","info");return;}receptionGuestId=queue[0].id;receptionDuration=120+Math.floor(Math.random()*181);renderReceptionModal();modal.classList.add("open");modal.setAttribute("aria-hidden","false");}
function openConsoleReception(){receptionMode="console";const modal=$("simReceptionModal"),queue=state.clubData.consoleQueue||[];if(!modal)return;if(!queue.length){toast("Пока никто не подошёл к консольному ресепшену","info");return;}receptionGuestId=queue[0].id;receptionDuration=240;renderReceptionModal();modal.classList.add("open");modal.setAttribute("aria-hidden","false");}
function closeReception(){const modal=$("simReceptionModal");if(modal){modal.classList.remove("open");modal.setAttribute("aria-hidden","true");}receptionGuestId=null;}
function renderReceptionModal(){
 const modal=$("simReceptionModal");if(!modal)return;const guest=(receptionMode==="console"?(state.clubData.consoleQueue||[]):(state.clubData.queue||[])).find(x=>x.id===receptionGuestId);if(!guest){closeReception();return;}
 const sessions=state.clubData.sessions||[],stations=state.clubData.stations||[],busy=new Set(sessions.map(x=>Number(x.station)));
 const select=$("simReceptionStation");$("simReceptionGuest").textContent=guest.name||"Посетитель";const modalTitle=$("simReceptionModal").querySelector("h2");if(modalTitle)modalTitle.textContent=receptionMode==="console"?"🎮 ОФОРМЛЕНИЕ ИГРОКА НА КОНСОЛЬ":"💻 ОФОРМЛЕНИЕ ПОСЕТИТЕЛЯ";const stationLabel=select.previousElementSibling;if(stationLabel)stationLabel.textContent=receptionMode==="console"?"ВЫБЕРИ СВОБОДНУЮ КОНСОЛЬ":"ВЫБЕРИ СВОБОДНЫЙ ПК ИЛИ КОНСОЛЬ";
 $("simReceptionDuration").textContent=Math.floor(receptionDuration/60)+" мин "+String(receptionDuration%60).padStart(2,"0")+" сек";
 select.innerHTML="";
 if(receptionMode==="pc")stations.forEach((st,i)=>{if(busy.has(i))return;const c=st.components||{},tier=Math.max(1,Math.min(4,...["gpu","cpu","ram","monitor","keyboard","mouse","chair","desk"].map(k=>Number(c[k]||st.tier||1))));const paymentRange=[null,[500,1000],[2000,4000],[5000,7000],[10000,15000]][tier];const opt=document.createElement("option");opt.value=i;const quotedReward=paymentRange[0]+Math.floor(Math.random()*(paymentRange[1]-paymentRange[0]+1));opt.dataset.reward=quotedReward;opt.textContent="ПК №"+(i+1)+" · оплата $"+quotedReward.toLocaleString("ru-RU");select.appendChild(opt);});
 if(receptionMode==="console")(state.clubData.consoleStations||[]).forEach((st,i)=>{if((state.clubData.consoleSessions||[]).some(x=>Number(x.station)===i))return;const opt=document.createElement("option");opt.value="console:"+i;const tier=Math.max(1,Math.min(4,Number(st.tv||1),Number(st.console||1),Number(st.sofa||1)));opt.dataset.tier=tier;const ranges={1:[3000,5000],2:[7000,10000],3:[15000,18000],4:[23000,30000]},range=ranges[tier]||ranges[1],quoted=range[0]+Math.floor(Math.random()*(range[1]-range[0]+1));opt.dataset.reward=quoted;opt.textContent=(st.name||"Консоль")+" №"+(i+1)+" · 4 мин · оплата $"+quoted.toLocaleString("ru-RU");select.appendChild(opt);});
 const update=()=>{const opt=select.selectedOptions[0],isConsole=String(opt?.value||"").startsWith("console:"),mins=Number($("simConsoleMinutes")?.value||4);if($("simConsoleMinutes"))$("simConsoleMinutes").style.display=isConsole?"block":"none";if(isConsole)$("simReceptionDuration").textContent=mins+" минут";else $("simReceptionDuration").textContent=Math.floor(receptionDuration/60)+" мин "+String(receptionDuration%60).padStart(2,"0")+" сек";let reward=Number(opt?.dataset.reward||0);if(isConsole){const ranges={1:[3000,5000],2:[7000,10000],3:[15000,18000],4:[23000,30000]},r=ranges[Number(opt?.dataset.tier||1)]||ranges[1];reward=r[0]+Math.floor(Math.random()*(r[1]-r[0]+1));if(opt)opt.dataset.reward=reward;}$("simReceptionPrice").textContent=opt?"$"+reward.toLocaleString("ru-RU"):"—";$("simReceptionConfirm").disabled=!opt;$("simReceptionHint").textContent=isConsole?"Выбрано консольное место. Оплата поступит в кассу после окончания сессии.":opt?"Выдай посетителю свободный ПК. Оплата поступит в кассу после завершения сессии.":"Свободных мест нет — дождись освобождения.";};select.onchange=update;if($("simConsoleMinutes"))$("simConsoleMinutes").onchange=update;update();
}
function rebuildClubScene(){
 const position=player?player.position.clone():new THREE.Vector3(0,0,7.7),rotation=player?player.rotation.y:0;
 interactables.length=0;animated.length=0;stationGroups.length=0;consoleGroups.length=0;clubNPCs.length=0;
 buildStore();player.position.copy(position);player.rotation.y=rotation;resize();
}
function updateHUD() {
  $("simCash").textContent = "$" + Number(state.cash || 0).toLocaleString("ru-RU");
  $("simLevel").textContent = state.level || 1;
  $("simCustomers").textContent = state.customers || 0;
  $("simXpText").textContent = (Number(state.xp || 0) % 100) + " / 100 опыта";
  $("simXpFill").style.width = (Number(state.xp || 0) % 100) + "%";if($("simConsoleCount"))$("simConsoleCount").textContent=(state.clubData.consoleStations||[]).length+" / 8";
  if ($("simStations")) $("simStations").textContent = (state.stations || 4) + " / 8";
  if ($("simIncome")) $("simIncome").textContent = "$" + Number(state.hourlyIncome || 0).toLocaleString("ru-RU") + "/ч";
  if ($("simAdLevel")) $("simAdLevel").textContent = state.adLevel || 0;
  const expand=$("simExpandRoom"),rl=Number(state.clubData.roomLevel||0),rp=[12000,25000,50000];if(expand){expand.disabled=rl>=3;expand.textContent=rl>=3?"🏢 ЗАЛ МАКСИМАЛЬНОГО УРОВНЯ":"🏢 РАСШИРИТЬ ЗАЛ · $"+rp[rl].toLocaleString("ru-RU");}
  const admin=$("simHireAdmin"),adminHired=Boolean(state.clubData.adminEnabled);if(admin){admin.disabled=adminHired;admin.textContent=adminHired?"✓ АДМИНИСТРАТОР НАНЯТ":"👨‍💼 НАНЯТЬ АДМИНИСТРАТОРА · $40 000";}
  const cExpand=$("simExpandConsoleRoom"),crl=Number(state.clubData.consoleRoomLevel||0),crp=[15000,30000,60000];if(cExpand){cExpand.disabled=crl>=3;cExpand.textContent=crl>=3?"🏢 КОНСОЛЬНЫЙ ЗАЛ МАКСИМАЛЬНЫЙ":"🏢 РАСШИРИТЬ КОНСОЛЬНЫЙ ЗАЛ · $"+crp[crl].toLocaleString("ru-RU");}
  const cAdmin=$("simHireConsoleAdmin"),cAdminHired=Boolean(state.clubData.consoleAdminEnabled);if(cAdmin){cAdmin.disabled=cAdminHired;cAdmin.textContent=cAdminHired?"✓ АДМИНИСТРАТОР КОНСОЛЕЙ НАНЯТ":"👨‍💼 НАНЯТЬ АДМИНИСТРАТОРА · $40 000";}
  stationGroups.forEach(g=>{g.visible=true;if(g.parent!==scene)scene.add(g);});
  renderClubPanels();if(scene)syncClubNPCs();
}
async function loadState() {
  try {
    const data = await api("/api/simulator/state");
    Object.assign(state, data.state || {}); updateHUD();
  } catch (error) { $("simHint").textContent = error.message; }
}
async function doAction(action,extra={}){if(actionBusy)return;actionBusy=true;$("simAction").disabled=true;try{const d=await api("/api/simulator/action",{method:"POST",body:JSON.stringify({action,...extra})});Object.assign(state,d.state||{});updateHUD();if(["expand_room","expand_console_room","upgrade_component","buy_station","upgrade_console_component","buy_console_station"].includes(action)&&scene)rebuildClubScene();if(action==="start_session")closeReception();toast(d.message||"Готово");$("simHint").textContent=d.message||"Готово";}catch(e){toast(e.message,"error");}finally{actionBusy=false;$("simAction").disabled=!activeObject;}}
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
    joyPointer = event.pointerId; joy.classList.add("is-pressed"); joy.setPointerCapture(event.pointerId);
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
    joyPointer = null; joy.classList.remove("is-pressed"); moveX = 0; moveY = 0; stick.style.transform = "translate(0,0)";
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
  $("simAction").addEventListener("click",()=>{if(!activeObject)return;if(activeObject.action==="open_reception"){openReception();return;}if(activeObject.action==="open_console_reception"){openConsoleReception();return;}doAction(activeObject.action||"upgrade_station",{station:activeObject.station??activeObject.index,component:activeObject.component});});
  $("simReceptionClose")?.addEventListener("click",closeReception);
  $("simReceptionModal")?.addEventListener("click",e=>{if(e.target===$("simReceptionModal"))closeReception();});
  $("simReceptionConfirm")?.addEventListener("click",()=>{const select=$("simReceptionStation");if(receptionGuestId&&select?.value!==""){const isConsole=String(select.value).startsWith("console:");doAction("start_session",{queueId:receptionGuestId,station:isConsole?select.value:Number(select.value),duration:receptionDuration,minutes:Number($("simConsoleMinutes")?.value||4),expectedReward:Number(select.selectedOptions[0]?.dataset.reward||0)});}});
  $("simTapButton")?.addEventListener("click",tapClub);
  $("simQueue")?.addEventListener("click",event=>{const b=event.target.closest("[data-confirm-guest]");if(!b)return;const id=b.dataset.confirmGuest,sel=$("simQueue").querySelector('[data-station-for="'+id+'"]');if(sel)doAction("start_session",{queueId:id,station:Number(sel.value)});});
  $("simUpgradePanel")?.addEventListener("click",event=>{const b=event.target.closest("[data-upgrade-component]");if(!b)return;doAction("upgrade_component",{station:Number(b.dataset.upgradeStation),component:b.dataset.upgradeComponent});});
  $("simConsoleUpgradePanel")?.addEventListener("click",event=>{const b=event.target.closest("[data-console-upgrade-component]");if(!b)return;doAction("upgrade_console_component",{station:Number(b.dataset.consoleUpgradeStation),component:b.dataset.consoleUpgradeComponent});});
  $("simBuyConsoleStation")?.addEventListener("click",()=>doAction("buy_console_station"));
  $("simBuyStation")?.addEventListener("click",()=>doAction("buy_station"));
  $("simHireAdmin")?.addEventListener("click",()=>doAction("buy_admin"));
  $("simExpandRoom")?.addEventListener("click",()=>doAction("expand_room"));
  $("simHireConsoleAdmin")?.addEventListener("click",()=>doAction("buy_console_admin"));
  $("simExpandConsoleRoom")?.addEventListener("click",()=>doAction("expand_console_room"));
  document.querySelectorAll("[data-sim-mode]").forEach(button=>button.addEventListener("click",()=>{const mode=button.dataset.simMode;document.querySelectorAll("[data-sim-mode]").forEach(x=>x.classList.toggle("active",x===button));document.querySelectorAll("[data-sim-manager]").forEach(panel=>panel.hidden=panel.dataset.simManager!==mode);}));
  $("simAdvertise")?.addEventListener("click",()=>doAction("advertise"));
  $("simCashout")?.addEventListener("click",async()=>{try{const d=await api("/api/simulator/exchange",{method:"POST",body:JSON.stringify({currency:"gramm"})});Object.assign(state,d.state||{});updateHUD();toast("Зачислено "+d.gramm+" GRAMM на основной баланс");}catch(e){toast(e.message,"error");}});
  window.addEventListener("keydown", event => {
    if (["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.code)) {
      keys[event.code] = true; event.preventDefault();
    }
    if (event.code === "KeyE" && activeObject) {if(activeObject.action==="open_reception")openReception();else if(activeObject.action==="open_console_reception")openConsoleReception();else doAction(activeObject.action||"upgrade_station",{station:activeObject.station??activeObject.index,component:activeObject.component});}
  });
  window.addEventListener("keyup", event => { keys[event.code] = false; });
  window.addEventListener("blur", () => { Object.keys(keys).forEach(key => keys[key] = false); moveX = moveY = 0; });
}
window.openSimulator = function(id) {
  const hub = $("simulatorHub"), page = $("simulator");
  const pcView = $("pcSimulatorView"), resaleView = $("resaleSimulatorView"), realEstateView = $("realEstateSimulatorView");
  if (!hub || !page) {
    console.error("UGLY SIMULATOR: не найдены элементы центра симуляторов");
    return;
  }
  if (id !== "pc" && id !== "resale" && id !== "realestate") return;
  document.querySelectorAll(".page").forEach(el => el.classList.remove("active"));
  page.classList.add("active");
  document.querySelectorAll(".nav-button").forEach(button => button.classList.toggle("active", button.dataset.page === "simulator"));
  hub.hidden = true;
  if (id === "resale") {
    if (!resaleView) { hub.hidden = false; console.error("UGLY SIMULATOR: не найден экран перепродажи"); return; }
    if (pcView) pcView.hidden = true;
    resaleView.hidden = false;
    if (typeof window.initResaleSimulator === "function") window.initResaleSimulator();
    window.scrollTo({top:0,behavior:"smooth"});
    return;
  }
  if (id === "realestate") {
    if (!realEstateView) { hub.hidden = false; console.error("UGLY SIMULATOR: не найден экран недвижимости"); return; }
    if (pcView) pcView.hidden = true;
    if (resaleView) resaleView.hidden = true;
    realEstateView.hidden = false;
    if (typeof window.initRealEstateSimulator === "function") window.initRealEstateSimulator();
    window.scrollTo({top:0,behavior:"smooth"});
    return;
  }
  if (!pcView) { hub.hidden = false; console.error("UGLY SIMULATOR: не найден экран ПК-клуба"); return; }
  if (resaleView) resaleView.hidden = true;
  if (realEstateView) realEstateView.hidden = true;
  pcView.hidden = false;
  pcView.style.display = "block";
  requestAnimationFrame(() => {
    resize();
    if (typeof window.initUglyBusiness === "function") window.initUglyBusiness();
  });
};
window.closeRealEstateSimulator = function() {
  const view = $("realEstateSimulatorView"), hub = $("simulatorHub");
  if (view) view.hidden = true;
  if (hub) hub.hidden = false;
};
window.closeSimulator = function() {
  const hub = $("simulatorHub"), view = $("pcSimulatorView");
  if (!hub || !view) return;
  view.hidden = true;
  hub.hidden = false;
  if (raf) { cancelAnimationFrame(raf); raf = 0; }
  moveX = moveY = 0;
  Object.keys(keys).forEach(key => keys[key] = false);
  $("simJoystick")?.classList.remove("is-pressed");
  const stick = $("simStick");
  if (stick) stick.style.transform = "translate(0,0)";
};
window.initUglyBusiness = async function() {
  if ($("pcSimulatorView")?.hidden) return;
  if (ready) { resize(); if (!raf && !document.hidden) { lastFrameAt = 0; clock.start(); animate(); } return; }
  if (!initData) { $("simHint").textContent = "Открой игру через Telegram"; return; }
  try {
    const canvas = $("uglyBusinessCanvas");
    compactDevice = window.matchMedia?.("(max-width: 760px), (pointer: coarse)").matches || /iPhone|Android/i.test(navigator.userAgent);
    const memoryGB=Number(navigator.deviceMemory||4),cores=Number(navigator.hardwareConcurrency||4);
    lowPowerDevice=compactDevice&&(memoryGB<=4||cores<=4);
    frameInterval=compactDevice?(lowPowerDevice?1000/30:1000/40):0;
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !compactDevice, alpha: false, powerPreference: "high-performance", stencil: false, depth: true });
    // Adaptive render scale: preserve sharpness while avoiding oversized Retina framebuffers.
    const maxPixelRatio=lowPowerDevice?1.15:compactDevice?1.5:2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,maxPixelRatio));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.info.autoReset = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.18;
    renderer.setClearColor("#111a29", 1);
    await loadState(); buildStore(); clock = new THREE.Clock(); bindControls(); ready = true; resize();
    if(stageResizeObserver)stageResizeObserver.disconnect();
    if("ResizeObserver" in window){stageResizeObserver=new ResizeObserver(()=>resize());const stage=canvas.closest(".sim-stage");if(stage)stageResizeObserver.observe(stage);}
    if(window.visualViewport)window.visualViewport.addEventListener("resize",resize,{passive:true});
    if(statePollTimer)clearInterval(statePollTimer);statePollTimer=setInterval(()=>{if(ready&&$("simulator")?.classList.contains("active")&&!$("pcSimulatorView")?.hidden)loadState();},5000);
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
    if (page.classList.contains("active") && !$("pcSimulatorView")?.hidden) window.initUglyBusiness();
    else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  });
  observer.observe(page, { attributes: true, attributeFilter: ["class"] });
  if (page.classList.contains("active") && !$("pcSimulatorView")?.hidden) window.initUglyBusiness();
}
window.addEventListener("resize", resize);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
  else if (!document.hidden && ready && $("simulator")?.classList.contains("active") && !$("pcSimulatorView")?.hidden && !raf) { lastFrameAt=0; clock.start(); animate(); }
});
