const RESALE_KEY = "uglyResaleSimulator_v1";
const RESALE_PRODUCT_PHOTOS = {
 phone:"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=82",
 sneakers:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=82",
 console:"https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=900&q=82",
 laptop:"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=82",
 headphones:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=82",
 watch:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=82",
 tablet:"https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=82",
 camera:"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=82",
 speaker:"https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=82",
 keyboard:"https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=82",
 mouse:"https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=82",
 monitor:"https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=82",
 gpu:"https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=82",
 cpu:"https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=900&q=82",
 ram:"https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=900&q=82",
 chair:"https://images.unsplash.com/photo-1589363360147-4f2d51541551?auto=format&fit=crop&w=900&q=82",
 vr:"https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&w=900&q=82",
 drone:"https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=900&q=82",
 bike:"https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=82",
 electriccar:"https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=82",
 backpack:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=82",
 jacket:"https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=900&q=82",
 sunglasses:"https://images.unsplash.com/photo-1511499767150-a48a237f0083auto=format&fit=crop&w=900&q=82",
 skate:"https://images.unsplash.com/photo-1547447134-cd3f5c716030?auto=format&fit=crop&w=900&q=82",
 coffee:"https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=900&q=82",
 printer:"https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=900&q=82",
 tv:"https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=82",
 phonecase:"https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=900&q=82",
 powerbank:"https://images.unsplash.com/photo-1609592806596-b43bada2f2f4?auto=format&fit=crop&w=900&q=82",
 router:"https://images.unsplash.com/photo-1606904825846-647eb07f5be2?auto=format&fit=crop&w=900&q=82",
 consolepad:"https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=900&q=82",
 game:"https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=900&q=82",
 microphone:"https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=900&q=82",
 webcam:"https://images.unsplash.com/photo-1587826080692-f439cd0b70da?auto=format&fit=crop&w=900&q=82",
 ssd:"https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=900&q=82",
 motherboard:"https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=82",
 psu:"https://images.unsplash.com/photo-1585218356057-dc3b2b7e9e2a?auto=format&fit=crop&w=900&q=82",
 scooter:"https://images.unsplash.com/photo-1600712242805-5f78671b24da?auto=format&fit=crop&w=900&q=82",
 tent:"https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=900&q=82"
 football:"https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=82",
 perfume:"https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=82",
 wallet:"https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=82",
 lamp:"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=82",
 vacuum:"https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=900&q=82",
 skincare:"https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=82",
 synth:"https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=900&q=82",
 guitar:"https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=900&q=82",
 boardgame:"https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=900&q=82",
 suitcase:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=82",
 luxurywatch:"https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=82",
 gamingpc:"https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=900&q=82",
 macbookpro:"https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=82",
 procamera:"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=82",
 motorcycle:"https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=82",
 luxurybag:"https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=82",
 diamond:"https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=82",
 goldchain:"https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=82",
 piano:"https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=900&q=82",
 boat:"https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=900&q=82",
 atv:"https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=82",
 projector:"https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=900&q=82",
 server:"https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=82",
 supercar:"https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=82",
};
function resalePhoto(p){return p&&RESALE_PRODUCT_PHOTOS[p.id]||"";}

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
 {id:"helmet",name:"Велошлем",emoji:"⛑️",category:"СПОРТ",buy:38,sell:79,desc:"Защитный шлем для катания",demand:66},
 {id:"luxurywatch",name:"Премиальные механические часы",emoji:"⌚",category:"ЛЮКС",buy:8500,sell:11200,desc:"Коллекционные часы высокого класса",demand:38},
 {id:"gamingpc",name:"Мощный игровой ПК",emoji:"🖥️",category:"ПРЕМИУМ-ТЕХНИКА",buy:6200,sell:8400,desc:"Топовая сборка для игр и стриминга",demand:48},
 {id:"macbookpro",name:"Профессиональный ноутбук",emoji:"💻",category:"ПРЕМИУМ-ТЕХНИКА",buy:4800,sell:6500,desc:"Флагманский ноутбук для профессионалов",demand:52},
 {id:"procamera",name:"Профессиональная кинокамера",emoji:"📸",category:"ПРОФЕССИОНАЛЬНАЯ ТЕХНИКА",buy:12500,sell:16800,desc:"Камера для коммерческих съёмок",demand:32},
 {id:"electriccar",name:"Электровелосипед премиум-класса",emoji:"🚲",category:"ТРАНСПОРТ",buy:3900,sell:5400,desc:"Мощный электровелосипед с большим запасом хода",demand:43},
 {id:"motorcycle",name:"Спортивный мотоцикл",emoji:"🏍️",category:"ТРАНСПОРТ",buy:18500,sell:24900,desc:"Спортивная модель в отличном состоянии",demand:29},
 {id:"luxurybag",name:"Дизайнерская сумка",emoji:"👜",category:"ЛЮКС",buy:7200,sell:9800,desc:"Редкая модель из премиальной коллекции",demand:34},
 {id:"diamond",name:"Бриллиантовое украшение",emoji:"💎",category:"ЮВЕЛИРНЫЕ ИЗДЕЛИЯ",buy:22000,sell:29500,desc:"Ювелирное изделие с драгоценным камнем",demand:24},
 {id:"goldchain",name:"Золотая цепь",emoji:"📿",category:"ЮВЕЛИРНЫЕ ИЗДЕЛИЯ",buy:5600,sell:7600,desc:"Золотое украшение высокой пробы",demand:36},
 {id:"piano",name:"Рояль",emoji:"🎹",category:"ХОББИ",buy:14500,sell:19800,desc:"Акустический рояль для ценителей музыки",demand:22},
 {id:"boat",name:"Моторная лодка",emoji:"🛥️",category:"ТРАНСПОРТ",buy:32000,sell:42500,desc:"Прогулочная лодка с мощным мотором",demand:18},
 {id:"atv",name:"Квадроцикл",emoji:"🏁",category:"ТРАНСПОРТ",buy:11500,sell:15700,desc:"Внедорожный квадроцикл",demand:27},
 {id:"projector",name:"Лазерный проектор 4K",emoji:"📽️",category:"ПРЕМИУМ-ТЕХНИКА",buy:6800,sell:9200,desc:"Профессиональный проектор для домашнего кинотеатра",demand:31},
 {id:"server",name:"Серверная стойка",emoji:"🗄️",category:"ПРОФЕССИОНАЛЬНАЯ ТЕХНИКА",buy:17800,sell:23800,desc:"Комплект серверного оборудования для бизнеса",demand:20},
 {id:"supercar",name:"Коллекционная модель суперкара",emoji:"🏎️",category:"КОЛЛЕКЦИОННОЕ",buy:9500,sell:13200,desc:"Редкая коллекционная модель премиум-класса",demand:25}
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
function defaultResaleState(){return {cash:5000,sold:0,revenue:0,profit:0,reputation:0,inventory:{},inventoryCosts:{},listings:[],offers:[],nextListingId:1,eventIndex:4,eventUntil:Date.now()+45000,priceIndex:{},priceUntil:Date.now()+30000,storeItems:[],storePrices:{},storeStock:{},storeUntil:Date.now()+180000};}
function loadResaleState(){
 try{
  const saved=JSON.parse(localStorage.getItem(RESALE_KEY)||"null");
  resaleState={...defaultResaleState(),...(saved||{})};
  resaleState.inventory=resaleState.inventory||{};
  resaleState.inventoryCosts=resaleState.inventoryCosts&&typeof resaleState.inventoryCosts==="object"?resaleState.inventoryCosts:{};
  RESALE_PRODUCTS.forEach(p=>{if(!Array.isArray(resaleState.inventoryCosts[p.id]))resaleState.inventoryCosts[p.id]=Array(Number(resaleState.inventory[p.id])||0).fill(p.buy);});
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
  return '<article class="resale-product-card"><div class="resale-product-visual" style="position:relative;overflow:hidden;height:112px;min-height:112px;background:#eef2f8"><img src="'+resalePhoto(p)+'" alt="'+p.name+'" loading="lazy" decoding="async" style="width:100%;height:112px;object-fit:contain;display:block;padding:7px;box-sizing:border-box" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'"><span class="resale-photo-fallback" style="display:none;position:absolute;inset:0;place-items:center;font-size:48px;background:linear-gradient(135deg,#243b5d,#17243d)">'+p.emoji+'</span><small style="position:absolute;right:7px;bottom:7px;background:#101827dd;padding:5px 8px;border-radius:8px">'+p.category+'</small></div><div class="resale-product-info"><h3>'+p.name+'</h3><p>'+p.desc+'</p><div class="resale-demand"><span>СПРОС</span><b>'+demand+'%</b><i><em style="width:'+demand+'%"></em></i></div><div class="resale-price-line"><span>Цена магазина</span><b>'+resaleMoney(buyPrice)+'</b></div><div class="resale-price-line"><span>Рыночная цена</span><b class="resale-green">'+resaleMoney(market)+'</b></div><div class="resale-price-line"><span>Осталось в магазине</span><b>'+stock+' шт.</b></div><button type="button" data-resale-buy="'+p.id+'" '+(resaleState.cash<buyPrice||stock<1?"disabled":"")+'>КУПИТЬ ТОВАР</button></div></article>';
 }).join("");
 const inventory=document.getElementById("resaleInventory");
 const owned=RESALE_PRODUCTS.filter(p=>(Number(resaleState.inventory[p.id])||0)>0);
 inventory.innerHTML=owned.length?owned.map(p=>'<div class="resale-stock-row"><div class="resale-stock-icon" style="width:64px;height:56px;overflow:hidden;border-radius:9px;flex-shrink:0"><img src="'+resalePhoto(p)+'" alt="'+p.name+'" loading="lazy" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display=\'none\'"></div><div class="resale-stock-main"><b>'+p.name+'</b><small>В наличии: '+resaleState.inventory[p.id]+' шт. · закупка '+resaleMoney(p.buy)+'</small></div><div class="resale-stock-action"><button type="button" data-resale-list="'+p.id+'" '+(resaleState.listings.length>=12?"disabled":"")+'>ВЫСТАВИТЬ НА РЫНОК</button></div></div>').join(""):'<div class="resale-empty">На складе пока пусто. Купи первый товар на рынке.</div>';
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
 if(!Array.isArray(resaleState.inventoryCosts[id]))resaleState.inventoryCosts[id]=[];resaleState.inventoryCosts[id].push(cost);
 saveResaleState();renderResale();resaleToast("Товар куплен и добавлен на склад");
}
function listResaleItem(id){
 const p=resaleProduct(id);if(!p||!(Number(resaleState.inventory[id])>0))return;
 if(resaleState.listings.length>=12){resaleToast("Можно разместить не больше 12 объявлений");return;}
 resaleState.inventory[id]-=1;
 const costList=resaleState.inventoryCosts[id]||[];const itemCost=Number(costList.shift())||p.buy;resaleState.inventoryCosts[id]=costList;
 resaleState.listings.push({lid:resaleState.nextListingId++,id,price:resaleMarketPrice(p),cost:itemCost,created:Date.now()});
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
 if(resaleState.storeUntil<Date.now())refreshResaleStore(false);
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



/* RESELLER BUSINESS EXPANSION v2 */
const RESALE_WAREHOUSE_CAPS=[30,60,100,160,250,500,800,1200,1800];
const RESALE_WAREHOUSE_PRICES=[0,2500,10000,35000,100000,250000,600000,1400000,3200000];
const RESALE_SHOP_CAPS=[5,10,18,28,42,60,85,115,150];
const RESALE_SHOP_PRICES=[0,8000,25000,70000,180000,450000,1000000,2500000,6000000];
const RESALE_SHOP_NAMES=["Палатка","Киоск","Маленький магазин","Обычный магазин","Большой магазин","Супермаркет","Торговый центр","Сеть магазинов","Империя ритейла"];
const RESALE_STAFF_TYPES={
 seller:{title:"Продавец",price:1800,wage:45,emoji:"🧑‍💼",desc:"Увеличивает поток заказов в собственном магазине."},
 manager:{title:"Управляющий",price:6500,wage:130,emoji:"📋",desc:"Повышает среднюю цену продаж и ускоряет работу магазина."},
 repairer:{title:"Мастер по ремонту",price:4200,wage:85,emoji:"🧰",desc:"Снижает стоимость ремонта неисправных товаров."}
};
function ensureResaleBusinessState(){
 if(!resaleState)return;
 resaleState.warehouseLevel=Math.max(0,Math.min(8,Number(resaleState.warehouseLevel)||0));
  resaleState.shopLevel=Math.max(0,Math.min(8,Number(resaleState.shopLevel)||0));
 resaleState.employees=resaleState.employees&&typeof resaleState.employees==="object"?resaleState.employees:{seller:0,manager:0,repairer:0};
 Object.keys(RESALE_STAFF_TYPES).forEach(k=>resaleState.employees[k]=Math.max(0,Math.min(5,Number(resaleState.employees[k])||0)));
 resaleState.couriers=Math.max(0,Math.min(10,Number(resaleState.couriers)||0));
 resaleState.ownShop=Array.isArray(resaleState.ownShop)?resaleState.ownShop:[];
 resaleState.ownShop.forEach(x=>{x.costs=Array.isArray(x.costs)?x.costs:[];x.qty=Math.max(0,Number(x.qty)||0);});
 resaleState.brokenInventory=resaleState.brokenInventory&&typeof resaleState.brokenInventory==="object"?resaleState.brokenInventory:{};
 resaleState.brokenCosts=resaleState.brokenCosts&&typeof resaleState.brokenCosts==="object"?resaleState.brokenCosts:{};
 resaleState.deliveryQueue=Array.isArray(resaleState.deliveryQueue)?resaleState.deliveryQueue:[];
 resaleState.ownShopSold=Math.max(0,Number(resaleState.ownShopSold)||0);
 resaleState.wagePaidAt=Number(resaleState.wagePaidAt)||Date.now();
}
function resaleWarehouseUsed(){
 return RESALE_PRODUCTS.reduce((n,p)=>n+(Number(resaleState.inventory[p.id])||0)+(Number(resaleState.brokenInventory[p.id])||0),0)+resaleState.ownShop.reduce((n,x)=>n+(Number(x.qty)||0),0);
}
function resaleWarehouseCapacity(){return RESALE_WAREHOUSE_CAPS[resaleState.warehouseLevel]||30;}
function resaleShopCapacity(){return RESALE_SHOP_CAPS[resaleState.shopLevel]||5;}
function resaleShopUsed(){return resaleState.ownShop.reduce((n,x)=>n+(Number(x.qty)||0),0);}
function resaleCanStore(qty){return resaleWarehouseUsed()+qty<=resaleWarehouseCapacity();}
function resaleStaffCount(){return Object.values(resaleState.employees).reduce((a,b)=>a+Number(b||0),0);}
function resalePayroll(){return Object.entries(RESALE_STAFF_TYPES).reduce((n,[k,v])=>n+Number(resaleState.employees[k]||0)*v.wage,0)+resaleState.couriers*55;}
function resaleBusinessToast(message){resaleToast(message);saveResaleState();}
function resaleInjectBusinessUI(){
 const root=document.getElementById("resaleSimulatorView");if(!root||document.getElementById("resaleBusinessExpansion"))return;
 const style=document.createElement("style");
 style.textContent=".resale-exp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.resale-exp-stat{background:#101b18;border:1px solid #315b48;border-radius:12px;padding:11px;text-align:left}.resale-exp-stat small{display:block;color:#9ab7a5;font-size:9px;letter-spacing:.7px}.resale-exp-stat b{display:block;color:#b9f5cb;font-size:17px;margin-top:6px}.resale-exp-row{display:flex;align-items:center;gap:9px;text-align:left;padding:11px 0;border-bottom:1px solid #2c4538}.resale-exp-row:last-child{border-bottom:0}.resale-exp-main{flex:1;min-width:0}.resale-exp-main b{display:block;color:#d6f6df;font-size:12px}.resale-exp-main small{display:block;color:#9ab7a5;font-size:10px;line-height:1.45;margin-top:4px}.resale-exp-row button,.resale-exp-action{font-size:10px;padding:9px 10px;margin:2px}.resale-exp-input{width:82px;max-width:82px;padding:8px;margin:3px;font-size:13px}.resale-exp-form{display:flex;gap:5px;align-items:center;flex-wrap:wrap;margin-top:7px}.resale-exp-muted{color:#9ab7a5;font-size:10px;line-height:1.5}.resale-wholesale{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-top:7px}.resale-product-card .resale-exp-input{background:#0a1110;border-color:#315b48;color:#c9f7d7}.resale-exp-tag{display:inline-block;padding:4px 7px;border-radius:7px;background:#173426;color:#b9f5cb;font-size:9px;margin:2px}";
 root.appendChild(style);
 const html='<section id="resaleBusinessExpansion" class="resale-panel" style="margin-top:14px;border-color:#315b48"><div class="resale-panel-heading"><div><span>TYCOON MANAGEMENT</span><h3>РАЗВИТИЕ ТВОЕГО БИЗНЕСА</h3></div><b>04</b></div><div id="resaleBusinessStats" class="resale-exp-grid"></div><div class="resale-exp-row"><div class="resale-exp-main"><b>🏬 Склад и расширение</b><small id="resaleWarehouseInfo"></small></div><button type="button" id="resaleWarehouseUpgrade">УЛУЧШИТЬ</button></div><div class="resale-exp-row"><div class="resale-exp-main"><b>🏪 Уровень магазина</b><small id="resaleShopInfo"></small></div><button type="button" id="resaleShopUpgrade">УЛУЧШИТЬ</button></div><div id="resaleStaffPanel"></div><div class="resale-exp-row"><div class="resale-exp-main"><b>🚚 Курьерская служба</b><small id="resaleCourierInfo"></small></div><button type="button" id="resaleHireCourier">НАНЯТЬ КУРЬЕРА</button></div><div class="resale-exp-muted" id="resalePayrollInfo" style="margin-top:10px"></div></section><section class="resale-panel" style="margin-top:14px;border-color:#315b48"><div class="resale-panel-heading"><div><span>YOUR OWN RETAIL</span><h3>СОБСТВЕННЫЙ МАГАЗИН</h3></div><b>05</b></div><p class="resale-exp-muted">Выставляй товары со склада. Покупатели оформляют заказы автоматически, курьеры доставляют их, а выручка поступает на твой баланс после доставки.</p><div id="resaleOwnShop"></div><div id="resaleDeliveryQueue"></div></section><section class="resale-panel" style="margin-top:14px;border-color:#8a6332"><div class="resale-panel-heading"><div><span>REPAIR WORKSHOP</span><h3>МАСТЕРСКАЯ · НЕИСПРАВНЫЕ ТОВАРЫ</h3></div><b>06</b></div><p class="resale-exp-muted">Покупай неисправные товары со скидкой, ремонтируй их и возвращай на склад. Мастер снижает стоимость ремонта.</p><div id="resaleBrokenStock"></div></section>';
 const rules=root.querySelector(".resale-rules");if(rules)rules.insertAdjacentHTML("beforebegin",html);else root.insertAdjacentHTML("beforeend",html);
}
function renderResaleBusiness(){
 if(!resaleState||!document.getElementById("resaleBusinessExpansion"))return;
 ensureResaleBusinessState();
 const used=resaleWarehouseUsed(),cap=resaleWarehouseCapacity(),level=resaleState.warehouseLevel,nextPrice=RESALE_WAREHOUSE_PRICES[level+1];
 const shopLevel=resaleState.shopLevel,shopPrice=RESALE_SHOP_PRICES[shopLevel+1],shopUsed=resaleShopUsed(),shopCap=resaleShopCapacity();
 const stats=document.getElementById("resaleBusinessStats");
 stats.innerHTML='<div class="resale-exp-stat"><small>СКЛАД ЗАНЯТ</small><b>'+used+' / '+cap+'</b></div><div class="resale-exp-stat"><small>ПРОДАЖИ СВОЕГО МАГАЗИНА</small><b>'+resaleState.ownShopSold+'</b></div><div class="resale-exp-stat"><small>СОТРУДНИКИ</small><b>'+resaleStaffCount()+'</b></div><div class="resale-exp-stat"><small>КУРЬЕРЫ</small><b>'+resaleState.couriers+'</b></div>';
 document.getElementById("resaleWarehouseInfo").textContent=level>=8?"Максимальная вместимость — 1 800 единиц.":"Уровень "+(level+1)+"/9 · вместимость "+cap+" единиц. Следующий уровень: "+RESALE_WAREHOUSE_CAPS[level+1]+" мест · цена $"+Number(nextPrice).toLocaleString("en-US")+".";
 const upgrade=document.getElementById("resaleWarehouseUpgrade");upgrade.disabled=level>=8||resaleState.cash<nextPrice;upgrade.textContent=level>=8?"МАКСИМУМ":"УЛУЧШИТЬ · $"+Number(nextPrice).toLocaleString("en-US");
 const shopUpgrade=document.getElementById("resaleShopUpgrade");
 if(shopUpgrade){document.getElementById("resaleShopInfo").textContent=RESALE_SHOP_NAMES[shopLevel]+" · уровень "+(shopLevel+1)+"/9 · занято "+shopUsed+"/"+shopCap+" мест. "+(shopLevel>=8?"Достигнут максимальный уровень.":"Следующий уровень: "+RESALE_SHOP_NAMES[shopLevel+1]+" · "+RESALE_SHOP_CAPS[shopLevel+1]+" мест · $"+shopPrice.toLocaleString("en-US")+".");
 shopUpgrade.disabled=shopLevel>=8||resaleState.cash<shopPrice;
 shopUpgrade.textContent=shopLevel>=8?"МАКСИМУМ":"УЛУЧШИТЬ · $"+shopPrice.toLocaleString("en-US");}
 const staff=document.getElementById("resaleStaffPanel");
 staff.innerHTML=Object.entries(RESALE_STAFF_TYPES).map(([key,v])=>'<div class="resale-exp-row"><div class="resale-exp-main"><b>'+v.emoji+' '+v.title+' · '+resaleState.employees[key]+'/5</b><small>'+v.desc+' Зарплата: $'+v.wage+' за 5 минут.</small></div><button type="button" data-resale-hire-staff="'+key+'" '+(resaleState.employees[key]>=5||resaleState.cash<v.price?"disabled":"")+'>'+(resaleState.employees[key]>=5?"МАКСИМУМ":"НАНЯТЬ · $"+v.price.toLocaleString("en-US"))+'</button></div>').join("");
 document.getElementById("resaleCourierInfo").textContent=resaleState.couriers+"/10 курьеров. Курьеры ускоряют доставку заказов собственного магазина. Найм $1 250, зарплата $55 за 5 минут.";
 document.getElementById("resaleHireCourier").disabled=resaleState.couriers>=10||resaleState.cash<1250;document.getElementById("resaleHireCourier").textContent=resaleState.couriers>=10?"МАКСИМУМ":"НАНЯТЬ · $1 250";
 document.getElementById("resalePayrollInfo").textContent="Расходы на персонал: $"+resalePayroll().toLocaleString("en-US")+" каждые 5 минут. Зарплата списывается, пока симулятор открыт.";
 const own=document.getElementById("resaleOwnShop");
 own.innerHTML=resaleState.ownShop.length?resaleState.ownShop.map((x,i)=>{const p=resaleProduct(x.id);if(!p)return "";return '<div class="resale-exp-row"><div class="resale-stock-icon">'+p.emoji+'</div><div class="resale-exp-main"><b>'+p.name+' · '+x.qty+' шт.</b><small>Цена продажи: $'+Number(x.price).toLocaleString("en-US")+' · Себестоимость партии сохраняется.</small></div><button type="button" data-resale-own-remove="'+i+'">СНЯТЬ</button></div>';}).join(""):'<div class="resale-empty">Магазин пока пуст. Перемести товары со склада в магазин через кнопку «ОТКРЫТЬ В МАГАЗИН».</div>';
 const deliveries=resaleState.deliveryQueue;
 document.getElementById("resaleDeliveryQueue").innerHTML='<div class="resale-exp-row"><div class="resale-exp-main"><b>📦 Заказы на доставке: '+deliveries.length+'</b><small>'+(deliveries.length?deliveries.map(d=>{const p=resaleProduct(d.id);return (p?p.name:"Товар")+" · "+Math.max(0,Math.ceil((d.endsAt-Date.now())/1000))+" сек.";}).join("<br>"):"Новых заказов пока нет.")+'</small></div></div>';
 const broken=document.getElementById("resaleBrokenStock");
 const damaged=RESALE_PRODUCTS.filter(p=>(Number(resaleState.brokenInventory[p.id])||0)>0);
 broken.innerHTML=damaged.length?damaged.map(p=>'<div class="resale-exp-row"><div class="resale-stock-icon">'+p.emoji+'</div><div class="resale-exp-main"><b>'+p.name+' · '+resaleState.brokenInventory[p.id]+' шт.</b><small>Стоимость ремонта за единицу: $'+Math.round(resaleMarketPrice(p)*(resaleState.employees.repairer?0.22:0.38)).toLocaleString("en-US")+'</small></div><button type="button" data-resale-repair="'+p.id+'" '+(!resaleCanStore(0)?"disabled":"")+'>ПОЧИНИТЬ</button></div>').join(""):'<div class="resale-empty">Неисправных товаров нет. Покупай их в каталоге со скидкой.</div>';
}
function resaleWholesaleBuy(id){
 const p=resaleProduct(id);if(!p)return;
 const input=document.querySelector('[data-resale-qty="'+id+'"]'),qty=Math.floor(Number(input?.value)||1),stock=Number(resaleState.storeStock[id])||0;
 if(qty<2||qty>100){resaleBusinessToast("Для оптовой закупки укажи от 2 до 100 единиц");return;}
 if(qty>stock){resaleBusinessToast("В магазине осталось только "+stock+" шт.");return;}
 if(!resaleCanStore(qty)){resaleBusinessToast("На складе недостаточно места. Расширь склад.");return;}
 const unit=resaleStorePrice(p),discount=qty>=20?.15:qty>=10?.10:qty>=5?.05:0,total=Math.round(unit*qty*(1-discount));
 if(resaleState.cash<total){resaleBusinessToast("Не хватает денег на оптовую закупку: нужно $"+total.toLocaleString("en-US"));return;}
 resaleState.cash-=total;resaleState.storeStock[id]=stock-qty;resaleState.inventory[id]=(Number(resaleState.inventory[id])||0)+qty;
 if(!Array.isArray(resaleState.inventoryCosts[id]))resaleState.inventoryCosts[id]=[];
 const each=total/qty;for(let i=0;i<qty;i++)resaleState.inventoryCosts[id].push(each);
 saveResaleState();renderResale();resaleToast("Оптовая партия куплена со скидкой "+Math.round(discount*100)+"%!");
}
function resaleBuyBroken(id){
 const p=resaleProduct(id);if(!p)return;
 const stock=Number(resaleState.storeStock[id])||0;if(stock<1){resaleToast("Товар закончился");return;}
 if(!resaleCanStore(1)){resaleToast("Склад заполнен — расширь его");return;}
 const price=Math.max(1,Math.round(resaleStorePrice(p)*.38));
 if(resaleState.cash<price){resaleToast("Не хватает денег на неисправный товар");return;}
 resaleState.cash-=price;resaleState.storeStock[id]=stock-1;resaleState.brokenInventory[id]=(Number(resaleState.brokenInventory[id])||0)+1;
 if(!Array.isArray(resaleState.brokenCosts[id]))resaleState.brokenCosts[id]=[];
 resaleState.brokenCosts[id].push(price);saveResaleState();renderResale();resaleToast("Неисправный товар куплен со скидкой. Его можно починить в мастерской.");
}
function resaleRepairItem(id){
 const p=resaleProduct(id);if(!p||!(Number(resaleState.brokenInventory[id])>0))return;
 if(!resaleCanStore(0)){resaleToast("На складе нет места для отремонтированного товара");return;}
 const fee=Math.max(1,Math.round(resaleMarketPrice(p)*(resaleState.employees.repairer?0.22:0.38)));
 if(resaleState.cash<fee){resaleToast("Для ремонта нужно $"+fee.toLocaleString("en-US"));return;}
 resaleState.cash-=fee;resaleState.brokenInventory[id]--;
 const costs=resaleState.brokenCosts[id]||[],purchase=Number(costs.shift())||Math.round(p.buy*.38);resaleState.brokenCosts[id]=costs;
 resaleState.inventory[id]=(Number(resaleState.inventory[id])||0)+1;
 if(!Array.isArray(resaleState.inventoryCosts[id]))resaleState.inventoryCosts[id]=[];
 resaleState.inventoryCosts[id].push(purchase+fee);
 saveResaleState();renderResale();resaleToast("Ремонт завершён! Товар возвращён на склад.");
}
function resaleMoveToOwnShop(id){
 const p=resaleProduct(id);if(!p||!(Number(resaleState.inventory[id])>0))return;
 const qtyInput=document.querySelector('[data-resale-own-qty="'+id+'"]'),priceInput=document.querySelector('[data-resale-own-price="'+id+'"]');
 const qty=Math.max(1,Math.min(Number(resaleState.inventory[id]),Math.floor(Number(qtyInput?.value)||1)));
 const price=Math.floor(Number(priceInput?.value)||resaleMarketPrice(p));
 if(price<1||price>10000000){resaleToast("Укажи цену от $1 до $10 000 000");return;}
  if(resaleShopUsed()+qty>resaleShopCapacity()){resaleToast("В магазине нет места. Повышай уровень магазина!");return;}
 let entry=resaleState.ownShop.find(x=>x.id===id);if(!entry){entry={id,qty:0,price,costs:[]};resaleState.ownShop.push(entry);}
 const costs=resaleState.inventoryCosts[id]||[];
 for(let i=0;i<qty;i++)entry.costs.push(Number(costs.shift())||p.buy);
 resaleState.inventoryCosts[id]=costs;resaleState.inventory[id]-=qty;entry.qty+=qty;entry.price=price;
 saveResaleState();renderResale();resaleToast("Товар выставлен в твоём магазине!");
}
function resaleRemoveOwnShop(index){
 const entry=resaleState.ownShop[index];if(!entry)return;
 const qty=Number(entry.qty)||0;
 resaleState.inventory[entry.id]=(Number(resaleState.inventory[entry.id])||0)+qty;
 if(!Array.isArray(resaleState.inventoryCosts[entry.id]))resaleState.inventoryCosts[entry.id]=[];
 resaleState.inventoryCosts[entry.id].push(...entry.costs);
 resaleState.ownShop.splice(index,1);saveResaleState();renderResale();resaleToast("Товары возвращены на склад.");
}
function resaleOwnShopBuyer(){
 const stock=resaleState.ownShop.filter(x=>x.qty>0);if(!stock.length||resaleState.deliveryQueue.length>=12)return;
 const entry=stock[Math.floor(Math.random()*stock.length)],p=resaleProduct(entry.id);if(!p)return;
 const managerBoost=1+Math.min(.12,resaleState.employees.manager*.025);
 const willingness=resaleMarketPrice(p)*(.78+resaleDemand(p)/400)*managerBoost;
 const shopDemandBoost=1+resaleState.shopLevel*.035;
  if(entry.price>willingness*shopDemandBoost*1.25&&Math.random()<.7)return;
 const price=Math.max(1,Math.min(Number(entry.price),Math.round(willingness)));
 const delay=Math.max(8,(resaleState.couriers?35-resaleState.couriers*3:75)-resaleState.shopLevel*2);
 const order={oid:Date.now()+Math.floor(Math.random()*9999),id:entry.id,price,cost:Number(entry.costs.shift())||p.buy,endsAt:Date.now()+delay*1000};
 entry.qty--;resaleState.deliveryQueue.push(order);resaleState.ownShop=resaleState.ownShop.filter(x=>x.qty>0);
 saveResaleState();renderResale();
}
function resaleProcessDeliveries(){
 const now=Date.now(),done=resaleState.deliveryQueue.filter(x=>Number(x.endsAt)<=now);
 if(!done.length)return;
 done.forEach(order=>{resaleState.cash+=Number(order.price);resaleState.revenue+=Number(order.price);resaleState.profit+=Number(order.price)-Number(order.cost);resaleState.sold++;resaleState.ownShopSold++;resaleState.reputation=Math.min(100,resaleState.reputation+1);});
 resaleState.deliveryQueue=resaleState.deliveryQueue.filter(x=>Number(x.endsAt)>now);
 saveResaleState();renderResale();resaleToast("Доставка завершена! Получено "+done.length+" заказ(ов).");
}
function resalePayWages(){
 const now=Date.now();if(now-resaleState.wagePaidAt<300000)return;
 const periods=Math.floor((now-resaleState.wagePaidAt)/300000),wage=resalePayroll()*periods;
 resaleState.wagePaidAt+=periods*300000;
 if(wage>0){if(resaleState.cash>=wage){resaleState.cash-=wage;resaleToast("Выплачена зарплата персоналу: $"+wage.toLocaleString("en-US"));}else{resaleState.employees={seller:0,manager:0,repairer:0};resaleState.couriers=0;resaleToast("Не хватило денег на зарплату. Персонал уволился.");}}
 saveResaleState();renderResale();
}
function resaleRenderBusinessAugment(){
 if(!resaleState)return;
 ensureResaleBusinessState();
 document.querySelectorAll("#resaleCatalog .resale-product-card").forEach(card=>{
  const buy=card.querySelector("[data-resale-buy]");if(!buy||card.querySelector("[data-resale-qty]"))return;
  const id=buy.getAttribute("data-resale-buy");
  const area=document.createElement("div");area.className="resale-wholesale";
  area.innerHTML='<input class="resale-exp-input" type="number" min="2" max="100" value="5" inputmode="numeric" aria-label="Количество для оптовой закупки" data-resale-qty="'+id+'"><button type="button" data-resale-wholesale="'+id+'">ОПТ · ДО −15%</button><button type="button" class="button-secondary" data-resale-broken="'+id+'">НЕИСПРАВНЫЙ · −62%</button>';
  buy.parentNode.appendChild(area);
 });
 document.querySelectorAll("#resaleInventory .resale-stock-row").forEach(row=>{
  const list=row.querySelector("[data-resale-list]");if(!list||row.querySelector("[data-resale-own-qty]"))return;
  const id=list.getAttribute("data-resale-list"),p=resaleProduct(id);if(!p)return;
  const area=document.createElement("div");area.className="resale-exp-form";
  area.innerHTML='<input class="resale-exp-input" type="number" min="1" value="1" inputmode="numeric" aria-label="Количество" data-resale-own-qty="'+id+'"><input class="resale-exp-input" type="number" min="1" value="'+resaleMarketPrice(p)+'" inputmode="numeric" aria-label="Цена магазина" data-resale-own-price="'+id+'"><button type="button" data-resale-own-add="'+id+'">ОТКРЫТЬ В МАГАЗИН</button>';
  row.appendChild(area);
 });
 renderResaleBusiness();
}
const resaleBaseRenderV2=renderResale;
renderResale=function(){resaleBaseRenderV2();resaleRenderBusinessAugment();};
const resaleBaseInitV2=window.initResaleSimulator;
window.initResaleSimulator=function(){
 resaleInjectBusinessUI();
 if(resaleState)ensureResaleBusinessState();
 resaleBaseInitV2();
 ensureResaleBusinessState();renderResale();
 if(window.resaleBusinessTimer)clearInterval(window.resaleBusinessTimer);
 window.resaleBusinessTimer=setInterval(()=>{
  const view=document.getElementById("resaleSimulatorView");
  if(!view||view.hidden||!resaleState)return;
  ensureResaleBusinessState();resaleProcessDeliveries();resalePayWages();
  if(Math.random()<Math.min(.8,.22+resaleState.employees.seller*.09+resaleState.employees.manager*.06))resaleOwnShopBuyer();
  renderResale();
 },5000);
};
document.addEventListener("click",event=>{
 const wholesale=event.target.closest("[data-resale-wholesale]");if(wholesale){resaleWholesaleBuy(wholesale.dataset.resaleWholesale);return;}
 const broken=event.target.closest("[data-resale-broken]");if(broken){resaleBuyBroken(broken.dataset.resaleBroken);return;}
 const repair=event.target.closest("[data-resale-repair]");if(repair){resaleRepairItem(repair.dataset.resaleRepair);return;}
 const own=event.target.closest("[data-resale-own-add]");if(own){resaleMoveToOwnShop(own.dataset.resaleOwnAdd);return;}
 const remove=event.target.closest("[data-resale-own-remove]");if(remove){resaleRemoveOwnShop(Number(remove.dataset.resaleOwnRemove));return;}
 const hire=event.target.closest("[data-resale-hire-staff]");if(hire){const key=hire.dataset.resaleHireStaff,v=RESALE_STAFF_TYPES[key];if(!v)return;if(resaleState.employees[key]>=5||resaleState.cash<v.price){resaleToast("Недостаточно средств или достигнут лимит сотрудников");return;}resaleState.cash-=v.price;resaleState.employees[key]++;saveResaleState();renderResale();resaleToast(v.title+" нанят!");return;}
 if(event.target.closest("#resaleWarehouseUpgrade")){const level=resaleState.warehouseLevel,price=RESALE_WAREHOUSE_PRICES[level+1];if(level>=8||resaleState.cash<price){resaleToast("Недостаточно денег или склад уже максимального уровня");return;}resaleState.cash-=price;resaleState.warehouseLevel++;saveResaleState();renderResale();resaleToast("Склад расширен до "+resaleWarehouseCapacity()+" мест!");return;}
  if(event.target.closest("#resaleShopUpgrade")){const level=resaleState.shopLevel,price=RESALE_SHOP_PRICES[level+1];if(level>=8||resaleState.cash<price){resaleToast("Недостаточно денег или магазин уже максимального уровня");return;}resaleState.cash-=price;resaleState.shopLevel++;saveResaleState();renderResale();resaleToast("Магазин улучшен: "+RESALE_SHOP_NAMES[level+1]+"!");return;}
 if(event.target.closest("#resaleHireCourier")){if(resaleState.couriers>=10||resaleState.cash<1250){resaleToast("Недостаточно средств или достигнут лимит курьеров");return;}resaleState.cash-=1250;resaleState.couriers++;saveResaleState();renderResale();resaleToast("Новый курьер нанят!");}
});

