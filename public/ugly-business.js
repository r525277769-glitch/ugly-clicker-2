import * as THREE from "three";

const $ = id => document.getElementById(id);
const initData = window.Telegram?.WebApp?.initData || "";
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const state = { cash:0, level:1, customers:0, xp:0, stations:4, adLevel:0, hourlyIncome:0, clubData:{stations:[]} };
let renderer, scene, camera, player, clock, ready = false, raf = 0;
let yaw = 0, moveX = 0, moveY = 0, activeObject = null, actionBusy = false;
let joyPointer = null, lookPointer = null, lookLastX = 0, joyCenter = { x: 0, y: 0 };
let joystickRadius = 48, cameraDistance = 5.8, cameraHeight = 3.2;
const interactables = [], animated = [], keys = Object.create(null);
const stationGroups=[], clubNPCs=[];
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
 const skins=["#f0b58a","#a96f4f","#e1a078","#c58b68","#f2c29c"],skin=mat(skins[variant%skins.length],.82);
 const clothes=mat(shirt,.68),pants=mat(["#27344f","#30333c","#3b2e4d","#25413f"][variant%4],.82);
 const accent=mat(["#ffd34f","#34d8ff","#ff6a8a","#9b79ff"][variant%4],.35,.15,{emissive:["#5b3b00","#003d55","#501020","#28104d"][variant%4],emissiveIntensity:.35});
 const torsoPivot=new THREE.Group();torsoPivot.position.set(0,1.12,0);root.add(torsoPivot);
 addMesh(torsoPivot,new THREE.CapsuleGeometry(.31,.48,5,12),clothes,[0,0,0]);
 box(torsoPivot,.42,.24,.055,0,.08,.285,accent,false);box(torsoPivot,.47,.09,.34,0,-.29,0,mat("#202633"),false);
 cylinder(root,.105,.12,.18,0,1.48,0,skin,14);
 const head=new THREE.Group();head.position.set(0,1.77,0);root.add(head);sphere(head,.255,0,0,0,skin,24,18);
 const hair=mat(["#28202b","#4a2b1c","#171b28","#b77b35"][variant%4]);
 const cap=sphere(head,.26,0,.13,-.015,hair,20,12);cap.scale.set(1,.58,1.02);
 for(const side of [-1,1]){sphere(head,.075,side*.245,-.015,0,skin,12,10);sphere(head,.036,side*.09,.025,.222,mat("#fffdf4"),12,10);sphere(head,.019,side*.09,.022,.253,mat("#20212b"),10,8);box(head,.09,.018,.025,side*.09,.105,.235,mat("#3a2925"),false).rotation.z=side*-.12;}
 sphere(head,.04,0,-.045,.25,skin,12,8);
 if(variant%3===0){box(head,.55,.075,.34,0,.22,-.015,accent,false);box(head,.09,.16,.08,0,.14,.16,accent,false);}
 const limbs=[];
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.37,1.34,0);root.add(arm);cylinder(arm,.115,.14,.48,0,-.22,0,clothes,14);sphere(arm,.115,0,-.48,.015,skin,12,10);box(arm,.17,.09,.16,0,-.49,.025,accent,false);
  const leg=new THREE.Group();leg.position.set(side*.16,.72,0);root.add(leg);cylinder(leg,.14,.16,.52,0,-.25,0,pants,14);cylinder(leg,.105,.12,.12,0,-.52,0,skin,12);
  const shoe=new THREE.Group();shoe.position.set(0,-.56,-.08);leg.add(shoe);box(shoe,.27,.16,.42,0,0,-.035,mat(variant%2?"#171c29":"#f2f0e9"),false);box(shoe,.28,.045,.4,0,-.085,-.035,accent,false);
  limbs.push({arm,leg,side});
 }
 box(root,.43,.48,.2,0,1.05,-.29,mat(isPlayer?"#1e3659":"#29364b"),true);box(root,.28,.12,.22,0,1.2,-.4,accent,false);
 animated.push({type:"character",root,torsoPivot,limbs,phase:variant*.71,isPlayer});return root;
}
function makeGamingPC(parent,x,y,z,tier=1){
 const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);box(g,.36,.56,.34,0,.28,0,mat("#182331",.32,.35),true);
 const glow=mat(["#27c8ff","#7c69ff","#35f0c0","#ffbf45"][Math.min(3,tier-1)],.3,.1,{emissive:["#0877a8","#3820a1","#087b55","#9c5700"][Math.min(3,tier-1)],emissiveIntensity:1.1});
 box(g,.012,.42,.27,.187,.3,0,mat("#24394e",.2,.15,{transparent:true,opacity:.82}),false);
 for(let i=0;i<3;i++){const fan=cylinder(g,.07,.07,.018,.198,.42-i*.14,0,glow,20);fan.rotation.z=Math.PI/2;}
 return g;
}
function makeGamingStation(x,z,index,data){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 const c=data.components||{},tier=Math.min(4,...Object.values(c).map(Number).filter(Boolean));
 const trim=mat(["#ffcc4d","#3dcfff","#45e0a2","#bd85ff"][tier-1],.32,.35,{emissive:["#5a3600","#004d75","#07543c","#3d176a"][tier-1],emissiveIntensity:.3});
 box(g,2.1,.15,.92,0,.78,0,mat("#27374b",.36,.28));box(g,2.12,.045,.94,0,.87,0,trim,false);
 for(const sx of [-.9,.9])box(g,.12,.76,.13,sx,.38,0,mat("#64788e",.32,.55));
 box(g,.88,.56,.11,0,1.28,-.36,mat("#111b2b",.22,.35));
 const tex=canvasTexture((ctx,w,h)=>{const gr=ctx.createLinearGradient(0,0,w,h);gr.addColorStop(0,"#102d56");gr.addColorStop(.5,tier>2?"#7136a8":"#087b9c");gr.addColorStop(1,"#111b35");ctx.fillStyle=gr;ctx.fillRect(0,0,w,h);ctx.fillStyle="#fff";ctx.font="bold 42px Arial";ctx.fillText("UGLY",24,78);ctx.font="bold 18px Arial";ctx.fillText("GAMING ARENA",24,112);ctx.fillStyle="#42e9ff";ctx.fillRect(22,132,w*.55,8);},256,160);
 box(g,.76,.42,.012,0,1.29,-.295,mat("#fff",.3,0,{map:tex,emissive:"#4d91c5",emissiveIntensity:.32}),false);
 box(g,.12,.17,.13,0,1.02,-.34,mat("#71849a",.3,.5));box(g,.55,.035,.22,0,.98,.18,mat("#151e2b",.35,.2));
 for(let k=0;k<5;k++)box(g,.065,.012,.13,-.22+k*.11,1.002,.18,trim,false);
 box(g,.38,.045,.22,-.59,1.01,.17,mat("#172332",.35,.2));makeGamingPC(g,.78,.24,.12,tier);
 const chair=new THREE.Group();chair.position.set(0,0,1.05);g.add(chair);cylinder(chair,.065,.075,.48,0,.28,0,mat("#71849a",.25,.6),14);cylinder(chair,.42,.42,.1,0,.07,0,mat("#182332",.35,.2),24);
 box(chair,.65,.65,.17,0,.72,.12,mat("#202d42",.42,.12));box(chair,.5,.12,.18,0,1.1,.1,trim,false);
 for(const sx of [-1,1]){box(chair,.08,.38,.48,sx*.37,.48,.02,mat("#27394e"),false);box(chair,.1,.08,.34,sx*.37,.67,.02,trim,false);}
 makeLabel(g,"PC "+String(index+1).padStart(2,"0"),0,2.15,-.4,1.3,.3);g.userData={index,tier};stationGroups.push(g);
 const keys=["gpu","cpu","ram","monitor","keyboard","mouse","chair"],names=["Видеокарта","Процессор","ОЗУ","Монитор","Клавиатура","Мышь","Кресло"];
 keys.forEach((key,k)=>interactables.push({position:new THREE.Vector3(x+((k%4)-1.5)*.3,0,z+1.15+Math.floor(k/4)*.28),name:names[k],hint:"Улучшение компонента ПК · "+names[k],action:"upgrade_component",station:index,component:key,radius:1.9}));
}
function buildStore(){
 scene=new THREE.Scene();scene.background=new THREE.Color("#101a32");scene.fog=new THREE.Fog("#101a32",27,52);camera=new THREE.PerspectiveCamera(58,1,.1,100);
 scene.add(new THREE.HemisphereLight("#c8eaff","#22233d",1.8));
 const key=new THREE.DirectionalLight("#fff0d4",2.8);key.position.set(-6,12,7);key.castShadow=true;key.shadow.mapSize.set(1536,1536);key.shadow.camera.left=-15;key.shadow.camera.right=15;key.shadow.camera.top=15;key.shadow.camera.bottom=-15;scene.add(key);
 for(const [color,intensity,pos] of [["#21cfff",70,[-5,3,-4]],["#9c4dff",65,[6,3,2]],["#ff4e9b",35,[0,3,7]]]){const l=new THREE.PointLight(color,intensity,20,2);l.position.set(...pos);scene.add(l);}
 box(scene,18,.35,18,0,-.18,0,mat("#263449",.72,.18));
 for(let x=-8;x<=8;x+=2)for(let z=-8;z<=8;z+=2)box(scene,1.96,.018,1.96,x,.008,z,mat((x+z)%4?"#293b53":"#202f45",.68,.12),false);
 box(scene,18,5,.32,0,2.35,-9,mat("#263b59"));box(scene,.32,5,18,-9,2.35,0,mat("#263b59"));box(scene,.32,5,18,9,2.35,0,mat("#263b59"));box(scene,18,.25,18,0,5,0,mat("#111a2b"));
 for(let i=0;i<7;i++){const p=box(scene,.12,3.6,.08,-7.2+i*2.4,2.25,-8.78,mat(i%2?"#1bd5ff":"#a56cff",.32,.25,{emissive:i%2?"#087a9d":"#4d1684",emissiveIntensity:.55}),false);p.rotation.z=i%2?.18:-.18;}
 box(scene,7,.95,.22,0,4.12,-8.72,mat("#121d31",.3,.3));const sign=new THREE.Mesh(new THREE.PlaneGeometry(6.5,.72),signMaterial("UGLY CYBER CLUB","PLAY • COMPETE • LEVEL UP"));sign.position.set(0,4.12,-8.57);scene.add(sign);
 for(const z of [-6,-1,4]){box(scene,17,.08,.16,0,3.45,z,mat("#20cfff",.28,.4,{emissive:"#087fa8",emissiveIntensity:.9}),false);box(scene,17,.06,.14,0,3.28,z+.12,mat("#a55cff",.28,.4,{emissive:"#4a138c",emissiveIntensity:.75}),false);}
 box(scene,3.8,1.05,.85,0,.53,7.1,mat("#17283f",.34,.3));box(scene,3.9,.08,.92,0,1.1,7.1,mat("#22d6ff",.25,.4,{emissive:"#067c9d",emissiveIntensity:.7}),false);makeLabel(scene,"RECEPTION",0,2,6.45,2.5,.4);
 for(const x of [-1.35,1.35])box(scene,.06,2.3,.12,x,1.15,8.3,mat("#21cfff",.2,.45,{emissive:"#087d9d",emissiveIntensity:.8}),false);
 const spots=[[-5.1,-3.4],[-1.8,-3.4],[1.8,-3.4],[5.1,-3.4],[-5.1,2],[-1.8,2],[1.8,2],[5.1,2]];
 for(let i=0;i<8;i++)makeGamingStation(spots[i][0],spots[i][1],i,state.clubData?.stations?.[i]||{tier:1});
 for(const x of [-7,-3,3,7]){box(scene,.13,4.5,.13,x,2.5,-5.2,mat("#71849a",.28,.65));box(scene,1.8,.07,.3,x,4.55,-5.2,mat("#f2f7ff",.2,.1,{emissive:"#cceeff",emissiveIntensity:1.2}),false);}
 for(const x of [-6,0,6])for(const z of [-6,0,6]){box(scene,1.8,.07,.38,x,4.65,z,mat("#dcecff",.2,.1,{emissive:"#8bdcff",emissiveIntensity:1}),false);const l=new THREE.PointLight("#77bfff",28,8);l.position.set(x,4.05,z);scene.add(l);}
 for(const x of [-7.8,7.8]){box(scene,.05,2.4,4.4,x,2.25,-1,mat("#12253b",.25,.25));for(let i=0;i<5;i++)box(scene,.035,.12,.55,x+(x<0?.04:-.04),1.4+i*.35,-1.8+i*.75,mat(i%2?"#21d5ff":"#b66cff",.22,.3,{emissive:i%2?"#0780a5":"#6125a0",emissiveIntensity:.9}),false);}
 player=makePerson(0,7.7,"#2877c9",true,0);makeLabel(scene,"YOU",0,2.3,7.7,1,.28);
 const shirts=["#e45d48","#43a77b","#8357b9","#e2a33b","#347db7","#d65b9a","#4d9aa0","#b1a04a"];
 for(let i=0;i<Math.min(8,3+Math.floor((state.adLevel||0)/2));i++){const home=new THREE.Vector3(-7+i*.5,0,7.1),npc=makePerson(home.x,home.z,shirts[i%shirts.length],false,i+1);clubNPCs.push({mesh:npc,phase:i*.8,station:i%Math.max(1,state.stations||4),mode:"walk",timer:6+Math.random()*8,home});}
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
    player.rotation.y += diff * Math.min(1, dt * 12);
  }
  player.position.x = clamp(player.position.x, -7.15, 7.15);
  player.position.z = clamp(player.position.z, -7.15, 7.15);
  const moving = input.length > .08;
  for (const a of animated) {
    if (a.type === "idle") a.mesh.position.y = Math.sin(performance.now() * .0017 + a.phase) * .025;
    if(a.type==="character"){const phase=performance.now()*.009+a.phase,characterMoving=a.isPlayer?moving:clubNPCs.some(n=>n.mesh===a.root&&n.mode!=="play"),stride=characterMoving?.72:.035;a.torsoPivot.position.y=1.12+(moving?Math.abs(Math.sin(phase))*.045:Math.sin(phase*.6)*.012);a.torsoPivot.rotation.z=moving?Math.sin(phase)*.035:0;a.limbs.forEach(l=>{l.leg.rotation.x=Math.sin(phase+l.side*Math.PI)*stride;l.arm.rotation.x=-Math.sin(phase+l.side*Math.PI)*stride*.72;});}
  }
  const now = performance.now();
  for (const npc of clubNPCs) {
    npc.timer -= dt;
    if (npc.mode === "walk") {
      const spots = [[-5.1,-2.2],[-1.8,-2.2],[1.8,-2.2],[5.1,-2.2],[-5.1,3.2],[-1.8,3.2],[1.8,3.2],[5.1,3.2]];
      const p = spots[npc.station % spots.length], dest = new THREE.Vector3(p[0],0,p[1]);
      npc.mesh.position.lerp(dest, Math.min(1,dt*1.15));
      if (npc.mesh.position.distanceTo(dest) < .35) { npc.mode="play"; npc.timer=120+Math.random()*180; }
    } else if (npc.mode === "play") {
      npc.mesh.position.y = Math.sin(now*.006+npc.phase)*.02;
      if (npc.timer <= 0) npc.mode="exit";
    } else {
      npc.mesh.position.lerp(npc.home,Math.min(1,dt*1.1));
      if (npc.mesh.position.distanceTo(npc.home) < .35) { npc.mesh.position.set(-7+Math.random()*2,0,7.1); npc.station=Math.floor(Math.random()*Math.max(1,state.stations||4)); npc.mode="walk"; }
    }
  }
  stationGroups.forEach((g,i)=>g.visible=i<(state.stations||4));
  updateCamera(dt);
  activeObject = findInteractable();
  $("simHint").textContent = activeObject ? activeObject.hint : "Двигайся по клубу. Подойди к игровому месту.";
  $("simAction").disabled = !activeObject || actionBusy;
  $("simAction").textContent = activeObject ? "УЛУЧШИТЬ · " + activeObject.name.toUpperCase() : "ПОДОЙДИ БЛИЖЕ";
  if (renderer) renderer.render(scene, camera);
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
  stationGroups.forEach((g,i)=>g.visible=i<(state.stations||4));
}
async function loadState() {
  try {
    const data = await api("/api/simulator/state");
    Object.assign(state, data.state || {}); updateHUD();
  } catch (error) { $("simHint").textContent = error.message; }
}
async function doAction(action,extra={}){if(actionBusy)return;actionBusy=true;$("simAction").disabled=true;try{const d=await api("/api/simulator/action",{method:"POST",body:JSON.stringify({action,...extra})});Object.assign(state,d.state||{});updateHUD();toast(d.message||"Готово");$("simHint").textContent=d.message||"Готово";}catch(e){toast(e.message,"error");}finally{actionBusy=false;$("simAction").disabled=!activeObject;}}
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
  $("simAction").addEventListener("click",()=>{if(activeObject)doAction(activeObject.action||"upgrade_station",{station:activeObject.station??activeObject.index,component:activeObject.component});});
  $("simBuyStation")?.addEventListener("click",()=>doAction("buy_station"));
  $("simAdvertise")?.addEventListener("click",()=>doAction("advertise"));
  $("simCashout")?.addEventListener("click",async()=>{try{const d=await api("/api/simulator/exchange",{method:"POST",body:JSON.stringify({currency:"gramm"})});Object.assign(state,d.state||{});updateHUD();toast("Зачислено "+d.gramm+" GRAMM на основной баланс");}catch(e){toast(e.message,"error");}});
  window.addEventListener("keydown", event => {
    if (["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.code)) {
      keys[event.code] = true; event.preventDefault();
    }
    if (event.code === "KeyE" && activeObject) doAction(activeObject.action||"upgrade_station",{station:activeObject.station??activeObject.index,component:activeObject.component});
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
