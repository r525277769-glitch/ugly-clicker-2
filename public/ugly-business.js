import * as THREE from "three";

const $ = id => document.getElementById(id);
const initData = window.Telegram?.WebApp?.initData || "";
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const state = { cash: 0, level: 1, customers: 0, xp: 0 };
let renderer, scene, camera, player, clock, ready = false, raf = 0;
let yaw = 0, moveX = 0, moveY = 0, activeObject = null, actionBusy = false;
let joyPointer = null, lookPointer = null, lookLastX = 0, joyCenter = { x: 0, y: 0 };
let joystickRadius = 48, cameraDistance = 5.8, cameraHeight = 3.2;
const interactables = [], animated = [], keys = Object.create(null);
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
function makePerson(x, z, shirt, isPlayer = false) {
  const root = new THREE.Group(); root.position.set(x, 0, z); scene.add(root);
  const skin = M.skin, clothing = mat(shirt);
  const torso = addMesh(root, new THREE.CapsuleGeometry(.27, .52, 5, 10), clothing, [0, 1.02, 0]);
  const neck = cylinder(root, .09, .1, .16, 0, 1.47, 0, skin, 12);
  const head = sphere(root, .235, 0, 1.72, 0, skin, 20, 16);
  // ears, hair, eyes and nose
  sphere(root, .07, -.225, 1.72, 0, skin, 12, 10);
  sphere(root, .07, .225, 1.72, 0, skin, 12, 10);
  sphere(root, .245, 0, 1.85, -.015, mat(isPlayer ? "#30251f" : "#392b25"), 18, 10).scale.set(1, .48, 1);
  for (const side of [-1, 1]) {
    sphere(root, .025, side * .085, 1.75, .205, mat("#211b18"), 8, 8);
    cylinder(root, .105, .13, .68, side * .39, 1.02, 0, skin, 12).rotation.z = side * -.18;
    const leg = cylinder(root, .12, .14, .64, side * .145, .36, 0, M.pants, 12);
    const foot = box(root, .22, .13, .38, side * .145, .08, -.07, M.shoe);
    if (isPlayer) {
      leg.userData.swing = side;
      animated.push({ type: "leg", mesh: leg, side });
    }
  }
  // employee apron / name badge
  if (!isPlayer) {
    box(root, .31, .42, .025, 0, .93, .276, mat("#333b35"), false);
    box(root, .13, .08, .025, 0, 1.19, .295, M.gold, false);
  }
  return root;
}
function buildStore() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#9caeb7");
  scene.fog = new THREE.Fog("#9caeb7", 19, 39);
  camera = new THREE.PerspectiveCamera(58, 1, .1, 100);
  scene.add(new THREE.HemisphereLight("#f1f4ff", "#6c6254", 1.7));
  const key = new THREE.DirectionalLight("#ffe8c8", 2.35);
  key.position.set(-7, 11, 7); key.castShadow = true;
  key.shadow.mapSize.set(1536, 1536); key.shadow.camera.left = -13; key.shadow.camera.right = 13;
  key.shadow.camera.top = 13; key.shadow.camera.bottom = -13; key.shadow.bias = -.00025;
  scene.add(key);
  const fill = new THREE.DirectionalLight("#c4dcff", .7); fill.position.set(7, 5, -5); scene.add(fill);

  // tiled floor, walls and ceiling
  const floorMat = mat("#ffffff", .9); floorMat.map = floorTexture(); floorMat.map.wrapS = floorMat.map.wrapT = THREE.RepeatWrapping;
  floorMat.map.repeat.set(4, 4);
  box(scene, 16, .28, 16, 0, -.16, 0, floorMat);
  box(scene, 16, 4.5, .24, 0, 2.08, -8, M.wall);
  box(scene, .24, 4.5, 16, -8, 2.08, 0, M.wall);
  box(scene, .24, 4.5, 16, 8, 2.08, 0, M.wall);
  box(scene, 16, .22, .24, 0, 2.08, 8, M.wall);
  box(scene, 16, .2, 16, 0, 4.45, 0, mat("#30373b"));
  // skirting and wall panels
  box(scene, 15.7, .2, .07, 0, .12, -7.84, M.wallDark);
  box(scene, .07, .2, 15.7, -7.84, .12, 0, M.wallDark);
  box(scene, .07, .2, 15.7, 7.84, .12, 0, M.wallDark);
  for (let x = -6; x <= 6; x += 2) box(scene, .025, 3.5, .02, x, 2.05, -7.86, M.wallDark, false);
  // entrance storefront glazing and aluminum frames
  box(scene, 4.8, 2.7, .07, 0, 1.52, 7.82, M.glass, false);
  for (const x of [-2.45, 0, 2.45]) box(scene, .07, 2.9, .12, x, 1.52, 7.75, M.metal);
  box(scene, 5, .09, .16, 0, 2.98, 7.75, M.metal);
  box(scene, 5, .09, .16, 0, .08, 7.75, M.metal);
  // storefront sign
  box(scene, 5.6, 1.0, .24, 0, 3.55, -7.76, M.dark);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.35, .78), signMaterial("UGLY MARKET", "FRESH • DAILY • QUALITY"));
  sign.position.set(0, 3.55, -7.62); scene.add(sign);
  // decorative wall art / shelves
  for (const x of [-6.7, 6.7]) {
    box(scene, .08, 2.2, .08, x, 1.4, -5.7, M.gold);
    box(scene, .08, 2.2, .08, x, 1.4, -3.5, M.gold);
    box(scene, .08, .08, 2.3, x, 2.48, -4.6, M.gold);
    box(scene, .08, .08, 2.3, x, .32, -4.6, M.gold);
  }
  // checkout lane, counter, scanner and display
  box(scene, 2.8, 1.05, 1.0, -4.8, .52, -2.8, M.wood);
  box(scene, 2.9, .09, 1.08, -4.8, 1.08, -2.8, M.dark);
  box(scene, .6, .08, .5, -4.0, 1.16, -2.8, M.metal);
  box(scene, .35, .32, .28, -4.0, 1.34, -2.8, M.dark);
  box(scene, .32, .045, .25, -4.0, 1.52, -2.8, mat("#6c9a9a", .2, .4));
  box(scene, .25, .25, .22, -5.6, 1.22, -2.8, mat("#d4b66b", .2, .3));
  makeLabel(scene, "CHECKOUT", -4.8, 2.15, -2.8, 2.0, .48);
  interactables.push({ position: new THREE.Vector3(-4.8, 0, -2.8), name: "Касса", hint: "КАССА · Нажми действие, чтобы обслужить покупателя", action: "checkout", radius: 2.05 });
  // checkout belt
  box(scene, 1.65, .12, .62, -4.8, .91, -2.0, M.dark);
  for (let i = 0; i < 8; i++) cylinder(scene, .045, .045, .64, -5.55 + i * .215, .91, -2.0, M.metal, 10).rotation.x = Math.PI / 2;
  // aisle shelving
  addShelf(-1.5, -2.0);
  addShelf(2.1, -2.0);
  addShelf(-1.5, 1.25);
  addShelf(2.1, 1.25);
  for (const p of [[-1.5, -2.0], [2.1, -2.0], [-1.5, 1.25], [2.1, 1.25]]) {
    interactables.push({ position: new THREE.Vector3(p[0], 0, p[1]), name: "Стеллаж", hint: "ТОВАРЫ · Нажми действие, чтобы пополнить запасы", action: "restock", radius: 2.0 });
  }
  // chilled display units
  for (let i = 0; i < 3; i++) {
    const x = 4.8 + i * .85;
    box(scene, .76, 2.6, 1.0, x, 1.3, -5.9, M.steel);
    box(scene, .68, 2.35, .06, x, 1.3, -5.36, M.glass);
    for (let s = 0; s < 4; s++) {
      box(scene, .62, .045, .8, x, .38 + s * .56, -5.78, M.steel);
      for (let n = 0; n < 3; n++) makeCan(scene, x - .2 + n * .2, .58 + s * .56, -5.34, ["#7b9caa", "#c78b43", "#78946a"][n]);
    }
  }
  makeLabel(scene, "COLD DRINKS", 5.6, 3.0, -5.15, 2.0, .42);
  // fruit display near entrance
  box(scene, 2.6, .65, .9, 4.8, .32, 3.2, M.wood);
  for (let i = 0; i < 18; i++) {
    const x = 3.75 + (i % 6) * .4, z = 2.9 + Math.floor(i / 6) * .25;
    sphere(scene, .16, x, .78, z, mat(["#b94b35", "#d4a33e", "#6f934a"][i % 3]), 12, 10);
  }
  makeLabel(scene, "FRESH FOOD", 4.8, 1.5, 3.2, 1.7, .4);
  // staff and shoppers
  const employee = makePerson(-4.8, -1.2, "#36516a");
  animated.push({ type: "idle", mesh: employee, phase: 1.2 });
  const customerA = makePerson(-3.4, -4.5, "#8a583d");
  const customerB = makePerson(5.7, 1.6, "#4c684f");
  animated.push({ type: "idle", mesh: customerA, phase: 2.1 }, { type: "idle", mesh: customerB, phase: .4 });
  // player starts near front doors, looking into shop (-Z)
  player = makePerson(0, 5.4, "#2c4a68", true);
  player.position.set(0, 0, 5.4);
  // lamps
  for (const x of [-5, 0, 5]) for (const z of [-5, 0, 5]) addCeilingLight(x, z);
  // exit arrows and floor accents
  for (let i = 0; i < 3; i++) {
    const arrow = box(scene, .22, .025, .55, -3.3 + i * .55, .012, 6.6, M.gold, false);
    arrow.rotation.y = Math.PI;
  }
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
  }
  updateCamera(dt);
  activeObject = findInteractable();
  $("simHint").textContent = activeObject ? activeObject.hint : "Двигайся джойстиком. Подойди вплотную к кассе или стеллажу.";
  $("simAction").disabled = !activeObject || actionBusy;
  $("simAction").textContent = activeObject ? "ДЕЙСТВИЕ · " + activeObject.name.toUpperCase() : "ПОДОЙДИ БЛИЖЕ";
  if (renderer) renderer.render(scene, camera);
}
function updateHUD() {
  $("simCash").textContent = "$" + Number(state.cash || 0).toLocaleString("ru-RU");
  $("simLevel").textContent = state.level || 1;
  $("simCustomers").textContent = state.customers || 0;
  $("simXpText").textContent = (Number(state.xp || 0) % 100) + " / 100 опыта";
  $("simXpFill").style.width = (Number(state.xp || 0) % 100) + "%";
}
async function loadState() {
  try {
    const data = await api("/api/simulator/state");
    Object.assign(state, data.state || {}); updateHUD();
  } catch (error) { $("simHint").textContent = error.message; }
}
async function doAction(action) {
  if (actionBusy) return;
  actionBusy = true; $("simAction").disabled = true;
  try {
    const data = await api("/api/simulator/action", { method: "POST", body: JSON.stringify({ action }) });
    Object.assign(state, data.state || {}); updateHUD();
    const message = action === "checkout" ? "Покупатель обслужен: +$25 в кассу!" : "Запасы магазина обновлены!";
    toast(message); $("simHint").textContent = message;
  } catch (error) { toast(error.message, "error"); }
  finally { actionBusy = false; $("simAction").disabled = !activeObject; }
}
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
  $("simAction").addEventListener("click", () => { if (activeObject) doAction(activeObject.action); });
  window.addEventListener("keydown", event => {
    if (["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.code)) {
      keys[event.code] = true; event.preventDefault();
    }
    if (event.code === "KeyE" && activeObject) doAction(activeObject.action);
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
    buildStore(); clock = new THREE.Clock(); bindControls(); ready = true; resize();
    await loadState();
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
