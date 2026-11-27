const RESALE_KEY = "uglyResaleSimulator_v1";
const RESALE_PRODUCTS = [
  {id:"phone",name:"Смартфон",emoji:"📱",category:"ЭЛЕКТРОНИКА",buy:420,sell:620,desc:"Популярная модель, высокий спрос"},
  {id:"sneakers",name:"Кроссовки",emoji:"👟",category:"ОДЕЖДА",buy:180,sell:290,desc:"Уличная классика на каждый день"},
  {id:"console",name:"Игровая приставка",emoji:"🎮",category:"ИГРЫ",buy:950,sell:1290,desc:"Игровая консоль с хорошей маржой"},
  {id:"laptop",name:"Ноутбук",emoji:"💻",category:"ЭЛЕКТРОНИКА",buy:1250,sell:1690,desc:"Для работы, учёбы и игр"},
  {id:"headphones",name:"Наушники",emoji:"🎧",category:"АКСЕССУАРЫ",buy:95,sell:165,desc:"Компактный товар с быстрым оборотом"},
  {id:"watch",name:"Смарт-часы",emoji:"⌚",category:"АКСЕССУАРЫ",buy:260,sell:390,desc:"Умный аксессуар с хорошим спросом"}
];
const resaleMoney = n => "$" + Math.round(Number(n)||0).toLocaleString("en-US");
let resaleState;
function defaultResaleState(){return {cash:5000,sold:0,revenue:0,profit:0,reputation:0,inventory:{},listings:[]};}
function loadResaleState(){
  try{
    const saved=JSON.parse(localStorage.getItem(RESALE_KEY)||"null");
    resaleState={...defaultResaleState(),...(saved||{})};
    resaleState.inventory=resaleState.inventory||{};
    resaleState.listings=Array.isArray(resaleState.listings)?resaleState.listings:[];
  }catch(_){resaleState=defaultResaleState();}
}
function saveResaleState(){try{localStorage.setItem(RESALE_KEY,JSON.stringify(resaleState));}catch(_){}}
function resaleProduct(id){return RESALE_PRODUCTS.find(p=>p.id===id);}
function renderResale(){
  const cash=document.getElementById("resaleCash");
  if(!cash)return;
  cash.textContent=resaleMoney(resaleState.cash);
  document.getElementById("resaleSold").textContent=resaleState.sold;
  document.getElementById("resaleProfit").textContent=resaleMoney(resaleState.profit);
  document.getElementById("resaleRep").textContent=resaleState.reputation;
  const catalog=document.getElementById("resaleCatalog");
  catalog.innerHTML=RESALE_PRODUCTS.map(p=>`<article class="resale-product-card">
    <div class="resale-product-visual"><span>${p.emoji}</span><small>${p.category}</small></div>
    <div class="resale-product-info"><h3>${p.name}</h3><p>${p.desc}</p>
      <div class="resale-price-line"><span>Закупка</span><b>${resaleMoney(p.buy)}</b></div>
      <div class="resale-price-line"><span>Ориентир продажи</span><b class="resale-green">${resaleMoney(p.sell)}</b></div>
      <button type="button" data-resale-buy="${p.id}" ${resaleState.cash<p.buy?"disabled":""}>КУПИТЬ ТОВАР</button>
    </div></article>`).join("");
  const inventory=document.getElementById("resaleInventory");
  const owned=RESALE_PRODUCTS.filter(p=>(Number(resaleState.inventory[p.id])||0)>0);
  inventory.innerHTML=owned.length?owned.map(p=>`<div class="resale-stock-row">
    <div class="resale-stock-icon">${p.emoji}</div><div class="resale-stock-main"><b>${p.name}</b><small>В наличии: ${resaleState.inventory[p.id]} шт. · закупка ${resaleMoney(p.buy)}</small></div>
    <div class="resale-stock-action"><button type="button" data-resale-list="${p.id}" ${resaleState.listings.length>=12?"disabled":""}>ВЫСТАВИТЬ · ${resaleMoney(p.sell)}</button></div>
  </div>`).join(""):'<div class="resale-empty">На складе пока пусто. Купи первый товар на рынке.</div>';
  const listings=document.getElementById("resaleListings");
  listings.innerHTML=resaleState.listings.length?resaleState.listings.map((item,index)=>{const p=resaleProduct(item.id);if(!p)return "";return `<div class="resale-listing-row"><div class="resale-stock-icon">${p.emoji}</div><div class="resale-stock-main"><b>${p.name}</b><small>Объявление активно · цена ${resaleMoney(item.price)}</small></div><button type="button" data-resale-sell="${index}">ПРОДАТЬ</button></div>`;}).join(""):'<div class="resale-empty">Активных объявлений нет. Выстави товар со склада.</div>';
}
function buyResaleItem(id){
  const p=resaleProduct(id);if(!p)return;
  if(resaleState.cash<p.buy){resaleToast("Не хватает денег на покупку");return;}
  resaleState.cash-=p.buy;resaleState.inventory[id]=(Number(resaleState.inventory[id])||0)+1;
  saveResaleState();renderResale();resaleToast("Товар куплен и добавлен на склад");
}
function listResaleItem(id){
  const p=resaleProduct(id);if(!p||!(Number(resaleState.inventory[id])>0))return;
  if(resaleState.listings.length>=12){resaleToast("Можно разместить не больше 12 объявлений");return;}
  resaleState.inventory[id]-=1;
  resaleState.listings.push({id,price:p.sell,cost:p.buy,created:Date.now()});
  saveResaleState();renderResale();resaleToast("Объявление опубликовано");
}
function sellResaleItem(index){
  const item=resaleState.listings[index];if(!item)return;
  const p=resaleProduct(item.id);if(!p)return;
  const earned=Number(item.price)||p.sell;
  resaleState.cash+=earned;resaleState.revenue+=earned;resaleState.profit+=earned-(Number(item.cost)||p.buy);
  resaleState.sold+=1;resaleState.reputation=Math.min(100,resaleState.reputation+2);
  resaleState.listings.splice(index,1);saveResaleState();renderResale();resaleToast("Сделка завершена! Прибыль: "+resaleMoney(earned-(Number(item.cost)||p.buy)));
}
function resaleToast(message){
  const el=document.getElementById("resaleToast");if(!el)return;
  el.textContent=message;el.classList.add("show");clearTimeout(resaleToast.timer);resaleToast.timer=setTimeout(()=>el.classList.remove("show"),2200);
}
window.initResaleSimulator=function(){if(!resaleState)loadResaleState();renderResale();};
window.closeResaleSimulator=function(){
  const hub=document.getElementById("simulatorHub"),view=document.getElementById("resaleSimulatorView");
  if(!hub||!view)return;view.hidden=true;hub.hidden=false;
};
document.addEventListener("click",event=>{
  const buy=event.target.closest("[data-resale-buy]");if(buy){buyResaleItem(buy.dataset.resaleBuy);return;}
  const list=event.target.closest("[data-resale-list]");if(list){listResaleItem(list.dataset.resaleList);return;}
  const sell=event.target.closest("[data-resale-sell]");if(sell)sellResaleItem(Number(sell.dataset.resaleSell));
});
