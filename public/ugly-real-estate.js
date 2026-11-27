(()=>{
"use strict";
const $=id=>document.getElementById(id);
const money=n=>"$"+Math.round(Number(n)||0).toLocaleString("ru-RU");
let state=null,loaded=false;
const initData=window.Telegram?.WebApp?.initData||"";
async function api(path,options={}){const r=await fetch(path,{...options,headers:{"Content-Type":"application/json","x-telegram-init-data":initData,...(options.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Ошибка сервера");return d;}
function toast(message,error=false){const el=$("reToast");if(!el)return;el.textContent=message;el.className="re-toast show"+(error?" error":"");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),3200);}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function render(){
 if(!state)return;
 $("reCash").textContent=money(state.cash);
 $("reAssets").textContent=state.portfolio.length;
 $("reIncome").textContent=money(state.hourlyIncome)+"/ч";
 $("reLevel").textContent="LVL "+state.companyLevel;
 $("rePortfolioCount").textContent=state.portfolio.length+" ОБЪЕКТОВ";
 $("reLastIncome").textContent=money(state.lastIncome);
 $("reCosts").textContent=money(state.hourlyCosts)+"/ч";
 $("reProfit").textContent=money(state.totalProfit);
 $("rePortfolio").innerHTML=state.portfolio.length?state.portfolio.map(p=>{const upgrade=Math.round(Number(p.purchasePrice)*(.12+Number(p.level)*.08));return `<article class="re-card"><div class="re-card-head"><span class="re-emoji">${esc(p.emoji)}</span><div><h4>${esc(p.name)}</h4><small>${esc(p.type)} · УРОВЕНЬ ${p.level}</small></div></div><div class="re-metrics"><span>Аренда: <b>${money(p.rent)}/ч</b></span><span>Содержание: <b>${money(p.cost)}/ч</b></span><span>Рыночная цена: <b>${money(p.marketValue)}</b></span><span>Доходность: <b>${money(p.rent-p.cost)}/ч</b></span></div><button onclick="realEstateAction('upgrade','${esc(p.uid)}')" ${p.level>=5||state.cash<upgrade?"disabled":""}>⬆ УЛУЧШИТЬ · ${money(upgrade)}</button><button class="danger" onclick="realEstateAction('sell','${esc(p.uid)}')">ПРОДАТЬ · ${money(Math.floor(p.marketValue*.82))}</button></article>`;}).join(""):'<p class="re-empty">Пока нет недвижимости. Выбери первый объект в каталоге.</p>';
 $("reMarket").innerHTML=state.catalog.map(p=>`<article class="re-card"><div class="re-card-head"><span class="re-emoji">${p.emoji}</span><div><h4>${esc(p.name)}</h4><small>${esc(p.type)}</small></div></div><p>${esc(p.description)}</p><div class="re-price">${money(p.price)}</div><div class="re-metrics"><span>Аренда: <b>${money(p.rent)}/ч</b></span><span>Содержание: <b>${money(p.cost)}/ч</b></span><span>Чистый доход: <b>${money(p.rent-p.cost)}/ч</b></span><span>Окупаемость: <b>${p.rent>p.cost?Math.ceil(p.price/(p.rent-p.cost)/24)+" дн.":"—"}</b></span></div><button onclick="realEstateAction('buy','${p.id}')" ${state.cash<p.price?"disabled":""}>КУПИТЬ НЕДВИЖИМОСТЬ</button></article>`).join("");
 const buildPrice=50000,officePrice=250000;
 $("reDevelopment").innerHTML=`<article class="re-card"><div class="re-card-head"><span class="re-emoji">🏗️</span><div><h4>Строительство жилого комплекса</h4><small>НОВЫЙ ОБЪЕКТ · ДОХОД 620$/Ч ЧИСТЫМИ</small></div></div><p>Покупка участка, строительство и ввод небольшого жилого комплекса в эксплуатацию.</p><div class="re-price">${money(buildPrice)}</div><button onclick="realEstateAction('build')" ${state.cash<buildPrice?"disabled":""}>ПОСТРОИТЬ КОМПЛЕКС</button></article><article class="re-card"><div class="re-card-head"><span class="re-emoji">🏢</span><div><h4>Штаб-квартира компании</h4><small>КОРПОРАТИВНОЕ РАЗВИТИЕ</small></div></div><p>Открой собственный офис управляющей компании. Он увеличивает расходы, но открывает следующий этап развития.</p><div class="re-price">${money(officePrice)}</div><button onclick="realEstateAction('office')" ${state.cash<officePrice||state.portfolio.some(p=>p.id==="company-office")?"disabled":""}>КУПИТЬ ОФИС</button></article>`;
}
async function load(){if(!initData){toast("Открой игру через Telegram",true);return;}try{state=await api("/api/real-estate/state");render();loaded=true;}catch(e){toast(e.message,true);}}
window.realEstateAction=async function(action,id){try{const d=await api("/api/real-estate/action",{method:"POST",body:JSON.stringify({action,id})});state=d.state;render();toast(d.message||"Готово!");}catch(e){toast(e.message,true);}};
window.initRealEstateSimulator=function(){if(!loaded)load();else load();};
window.closeRealEstateSimulator=function(){const v=$("realEstateSimulatorView"),h=$("simulatorHub");if(v)v.hidden=true;if(h)h.hidden=false;};
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&$("realEstateSimulatorView")&&!$("realEstateSimulatorView").hidden)load();});
window.addEventListener("focus",()=>{if($("realEstateSimulatorView")&&!$("realEstateSimulatorView").hidden)load();});
})();