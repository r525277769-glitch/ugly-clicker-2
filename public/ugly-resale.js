const RESALE_KEY = "uglyResaleSimulator_v1";
const RESALE_PRODUCTS = [
 {id:"phone",name:"Смартфон",emoji:"📱",category:"ЭЛЕКТРОНИКА",buy:420,sell:620,desc:"Популярная модель, высокий спрос",demand:78},
 {id:"sneakers",name:"Кроссовки",emoji:"👟",category:"ОДЕЖДА",buy:180,sell:290,desc:"Уличная классика на каждый день",demand:86},
 {id:"console",name:"Игровая приставка",emoji:"🎮",category:"ИГРЫ",buy:950,sell:1290,desc:"Игровая консоль с хорошей маржой",demand:72},
 {id:"laptop",name:"Ноутбук",emoji:"💻",category:"ЭЛЕКТРОНИКА",buy:1250,sell:1690,desc:"Для работы, учёбы и игр",demand:64},
 {id:"headphones",name:"Наушники",emoji:"🎧",category:"АКСЕССУАРЫ",buy:95,sell:165,desc:"Компактный товар с быстрым оборотом",demand:91},
 {id:"watch",name:"Смарт-часы",emoji:"⌚",category:"АКСЕССУАРЫ",buy:260,sell:390,desc:"Умный аксессуар с хорошим спросом",demand:69},
 {id:"tablet",name:"Планшет",emoji:"📲",category:"ЭЛЕКТРОНИКА",buy:540,sell:760,desc:"Устройство для работы и развлечений",demand:68},
 {id:"camera",name:"Фотоаппарат",emoji:"📷",category:"ЭЛЕКТРОНИКА",buy:680,sell:940,desc:"Камера для любителей фотографии",demand:57},
 {id:"speaker",name:"Bluetooth-колонка",emoji:"🔊",category:"АКСЕССУАРЫ",buy:120,sell:210,desc:"Портативный звук для дома и улицы",demand:82},
 {id:"keyboard",name:"Игровая клавиатура",emoji:"⌨️",category:"АКСЕССУАРЫ",buy:145,sell:230,desc:"Механическая клавиатура с подсветкой",demand:79},
 {id:"mouse",name:"Игровая мышь",emoji:"🖱️",category:"АКСЕССУАРЫ",buy:65,sell:115,desc:"Точная мышь для геймеров",demand:88},
 {id:"monitor",name:"Игровой монитор",emoji:"🖥️",category:"ЭЛЕКТРОНИКА",buy:490,sell:690,desc:"Монитор с высокой частотой обновления",demand:63},
 {id:"gpu",name:"Видеокарта",emoji:"🎛️",category:"КОМПЛЕКТУЮЩИЕ",buy:820,sell:1120,desc:"Мощная видеокарта для игрового ПК",demand:74},
 {id:"cpu",name:"Процессор",emoji:"🧠",category:"КОМПЛЕКТУЮЩИЕ",buy:390,sell:560,desc:"Процессор для сборки компьютера",demand:61},
 {id:"ram",name:"Оперативная память",emoji:"💾",category:"КОМПЛЕКТУЮЩИЕ",buy:110,sell:175,desc:"Комплект памяти для апгрейда ПК",demand:77},
 {id:"chair",name:"Игровое кресло",emoji:"🪑",category:"ГЕЙМИНГ",buy:310,sell:450,desc:"Удобное кресло для долгих игровых сессий",demand:59},
 {id:"vr",name:"VR-шлем",emoji:"🥽",category:"ГЕЙМИНГ",buy:590,sell:850,desc:"Погружение в виртуальную реальность",demand:66},
 {id:"drone",name:"Квадрокоптер",emoji:"🚁",category:"ТЕХНИКА",buy:430,sell:620,desc:"Компактный дрон с камерой",demand:54},
 {id:"bike",name:"Велосипед",emoji:"🚲",category:"ТРАНСПОРТ",buy:270,sell:410,desc:"Городской велосипед на каждый день",demand:62},
 {id:"backpack",name:"Рюкзак",emoji:"🎒",category:"ОДЕЖДА",buy:75,sell:135,desc:"Вместительный городской рюкзак",demand:84},
 {id:"jacket",name:"Куртка",emoji:"🧥",category:"ОДЕЖДА",buy:220,sell:340,desc:"Повседневная куртка",demand:71},
 {id:"sunglasses",name:"Солнцезащитные очки",emoji:"🕶️",category:"ОДЕЖДА",buy:55,sell:105,desc:"Стильный сезонный аксессуар",demand:73},
 {id:"skate",name:"Скейтборд",emoji:"🛹",category:"СПОРТ",buy:95,sell:160,desc:"Доска для городского катания",demand:58},
 {id:"coffee",name:"Кофемашина",emoji:"☕",category:"ТЕХНИКА",buy:340,sell:490,desc:"Домашняя кофемашина",demand:52},
 {id:"printer",name:"Принтер",emoji:"🖨️",category:"ТЕХНИКА",buy:190,sell:280,desc:"Домашний принтер для документов",demand:51},
 {id:"tv",name:"Телевизор 4K",emoji:"📺",category:"ЭЛЕКТРОНИКА",buy:720,sell:990,desc:"Большой телевизор для дома",demand:67},
 {id:"phonecase",name:"Чехол для смартфона",emoji:"📱",category:"АКСЕССУАРЫ",buy:12,sell:29,desc:"Защитный чехол для телефона",demand:93},
 {id:"powerbank",name:"Повербанк",emoji:"🔋",category:"АКСЕССУАРЫ",buy:38,sell:75,desc:"Дополнительный заряд в дороге",demand:89},
 {id:"router",name:"Wi-Fi роутер",emoji:"📡",category:"ТЕХНИКА",buy:85,sell:145,desc:"Быстрый интернет для дома",demand:72},
 {id:"consolepad",name:"Геймпад",emoji:"🕹️",category:"ИГРЫ",buy:48,sell:95,desc:"Контроллер для игровых платформ",demand:83},
 {id:"game",name:"Коллекционная игра",emoji:"💿",category:"ИГРЫ",buy:25,sell:58,desc:"Популярная игра в коробочном издании",demand:76},
 {id:"microphone",name:"Студийный микрофон",emoji:"🎙️",category:"ТЕХНИКА",buy:155,sell:245,desc:"Микрофон для стримов и записи",demand:64},
 {id:"webcam",name:"Веб-камера",emoji:"📹",category:"ТЕХНИКА",buy:62,sell:115,desc:"Камера для звонков и трансляций",demand:70},
 {id:"ssd",name:"SSD-накопитель",emoji:"💽",category:"КОМПЛЕКТУЮЩИЕ",buy:72,sell:130,desc:"Быстрый накопитель для ПК",demand:81},
 {id:"motherboard",name:"Материнская плата",emoji:"🧩",category:"КОМПЛЕКТУЮЩИЕ",buy:240,sell:360,desc:"Основа для сборки компьютера",demand:56},
 {id:"psu",name:"Блок питания",emoji:"🔌",category:"КОМПЛЕКТУЮЩИЕ",buy:90,sell:155,desc:"Надёжное питание для ПК",demand:60},
 {id:"scooter",name:"Самокат",emoji:"🛴",category:"ТРАНСПОРТ",buy:135,sell:220,desc:"Лёгкий городской самокат",demand:69},
 {id:"tent",name:"Палатка",emoji:"⛺",category:"СПОРТ",buy:105,sell:175,desc:"Палатка для отдыха на природе",demand:48},
 {id:"football",name:"Футбольный мяч",emoji:"⚽",category:"СПОРТ",buy:18,sell:42,desc:"Мяч для тренировок и матчей",demand:78},
 {id:"perfume",name:"Парфюм",emoji:"🧴",category:"СТИЛЬ",buy:80,sell:145,desc:"Популярный аромат",demand:74},
 {id:"wallet",name:"Кошелёк",emoji:"👛",category:"СТИЛЬ",buy:32,sell:68,desc:"Компактный кошелёк",demand:65},
 {id:"lamp",name:"Настольная лампа",emoji:"💡",category:"ДОМ",buy:28,sell:59,desc:"Лампа для рабочего стола",demand:59},
 {id:"vacuum",name:"Робот-пылесос",emoji:"🤖",category:"ДОМ",buy:410,sell:590,desc:"Умная уборка квартиры",demand:62},
 {id:"skincare",name:"Набор косметики",emoji:"🧴",category:"СТИЛЬ",buy:45,sell:88,desc:"Набор для ежедневного ухода",demand:79},
 {id:"synth",name:"Синтезатор",emoji:"🎹",category:"ХОББИ",buy:330,sell:480,desc:"Электронный музыкальный инструмент",demand:43},
 {id:"guitar",name:"Электрогитара",emoji:"🎸",category:"ХОББИ",buy:290,sell:430,desc:"Инструмент для начинающих музыкантов",demand:52},
 {id:"boardgame",name:"Настольная игра",emoji:"🎲",category:"ХОББИ",buy:22,sell:49,desc:"Игра для вечеров с друзьями",demand:71},
 {id:"suitcase",name:"Чемодан",emoji:"🧳",category:"ПУТЕШЕСТВИЯ",buy:115,sell:195,desc:"Чемодан для поездок",demand:57},
 {id:"helmet",name:"Велошлем",emoji:"⛑️",category:"СПОРТ",buy:38,sell:79,desc:"Защитный шлем для катания",demand:66}
];
const RESALE_BUYERS=["Александр","Максим","Артём","Даниил","Марк","Егор","София","Алина","Полина","Виктория","Илья","Кирилл"];
const RESALE_EVENTS=[
 {title:"🔥 ХАЙП НА ГАДЖЕТЫ",desc:"Спрос на электронику вырос. Покупатели готовы платить больше.",category:"ЭЛЕКТРОНИКА",factor:1.18},
 {title:"👟 МОДНЫЙ ТРЕНД",desc:"Кроссовки сейчас в топе. Продажи одежды ускорились.",category:"ОДЕЖДА",factor:1.2},
 {title:"🎮 ИГРОВОЙ БУМ",desc:"Игровые товары стали популярнее. Хороший момент для продажи.",category:"ИГРЫ",factor:1.2},
 {title:"🎧 СПРОС НА АКСЕССУАРЫ",desc:"Наушники и аксессуары покупают активнее обычного.",category:"АКСЕССУАРЫ",factor:1.22},
 {title:"📉 СПОКОЙНЫЙ РЫНОК",desc:"Покупатели стали осторожнее. Снижай цену, чтобы продать быстрее.",category:"*",factor:.9}
];
const resaleMoney=n=>"$"+Math.round(Number(n)||0).toLocaleString("en-US");
let resaleState;
let resaleEventTimer=null,resaleBuyerTimer=null;
function defaultResaleState(){return {cash:5000,sold:0,revenue:0,profit:0,reputation:0,inventory:{},listings:[],offers:[],nextListingId:1,eventIndex:4,eventUntil:Date.now()+45000,priceIndex:{},priceUntil:Date.now()+30000,storeItems:[],storePrices:{},storeStock:{},storeUntil:Date.now()+180000};}
function loadResaleState(){
 try{
  const saved=JSON.parse(localStorage.getItem(RESALE_KEY)||"null");
  resaleState={...defaultResaleState(),...(saved||{})};
  resaleState.inventory=resaleState.inventory||{};
  resaleState.listings=Array.isArray(resaleState.listings)?resaleState.listings:[];
  resaleState.offers=Array.isArray(resaleState.offers)?resaleState.offers:[];
  resaleState.priceIndex=resaleState.priceIndex&&typeof resaleState.priceIndex==="object"?resaleState.priceIndex:{};
  RESALE_PRODUCTS.forEach(p=>{if(!Number.isFinite(Number(resaleState.priceIndex[p.id])))resaleState.priceIndex[p.id]=1+(Math.random()-.5)*.12;});
  if(!Number(resaleState.priceUntil))resaleState.priceUntil=Date.now()+30000;
  resaleState.storeItems=Array.isArray(resaleState.storeItems)?resaleState.storeItems:[];
  resaleState.storePrices=resaleState.storePrices&&typeof resaleState.storePrices==="object"?resaleState.storePrices:{};
  resaleState.storeStock=resaleState.storeStock&&typeof resaleState.storeStock==="object"?resaleState.storeStock:{};
  if(!resaleState.storeItems.length||!Number(resaleState.storeUntil)||resaleState.storeUntil<=Date.now())refreshResaleStore(false);
  resaleState.nextListingId=Number(resaleState.nextListingId)||1;
  resaleState.listings.forEach(item=>{if(!item.lid)item.lid=resaleState.nextListingId++;if(!item.price)item.price=resaleProduct(item.id)?.sell||100;});
 }catch(_){resaleState=defaultResaleState();}
}
function saveResaleState(){try{localStorage.setItem(RESALE_KEY,JSON.stringify(resaleState));}catch(_){}}
function resaleProduct(id){return RESALE_PRODUCTS.find(p=>p.id===id);}
function resaleDemand(p){
 const event=RESALE_EVENTS[resaleState.eventIndex]||RESALE_EVENTS[4];
 const boost=event.category==="*"||event.category===p.category?event.factor:1;
 return Math.max(15,Math.min(100,Math.round(p.demand*boost)));
}
function resalePriceIndex(p){return Math.max(.72,Math.min(1.38,Number(resaleState.priceIndex[p.id])||1));}
function resaleBuyPrice(p){return Math.max(1,Math.round(p.buy*resalePriceIndex(p)));}
function resaleMarketPrice(p){return Math.round(p.sell*resaleDemand(p)/p.demand*resalePriceIndex(p));}
function resaleStorePrice(p){return Math.max(1,Math.round(Number(resaleState.storePrices[p.id])||p.buy));}
function renderResale(){
 const cash=document.getElementById("resaleCash");if(!cash)return;
 cash.textContent=resaleMoney(resaleState.cash);
 document.getElementById("resaleSold").textContent=resaleState.sold;
 document.getElementById("resaleProfit").textContent=resaleMoney(resaleState.profit);
 document.getElementById("resaleRep").textContent=resaleState.reputation;
 const event=RESALE_EVENTS[resaleState.eventIndex]||RESALE_EVENTS[4];
 const storeTimer=document.getElementById("resaleStoreTimer");
 if(storeTimer)storeTimer.textContent="ОБНОВЛЕНИЕ МАГАЗИНА ЧЕРЕЗ "+Math.max(0,Math.ceil((resaleState.storeUntil-Date.now())/1000))+" СЕК.";
 const eventEl=document.getElementById("resaleMarketEvent");
 if(eventEl)eventEl.innerHTML='<div><b>'+event.title+'</b><span>'+event.desc+'</span></div><small>СМЕНА РЫНКА ЧЕРЕЗ '+Math.max(0,Math.ceil((resaleState.eventUntil-Date.now())/1000))+' СЕК.</small>';
 const catalog=document.getElementById("resaleCatalog");
 catalog.innerHTML=resaleState.storeItems.map(id=>resaleProduct(id)).filter(Boolean).map(p=>{
  const demand=resaleDemand(p),market=resaleMarketPrice(p),buyPrice=resaleStorePrice(p),stock=Number(resaleState.storeStock[p.id])||0;
  return '<article class="resale-product-card"><div class="resale-product-visual"><span>'+p.emoji+'</span><small>'+p.category+'</small></div><div class="resale-product-info"><h3>'+p.name+'</h3><p>'+p.desc+'</p><div class="resale-demand"><span>СПРОС</span><b>'+demand+'%</b><i><em style="width:'+demand+'%"></em></i></div><div class="resale-price-line"><span>Цена магазина</span><b>'+resaleMoney(buyPrice)+'</b></div><div class="resale-price-line"><span>Рыночная цена</span><b class="resale-green">'+resaleMoney(market)+'</b></div><div class="resale-price-line"><span>Осталось в магазине</span><b>'+stock+' шт.</b></div><button type="button" data-resale-buy="'+p.id+'" '+(resaleState.cash<buyPrice||stock<1?"disabled":"")+'>КУПИТЬ ТОВАР</button></div></article>';
 }).join("");
 const inventory=document.getElementById("resaleInventory");
 const owned=RESALE_PRODUCTS.filter(p=>(Number(resaleState.inventory[p.id])||0)>0);
 inventory.innerHTML=owned.length?owned.map(p=>'<div class="resale-stock-row"><div class="resale-stock-icon">'+p.emoji+'</div><div class="resale-stock-main"><b>'+p.name+'</b><small>В наличии: '+resaleState.inventory[p.id]+' шт. · закупка '+resaleMoney(p.buy)+'</small></div><div class="resale-stock-action"><button type="button" data-resale-list="'+p.id+'" '+(resaleState.listings.length>=12?"disabled":"")+'>ВЫСТАВИТЬ НА РЫНОК</button></div></div>').join(""):'<div class="resale-empty">На складе пока пусто. Купи первый товар на рынке.</div>';
 const listings=document.getElementById("resaleListings");
 listings.innerHTML=resaleState.listings.length?resaleState.listings.map(item=>{
  const p=resaleProduct(item.id);if(!p)return "";
  const market=resaleMarketPrice(p),price=Number(item.price)||market;
  return '<div class="resale-listing-row resale-edit-listing"><div class="resale-stock-icon">'+p.emoji+'</div><div class="resale-stock-main"><b>'+p.name+'</b><small>Закупка '+resaleMoney(item.cost)+' · рынок '+resaleMoney(market)+'</small><label class="resale-price-editor"><span>ТВОЯ ЦЕНА</span><input type="number" min="1" max="10000000" step="1" value="'+price+'" data-resale-price="'+item.lid+'" inputmode="numeric"></label></div><button type="button" data-resale-update="'+item.lid+'">СОХРАНИТЬ</button></div>';
 }).join(""):'<div class="resale-empty">Активных объявлений нет. Выстави товар со склада.</div>';
 const buyers=document.getElementById("resaleBuyers");
 buyers.innerHTML=resaleState.offers.length?resaleState.offers.map(o=>{
  const p=resaleProduct(o.id);if(!p)return "";
  return '<div class="resale-buyer-row"><div class="resale-buyer-avatar">👤</div><div class="resale-buyer-info"><b>'+o.name+' хочет купить: '+p.name+'</b><small>Предлагает '+resaleMoney(o.price)+' · твоя цена '+resaleMoney(o.ask)+'</small></div><div class="resale-buyer-actions"><button type="button" data-resale-accept="'+o.oid+'">ПРИНЯТЬ</button><button type="button" data-resale-counter="'+o.oid+'">ТОРГОВАТЬСЯ</button></div></div>';
 }).join(""):'<div class="resale-empty">Покупатели ищут товары. Опубликуй объявление — предложения появятся автоматически.</div>';
}
function buyResaleItem(id){
 const p=resaleProduct(id);if(!p)return;
 const cost=resaleStorePrice(p);
 if(!(Number(resaleState.storeStock[id])>0)){resaleToast("Этот товар закончился — дождись обновления магазина");return;}
 if(resaleState.cash<cost){resaleToast("Не хватает денег на покупку");return;}
 resaleState.cash-=cost;resaleState.storeStock[id]=Math.max(0,(Number(resaleState.storeStock[id])||0)-1);resaleState.inventory[id]=(Number(resaleState.inventory[id])||0)+1;
 saveResaleState();renderResale();resaleToast("Товар куплен и добавлен на склад");
}
function listResaleItem(id){
 const p=resaleProduct(id);if(!p||!(Number(resaleState.inventory[id])>0))return;
 if(resaleState.listings.length>=12){resaleToast("Можно разместить не больше 12 объявлений");return;}
 resaleState.inventory[id]-=1;
 resaleState.listings.push({lid:resaleState.nextListingId++,id,price:resaleMarketPrice(p),cost:p.buy,created:Date.now()});
 saveResaleState();renderResale();resaleToast("Объявление опубликовано. Ждём покупателей!");
}
function updateResalePrice(lid){
 const item=resaleState.listings.find(x=>Number(x.lid)===Number(lid));if(!item)return;
 const input=document.querySelector('[data-resale-price="'+lid+'"]');
 const price=Math.floor(Number(input?.value));
 if(!Number.isFinite(price)||price<1||price>10000000){resaleToast("Укажи корректную цену от $1 до $10 000 000");return;}
 item.price=price;saveResaleState();renderResale();resaleToast("Цена объявления обновлена");
}
function createResaleBuyer(){
 if(!resaleState.listings.length||resaleState.offers.length>=5)return;
 const listing=resaleState.listings[Math.floor(Math.random()*resaleState.listings.length)];
 const p=resaleProduct(listing.id);if(!p)return;
 const demand=resaleDemand(p),ask=Number(listing.price)||p.sell;
 const market=resaleMarketPrice(p);
 const willingness=market*(.72+demand/250);
 const offer=Math.max(1,Math.round(Math.min(ask*.98,willingness)*(0.94+Math.random()*.12)));
 const offerObj={oid:Date.now()+Math.floor(Math.random()*9999),lid:listing.lid,id:p.id,name:RESALE_BUYERS[Math.floor(Math.random()*RESALE_BUYERS.length)],price:offer,ask};
 resaleState.offers.push(offerObj);saveResaleState();renderResale();
}
function completeResaleSale(listing,price){
 const p=resaleProduct(listing.id);if(!p)return;
 const earned=Math.max(1,Math.round(price)),cost=Number(listing.cost)||p.buy;
 resaleState.cash+=earned;resaleState.revenue+=earned;resaleState.profit+=earned-cost;
 resaleState.sold+=1;resaleState.reputation=Math.min(100,resaleState.reputation+2);
 resaleState.listings=resaleState.listings.filter(x=>Number(x.lid)!==Number(listing.lid));
 resaleState.offers=resaleState.offers.filter(x=>Number(x.lid)!==Number(listing.lid));
 saveResaleState();renderResale();resaleToast("Сделка закрыта! Прибыль: "+resaleMoney(earned-cost));
}
function acceptResaleOffer(oid){
 const offer=resaleState.offers.find(x=>Number(x.oid)===Number(oid));if(!offer)return;
 const listing=resaleState.listings.find(x=>Number(x.lid)===Number(offer.lid));
 if(!listing){resaleState.offers=resaleState.offers.filter(x=>x.oid!==offer.oid);saveResaleState();renderResale();return;}
 completeResaleSale(listing,offer.price);
}
function counterResaleOffer(oid){
 const offer=resaleState.offers.find(x=>Number(x.oid)===Number(oid));if(!offer)return;
 const listing=resaleState.listings.find(x=>Number(x.lid)===Number(offer.lid));if(!listing)return;
 const p=resaleProduct(listing.id),market=resaleMarketPrice(p),ask=Number(listing.price)||p.sell;
 const chance=Math.max(.08,Math.min(.92,(market*1.12/Math.max(1,ask))));
 if(Math.random()<chance){
  completeResaleSale(listing,ask);
  resaleToast("Покупатель согласился на твою цену!");
 }else{
  resaleState.offers=resaleState.offers.filter(x=>Number(x.oid)!==Number(oid));
  saveResaleState();renderResale();resaleToast("Покупатель отказался. Попробуй снизить цену.");
 }
}
function refreshResaleStore(showToast=true){
 const pool=[...RESALE_PRODUCTS];
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 const chosen=pool.slice(0,12);
 resaleState.storeItems=chosen.map(p=>p.id);resaleState.storePrices={};resaleState.storeStock={};
 chosen.forEach(p=>{const market=resaleMarketPrice(p);const factor=.78+Math.random()*.62;resaleState.storePrices[p.id]=Math.max(1,Math.round(market*factor));resaleState.storeStock[p.id]=1+Math.floor(Math.random()*4);});
 resaleState.storeUntil=Date.now()+180000;saveResaleState();renderResale();
 if(showToast)resaleToast("Магазин обновлён! Поступили новые товары и цены.");
}
function fluctuateResalePrices(){
 RESALE_PRODUCTS.forEach(p=>{
  const current=resalePriceIndex(p);
  resaleState.priceIndex[p.id]=Math.max(.72,Math.min(1.38,current*(.93+Math.random()*.14)));
 });
 resaleState.priceUntil=Date.now()+30000;
 saveResaleState();renderResale();
}
function rotateResaleMarket(){
 let next=Math.floor(Math.random()*RESALE_EVENTS.length);
 if(next===resaleState.eventIndex)next=(next+1)%RESALE_EVENTS.length;
 resaleState.eventIndex=next;resaleState.eventUntil=Date.now()+60000;
 saveResaleState();renderResale();resaleToast("Рынок изменился: "+RESALE_EVENTS[next].title);
}
function resaleToast(message){
 const el=document.getElementById("resaleToast");if(!el)return;
 el.textContent=message;el.classList.add("show");clearTimeout(resaleToast.timer);
 resaleToast.timer=setTimeout(()=>el.classList.remove("show"),2500);
}
window.initResaleSimulator=function(){
 if(!resaleState)loadResaleState();
 if(resaleState.eventUntil<Date.now())resaleState.eventUntil=Date.now()+45000;
 if(resaleState.priceUntil<Date.now())resaleState.priceUntil=Date.now()+30000;
 if(!Number(resaleState.storeUntil)||resaleState.storeUntil<Date.now())resaleState.storeUntil=Date.now()+180000;
 renderResale();
 if(resaleEventTimer)clearInterval(resaleEventTimer);
 if(resaleBuyerTimer)clearInterval(resaleBuyerTimer);
 resaleEventTimer=setInterval(()=>{if(!document.getElementById("resaleSimulatorView")?.hidden){if(resaleState.eventUntil<=Date.now())rotateResaleMarket();else if(resaleState.storeUntil<=Date.now())refreshResaleStore(true);else if(resaleState.priceUntil<=Date.now())fluctuateResalePrices();else renderResale();}},5000);
 resaleBuyerTimer=setInterval(()=>{if(!document.getElementById("resaleSimulatorView")?.hidden)createResaleBuyer();},18000);
};
window.closeResaleSimulator=function(){
 const hub=document.getElementById("simulatorHub"),view=document.getElementById("resaleSimulatorView");
 if(!hub||!view)return;view.hidden=true;hub.hidden=false;
 if(resaleEventTimer)clearInterval(resaleEventTimer);if(resaleBuyerTimer)clearInterval(resaleBuyerTimer);
};
document.addEventListener("click",event=>{
 const buy=event.target.closest("[data-resale-buy]");if(buy){buyResaleItem(buy.dataset.resaleBuy);return;}
 const list=event.target.closest("[data-resale-list]");if(list){listResaleItem(list.dataset.resaleList);return;}
 const update=event.target.closest("[data-resale-update]");if(update){updateResalePrice(update.dataset.resaleUpdate);return;}
 const accept=event.target.closest("[data-resale-accept]");if(accept){acceptResaleOffer(accept.dataset.resaleAccept);return;}
 const counter=event.target.closest("[data-resale-counter]");if(counter)counterResaleOffer(counter.dataset.resaleCounter);
});
