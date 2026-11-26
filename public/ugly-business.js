import * as THREE from "three";

const $ = id => document.getElementById(id);
const initData = window.Telegram?.WebApp?.initData || "";
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const state = { cash:0, level:1, customers:0, xp:0, stations:4, adLevel:0, hourlyIncome:0, clubData:{stations:[],queue:[],consoleQueue:[],sessions:[],consoleSessions:[]} };
let renderer, scene, camera, player, clock, ready = false, raf = 0;
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
        ctx.strokeStyle="rgba(5,12,22,.72)";ctx.lineWidth=5;ctx.strokeRect(x+3,y+3,tile-6,tile-6);
        ctx.strokeStyle="rgba(190,218,239,.12)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+12,y+12);ctx.lineTo(x+tile-12,y+12);ctx.stroke();
      }
    } else if(kind==="wood"){
      for(let i=0;i<150;i++){const y=(i/150)*h,alpha=.035+Math.random()*.11;ctx.strokeStyle="rgba(24,10,4,"+alpha+")";ctx.lineWidth=1+Math.random()*4;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(w*.28,y-8,w*.66,y+9,w,y+(Math.random()-.5)*14);ctx.stroke();}
      for(let i=0;i<18;i++){ctx.strokeStyle="rgba(220,174,119,.12)";ctx.beginPath();ctx.ellipse(Math.random()*w,Math.random()*h,12+Math.random()*34,3+Math.random()*7,0,0,Math.PI*2);ctx.stroke();}
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
      for(let i=0;i<5200;i++){const v=Math.random(),a=.025+Math.random()*.07;ctx.fillStyle=v>.5?"rgba(255,255,255,"+a+")":"rgba(0,0,0,"+a+")";ctx.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*2);}
    } else {
      for(let i=0;i<4200;i++){const a=Math.random()*.08;ctx.fillStyle=Math.random()>.5?"rgba(255,255,255,"+a+")":"rgba(0,0,0,"+a+")";ctx.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*2);}
    }
  },512,512);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(kind==="floor"?2:1,kind==="floor"?2:1);
  texture.anisotropy=renderer?.capabilities?.getMaxAnisotropy?.()||8;
  surfaceMaps[kind]=texture;return texture;
}
function surfaceMat(color,kind,roughness=.65,metalness=0,extra={}) {
  const map=surfaceTexture(kind);
  const scale=kind==="metal"?.018:kind==="fabric"?.045:kind==="wall"?.025:kind==="wood"?.035:.018;
  return mat(color,roughness,metalness,{map,bumpMap:map,bumpScale:scale,...extra});
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
 animated.push({type:"character",root,torsoPivot,pelvis,head,limbs,phase:variant*.71,isPlayer});return root;
}
function makeGamingPC(parent,x,y,z,tier=1,cpuTier=1,ramTier=1){
 const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);
 const colors=["#202d3d","#15506d","#17634e","#56377c"],lights=["#27c8ff","#7c69ff","#35f0c0","#ffbf45"],emissives=["#0877a8","#3820a1","#087b55","#9c5700"],idx=clamp((tier||1)-1,0,3);
 const glow=mat(lights[idx],.24,.15,{emissive:emissives[idx],emissiveIntensity:1.55});
 box(g,.46,.68,.43,0,.36,0,surfaceMat(colors[idx],"plastic",.28,.48),true);
 box(g,.012,.57,.35,.237,.37,0,mat("#7892a9",.2,.35,{transparent:true,opacity:.72}),false);box(g,.018,.57,.35,.245,.37,0,glow,false);
 for(let i=0;i<3;i++){const fan=cylinder(g,.078,.078,.022,0,.56-i*.19,-.224,glow,24);fan.rotation.x=Math.PI/2;const hub=cylinder(g,.025,.025,.026,0,.56-i*.19,-.24,mat("#d9f7ff",.2,.45),16);hub.rotation.x=Math.PI/2;}
 box(g,.31,.025,.018,0,.69,-.225,mat("#d8eaff",.22,.35),false);box(g,.12,.035,.025,.14,.69,-.23,glow,false);
 for(let i=0;i<4;i++)box(g,.025,.19,.012,-.14+i*.045,.36,.219,mat("#9fb3c8",.3,.65),false);
 const cpuIndex=clamp(cpuTier,1,4)-1,ramIndex=clamp(ramTier,1,4)-1;
 const partColors=["#ffbd45","#24cfff","#42e6a5","#bf82ff"],partEmits=["#704000","#00618a","#087a4d","#4a1a83"];
 const cpuGlow=mat(partColors[cpuIndex],.24,.2,{emissive:partEmits[cpuIndex],emissiveIntensity:.35+cpuTier*.15});
 const ramGlow=mat(partColors[ramIndex],.24,.2,{emissive:partEmits[ramIndex],emissiveIntensity:.35+ramTier*.15});
 box(g,.055,.22,.018,.14,.36,-.225,cpuGlow,false);box(g,.07,.24,.012,.14,.36,-.238,surfaceMat("#25374a","metal",.38,.72),false);
 for(let i=0;i<Math.min(4,ramTier);i++)box(g,.035,.16,.018,-.12+i*.07,.35,-.226,ramGlow,false);
 return g;
}
function makeGamingStation(x,z,index,data){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 const c=data.components||{},levels=Object.values(c).map(Number).filter(v=>v>0),tier=levels.length?Math.min(4,...levels):Math.max(1,Number(data.tier)||1);
 const gpu=clamp(Number(c.gpu)||tier,1,4),cpu=clamp(Number(c.cpu)||tier,1,4),ram=clamp(Number(c.ram)||tier,1,4),monitor=clamp(Number(c.monitor)||tier,1,4),keyboard=clamp(Number(c.keyboard)||tier,1,4),mouse=clamp(Number(c.mouse)||tier,1,4),chairLevel=clamp(Number(c.chair)||tier,1,4),deskLevel=clamp(Number(c.desk)||tier,1,4);
 const palette=["#ffbd45","#24cfff","#42e6a5","#bf82ff"],emit=["#704000","#00618a","#087a4d","#4a1a83"],trim=mat(palette[gpu-1],.26,.42,{emissive:emit[gpu-1],emissiveIntensity:.55});
 const screenMat=mat("#fff",.24,.05,{map:canvasTexture((ctx,w,h)=>{const gr=ctx.createLinearGradient(0,0,w,h);gr.addColorStop(0,["#12314c","#0a5276","#104a38","#48265f"][monitor-1]);gr.addColorStop(1,["#07111f","#142b5a","#102b25","#211333"][monitor-1]);ctx.fillStyle=gr;ctx.fillRect(0,0,w,h);ctx.fillStyle="#fff";ctx.font="bold 38px Arial";ctx.fillText("UGLY",18,57);ctx.font="16px Arial";ctx.fillText("GAMING ARENA / PC "+(index+1),18,83);ctx.fillStyle=palette[monitor-1];ctx.fillRect(18,104,w*.72,7);},256,160),emissive:palette[monitor-1],emissiveIntensity:.12+monitor*.055});
 const deskPalette=["#26374b","#174d68","#18513f","#49315f"],deskGlow=["#71869c","#2b9ab5","#398b6c","#9270b8"],deskShell=surfaceMat(deskPalette[deskLevel-1],"plastic",.3,.42);box(g,2.1,.15,.92,0,.78,0,deskShell);box(g,2.12,.045,.94,0,.87,0,mat(palette[deskLevel-1],.26,.15,{emissive:emit[deskLevel-1],emissiveIntensity:.28+deskLevel*.1}),false);
 for(const sx of [-.9,.9]){box(g,.12,.76,.13,sx,.38,0,mat(deskGlow[deskLevel-1],.28,.62));box(g,.13,.035,.14,sx,.72,.03,mat(palette[deskLevel-1],.26,.15,{emissive:emit[deskLevel-1],emissiveIntensity:.35}),false);}
 box(g,.88,.56,.11,0,1.28,-.36,surfaceMat("#111b2b","plastic",.22,.42));box(g,.76,.42,.016,0,1.29,-.422,screenMat,false);
 box(g,.12,.17,.13,0,1.02,-.34,mat("#71849a",.26,.58));box(g,.34,.035,.25,0,.98,-.19,mat("#182536",.3,.35));
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
 box(chair,.65,.65,.17,0,.72,.12,chairMat);box(chair,.5,.12,.18,0,1.1,.1,trim,false);
 for(const sx of [-1,1]){box(chair,.08,.38,.48,sx*.37,.48,.02,chairMat,false);box(chair,.1,.08,.34,sx*.37,.67,.02,trim,false);}
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
 box(g,1.62,.9,.12,0,1.37,-.92,mat("#101722",.22,.55));
 box(g,1.49,.76,.025,0,1.39,-.852,mat("#fff",.18,.08,{emissive:["#17324b","#12445a","#164a39","#38224f"][tv-1],emissiveIntensity:.5+tv*.12}));
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
 makeLabel(g,"CONSOLE "+String(index+1).padStart(2,"0"),0,2.12,-.92,1.8,.32);g.userData={consoleIndex:index};consoleGroups.push(g);
 for(const key of ["tv","console","sofa"])interactables.push({position:new THREE.Vector3(x+(key==="tv"?-.65:key==="console"?.65:0),0,z+(key==="sofa"?1.2:-.8)),name:({tv:"Телевизор",console:"Приставка",sofa:"Диван"})[key],hint:"КОНСОЛЬНАЯ ЗОНА · "+({tv:"ТЕЛЕВИЗОР",console:"ПРИСТАВКА",sofa:"ДИВАН"})[key]+" · НАЖМИ ДЛЯ УЛУЧШЕНИЯ",action:"upgrade_console_component",station:index,component:key,radius:1.8});
}
function buildStore(){
 scene=new THREE.Scene();scene.background=new THREE.Color("#101a32");scene.fog=new THREE.Fog("#101a32",27,52);camera=new THREE.PerspectiveCamera(58,1,.1,100);
 scene.add(new THREE.HemisphereLight("#c8eaff","#22233d",1.8));
 const key=new THREE.DirectionalLight("#fff0d4",2.8);key.position.set(-6,12,7);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.bias=-0.00012;key.shadow.normalBias=.025;key.shadow.camera.left=-15;key.shadow.camera.right=15;key.shadow.camera.top=15;key.shadow.camera.bottom=-15;scene.add(key);
 for(const [color,intensity,pos] of [["#21cfff",70,[-5,3,-4]],["#9c4dff",65,[6,3,2]],["#ff4e9b",35,[0,3,7]]]){const l=new THREE.PointLight(color,intensity,20,2);l.position.set(...pos);scene.add(l);}
 const roomSize=18+Number(state.clubData.roomLevel||0)*4,roomHalf=roomSize/2;
 box(scene,roomSize,.35,roomSize,0,-.18,0,surfaceMat("#ffffff","floor",.32,.18));
 box(scene,roomSize,5,.32,0,2.35,-roomHalf,surfaceMat("#ffffff","wall",.88,0));box(scene,.32,5,roomSize,-roomHalf,2.35,0,surfaceMat("#ffffff","wall",.88,0));box(scene,.32,5,roomHalf-2.5,roomHalf,2.35,-(roomHalf+2.5)/2,surfaceMat("#ffffff","wall",.88,0));box(scene,.32,5,roomHalf-2.5,roomHalf,2.35,(roomHalf+2.5)/2,surfaceMat("#ffffff","wall",.88,0));box(scene,roomSize,.25,roomSize,0,5,0,surfaceMat("#ffffff","ceiling",.82,.08));
 const wingX=roomHalf+4.75;
 const consoleRoomLevel=Number(state.clubData.consoleRoomLevel||0),consoleDepth=22+consoleRoomLevel*4,consoleCenterZ=consoleRoomLevel*2;
 box(scene,9.5,.3,consoleDepth,wingX,-.18,consoleCenterZ,surfaceMat("#ffffff","floor",.32,.18));
 box(scene,9.5,5,.3,wingX,2.35,-11,surfaceMat("#ffffff","wall",.88,0));box(scene,9.5,5,.3,wingX,2.35,11+consoleRoomLevel*4,surfaceMat("#ffffff","wall",.88,0));box(scene,.3,5,consoleDepth,roomHalf+9.5,2.35,consoleCenterZ,surfaceMat("#ffffff","wall",.88,0));box(scene,9.5,.25,consoleDepth,wingX,5,consoleCenterZ,surfaceMat("#ffffff","ceiling",.82,.08));
 box(scene,.12,3.5,.18,roomHalf+.08,2.1,-2.3,mat("#21cfff",.2,.3,{emissive:"#087fa8",emissiveIntensity:1}),false);box(scene,.12,3.5,.18,roomHalf+.08,2.1,2.3,mat("#a55cff",.2,.3,{emissive:"#4a138c",emissiveIntensity:1}),false);
 const wingSign=new THREE.Mesh(new THREE.PlaneGeometry(3.4,.65),signMaterial("CONSOLE LOUNGE","PLAYSTATION • XBOX"));wingSign.position.set(roomHalf+4.75,3.7,-10.78);scene.add(wingSign);
 box(scene,.12,2.5,3.2,-2.45,1.25,6.0,surfaceMat("#263d58","plastic",.35,.3));box(scene,.12,2.5,3.2,2.45,1.25,6.0,surfaceMat("#263d58","plastic",.35,.3));// Keep the entrance-to-club passage open: rear reception partition removed.
 for(let i=0;i<7;i++){const p=box(scene,.12,3.6,.08,-7.2+i*2.4,2.25,-8.78,mat(i%2?"#1bd5ff":"#a56cff",.32,.25,{emissive:i%2?"#087a9d":"#4d1684",emissiveIntensity:.55}),false);p.rotation.z=i%2?.18:-.18;}
 box(scene,7,.95,.22,0,4.12,-8.72,mat("#121d31",.3,.3));const sign=new THREE.Mesh(new THREE.PlaneGeometry(6.5,.72),signMaterial("UGLY CYBER CLUB","PLAY • COMPETE • LEVEL UP"));sign.position.set(0,4.12,-8.57);scene.add(sign);
 for(const z of [-6,-1,4]){box(scene,17,.08,.16,0,3.45,z,mat("#20cfff",.28,.4,{emissive:"#087fa8",emissiveIntensity:.9}),false);box(scene,17,.06,.14,0,3.28,z+.12,mat("#a55cff",.28,.4,{emissive:"#4a138c",emissiveIntensity:.75}),false);}
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
   cylinder(pot,.34,.25,.48,0,.24,0,mat("#bd754d",.72,.04),20);
   cylinder(pot,.35,.35,.07,0,.49,0,mat("#d99567",.62,.04),20);
   cylinder(pot,.29,.29,.035,0,.53,0,mat("#342a25",1),20);
   cylinder(pot,.035,.045,.82,0,.91,0,mat("#6b4b31",.95),10);
   const greens=["#347d50","#4b9a5e","#71b86c","#236a49","#8bc66d"];
   for(let i=0;i<9;i++){
     const angle=i*Math.PI*2/9,leaf=new THREE.Group();leaf.position.set(Math.cos(angle)*.12,.83+((i%3)*.12),Math.sin(angle)*.12);leaf.rotation.z=Math.cos(angle)*-.62;leaf.rotation.y=-angle;pot.add(leaf);
     const blade=sphere(leaf,.16,0,.22,0,mat(greens[i%greens.length],.82),12,10);blade.scale.set(.62,1.8,.42);
   }
   for(let i=0;i<4;i++){const leaf=sphere(pot,.15,(i-1.5)*.09,1.22+(i%2)*.08,(i%2?1:-1)*.08,mat(greens[(i+2)%greens.length],.82),12,10);leaf.scale.set(.55,1.5,.42);}
 };
 addPlant(-roomHalf+1,-roomHalf+1,.92);addPlant(roomHalf-1,-roomHalf+1,.92);
 addPlant(-roomHalf+1,roomHalf-1,.92);addPlant(roomHalf-1,roomHalf-1,.92);
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
          const thigh=seatedConsole?1.12:-.88,knee=seatedConsole?-1.28:.98,armPose=seatedConsole?-1.05:-.68,forearmPose=seatedConsole?-.72:-.38;
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
    if(session||consoleSession){if(consoleSession){const ci=Number(consoleSession.station),x=9+Number(state.clubData.roomLevel||0)*2+2.5+(ci%2)*4.2,z=-7.5+Math.floor(ci/2)*5;dest=new THREE.Vector3(x,0,z+.58);}else{const spots=[[-5.1,-3.4],[-1.8,-3.4],[1.8,-3.4],[5.1,-3.4],[-5.1,2],[-1.8,2],[1.8,2],[5.1,2]],p=spots[session.station]||spots[0];dest=new THREE.Vector3(p[0],npc.mode==="play"?.24:0,p[1]+1.05);}if(npc.mode!=="play")npc.mode="toSeat";}
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

  stationGroups.forEach((g,i)=>g.visible=i<(state.stations||4));consoleGroups.forEach((g,i)=>g.visible=i<(state.clubData.consoleStations||[]).length);
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
  stationGroups.forEach((g,i)=>g.visible=i<(state.stations||4));
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
window.initUglyBusiness = async function() {
  if (ready) { resize(); return; }
  if (!initData) { $("simHint").textContent = "Открой игру через Telegram"; return; }
  try {
    const canvas = $("uglyBusinessCanvas");
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
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
