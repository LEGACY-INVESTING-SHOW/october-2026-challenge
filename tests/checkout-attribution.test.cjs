const {readFileSync}=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
for(const file of ['regularticket26.html','vipticket26.html']) {
 const html=readFileSync(path.resolve(__dirname,'..',file),'utf8');
 const code=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(x=>x.includes('function mountCheckout'));
 assert.ok(code);
 for(const scenario of [
  {query:'?utm_campaign=bp4-giftshoppxr-091326&utm_content=120123456789012&fbclid=click',fallback:{},ready:true,campaign:'bp4-giftshoppxr-091326'},
  {query:'',fallback:{utm_campaign:'warm-bp4-giftshoppxr-091326',utm_source:'facebook'},lateReady:true,campaign:'warm-bp4-giftshoppxr-091326'},
  {query:'?utm_campaign=unmapped',fallback:{utm_campaign:'warm-bp4-giftshoppxr-091326'},campaign:'unmapped'},
  {query:'?utm_campaign=bp4-giftshoppxr-091326',missing:true,campaign:'bp4-giftshoppxr-091326'},
  {query:'',missing:true,campaign:null},
 ]){
  const listeners={}; const timers=[]; let result;
  const status={hidden:false,classList:{add(){}}};
  const mount={getAttribute(){return 'https://legacyinvestingshow.spiffy.co/checkout/'+(file.startsWith('vip')?'tax-fre-income-challenge-vip-oct-26':'tax-free-income-challenge-oct-26')},closest(){return {querySelector(){return status}}},replaceWith(el){result=el}};
  const ctx={URLSearchParams,location:{search:scenario.query,protocol:'https:'},window:scenario.missing?{}:{__challengeAttribution:{getUtmFields(){return scenario.fallback}}},localStorage:{getItem(){return '{}'}},document:{readyState:'loading',currentScript:{previousElementSibling:mount},addEventListener(n,fn){listeners[n]=fn},createElement(){return {attrs:{},setAttribute(k,v){this.attrs[k]=v},querySelector(){return null}}}},MutationObserver:class {observe(){} disconnect(){}},setTimeout(fn){timers.push(fn);return timers.length},clearTimeout(){}};
  ctx.window.__challengeAnalytics={loaded:!!scenario.ready,enabled:!!scenario.ready};
  ctx.window.posthog={get_distinct_id(){return '019a1234-1234-7123-8123-123456789abc'}};
  if(ctx.window.__challengeAttribution)ctx.window.__challengeAttribution.getAnonymousId=()=>ctx.window.__challengeAnalytics.loaded?'019a1234-1234-7123-8123-123456789abc':null;
  ctx.window.addEventListener=(n,fn)=>{listeners[n]=fn};ctx.window.removeEventListener=()=>{};
  vm.runInNewContext(code,ctx);assert.equal(result,undefined);listeners.DOMContentLoaded();
  if(scenario.lateReady){ctx.window.__challengeAnalytics.loaded=true;listeners['challenge-analytics-ready']();}
  if (!result) timers.shift()();
  const u=new URL(result.attrs.url);assert.equal(u.searchParams.get('utm_campaign'),scenario.campaign);
  assert.equal(u.searchParams.get('ph_distinct_id'),scenario.ready||scenario.lateReady?'019a1234-1234-7123-8123-123456789abc':null);
  if(scenario.query.includes('120123')) assert.equal(u.searchParams.get('utm_content'),'120123456789012');
 }
 console.log(file+': 5 checkout attribution and fail-open scenarios passed');
}
