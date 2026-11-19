/* Unit test skutečného aplikačního skriptu v Node VM.
 * DOM a vykreslování jsou nahrazené malou testovací atrapou. Tento test
 * neověřuje rozvržení, skutečný browser, Pointer Events ani Fullscreen API.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const nodes = new Map(), listeners = new Map();
let clock = 1000;
const context2d = new Proxy({}, {get: (target, prop) => {
  if (prop in target) return target[prop];
  if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => ({addColorStop(){}});
  return () => {};
}, set:(target,prop,value)=>{target[prop]=value;return true;}});
class Element {
  constructor(id='', tag='div', classes='') {
    this.id=id;this.tagName=tag.toUpperCase();this.value='';this.textContent='';this.dataset={};this.attrs={};
    this.parentNode=null;this.nextSibling=null;this.offsetWidth=1100;this.offsetHeight=680;this.offsetTop=0;this.offsetLeft=0;
    this.style={setProperty(){},removeProperty(){}};this.listeners={};
    const c=new Set(classes.split(/\s+/).filter(Boolean));
    this.classList={contains:k=>c.has(k),add:(...ks)=>ks.forEach(k=>c.add(k)),remove:(...ks)=>ks.forEach(k=>c.delete(k)),toggle:(k,force)=>{const on=force===undefined?!c.has(k):force;if(on)c.add(k);else c.delete(k);return on;}};
  }
  set innerHTML(value) {
    this._html=value;
    for (const match of value.matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>/g)) {
      const attrs=match[2], id=attrs.match(/\bid="([^"]+)"/)?.[1];
      if(id) nodes.set('#'+id,new Element(id,match[1],attrs.match(/class="([^"]*)"/)?.[1]||''));
      const data=attrs.match(/data-(workshop-(?:mode|scenario|action))="([^"]+)"/);
      if(data){const el=new Element('',match[1]);el.dataset[data[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=data[2];nodes.set(`[data-${data[1]}="${data[2]}"]`,el);}
    }
  }
  get innerHTML(){return this._html||'';}
  setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}
  click(){for(const fn of this.listeners.click||[])fn({target:this,preventDefault(){}});}
  focus(){document.activeElement=this;}
  scrollIntoView(){}
  closest(selector){if(selector==='button')return this.tagName==='BUTTON'?this:null;return null;}
  getContext(){return context2d;}
  getBoundingClientRect(){return {x:0,y:0,top:0,left:0,right:1100,bottom:680,width:1100,height:680};}
  appendChild(el){el.parentNode=this;}
  insertBefore(el){el.parentNode=this;}
  showModal(){this.open=true;}
  close(){this.open=false;}
  hasPointerCapture(){return false;}
  setPointerCapture(){}
  releasePointerCapture(){}
}
for(const match of html.slice(0,html.indexOf('<script>')).matchAll(/<([a-z][a-z0-9]*)\b([^>]*\bid="([^"]+)"[^>]*)>/g)) {
  nodes.set('#'+match[3],new Element(match[3],match[1],match[2].match(/class="([^"]*)"/)?.[1]||''));
}
const document={
  body:new Element('body'),documentElement:new Element('html'),fullscreenElement:null,fullscreenEnabled:false,hidden:false,
  querySelector(selector){const n=nodes.get(selector);if(!n)throw new Error('Neznámý selektor v testovací atrapě: '+selector);return n;},
  addEventListener(k,fn){(listeners.get('document:'+k)||listeners.set('document:'+k,[]).get('document:'+k)).push(fn);}
};
nodes.get('#gameFrame').parentNode=new Element('arena','section','play-area');
nodes.get('#humanCount').value='1';nodes.get('#difficultySelect').value='easy';
const sandbox={document,Element,Math,Number,String,Boolean,Object,Array,Set,Map,JSON,console,
  navigator:{maxTouchPoints:0,userAgent:'Unit test',getGamepads:()=>[]},
  performance:{now:()=>clock},innerWidth:1360,innerHeight:980,scrollY:0,
  matchMedia:()=>({matches:false}),requestAnimationFrame(){},scrollTo(){},print(){},
  addEventListener(k,fn){(listeners.get('window:'+k)||listeners.set('window:'+k,[]).get('window:'+k)).push(fn);}
};
sandbox.window=sandbox;
vm.createContext(sandbox);vm.runInContext(source,sandbox);
const run=code=>vm.runInContext(code,sandbox);
const el=id=>nodes.get('#'+id);
const click=id=>el(id).click();
function action(name){for(const fn of el('workshopContent').listeners.click)fn({target:nodes.get(`[data-workshop-action="${name}"]`)});}
function choose(kind,value){for(const fn of el('workshopContent').listeners.click)fn({target:nodes.get(`[data-workshop-${kind}="${value}"]`)});}
function tick(ms=17){clock+=ms;run(`loop(${clock})`);}
function begin(){if(run('game.phase')==='tutorial')click('skipTutorialButton');run('game.countdown=.01');tick();assert.equal(run('game.phase'),'playing');assert.equal(run('game.remaining'),90);}
async function finish(){run('game.remaining=.001');tick(35);await Promise.resolve();await Promise.resolve();assert.equal(run('started'),false);}
const checks=[];
async function main(){
  assert.equal(run('experience'),'workshop');assert.equal(run('workshopState.stage'),'setup');
  assert.equal(el('gameLayout').classList.contains('hidden'),true);
  assert.equal(run('WORKSHOP_SCENARIOS.length'),3);
  checks.push('Výchozí dílna má tři scénáře a skrytou arénu');
  run('startFromControl()');assert.equal(run('started'),false);
  checks.push('Start starým ovládáním nemůže přeskočit zadání');

  action('briefing');action('round');begin();
  assert.equal(run('game.players.filter(p=>p.human).length'),1);
  const x=run('game.players[0].x');run("keys.add('ArrowRight')");for(let i=0;i<15;i++)tick();run('keys.clear()');
  assert.ok(run('game.players[0].x')>x);
  checks.push('První kolo běží 90 sekund s jedním člověkem a původní pohybovou fyzikou');
  run("keys.add('Space')");for(let i=0;i<42;i++)tick();run('keys.clear()');tick();
  assert.ok(run('game.players[0].charges')>=1);
  checks.push('Zachované nabíjení a výstřel v herní logice');

  for(const fn of listeners.get('window:blur'))fn();assert.equal(run('paused'),true);
  const remaining=run('game.remaining');for(let i=0;i<10;i++)tick();assert.equal(run('game.remaining'),remaining);
  click('resumeButton');assert.equal(run('paused'),false);
  checks.push('Obsluha blur pozastaví čas a pokračování jej obnoví');
  click('startButton');begin();assert.equal(run('workshopState.round'),1);
  checks.push('Restart opakuje aktuální kolo bez posunu průvodce');
  assert.equal(run('workshopState.results.length'),0);
  run('game.players.forEach((p,i)=>p.score=[5,5,2,0][i]);renderHUD()');
  const hud=el('scoreboard').innerHTML;
  assert.equal((hud.match(/class="player-stat\b/g)||[]).length,4);
  for(const label of JSON.parse(run('JSON.stringify(game.players.map(playerLabel))')))assert.ok(hud.includes(label));
  const ranks=JSON.parse(run('JSON.stringify(rankedPlayers(game.players).map(p=>p.rank))'));
  assert.deepEqual(ranks,[1,1,3,4]);
  assert.deepEqual(JSON.parse(run('JSON.stringify(game.players.map(p=>p.id))')),[0,1,2,3]);
  assert.deepEqual(JSON.parse(run('JSON.stringify(rankedPlayers(game.players.map(p=>({...p,score:0}))).map(p=>p.rank))')),[1,1,1,1]);
  checks.push('Živé skóre má čtyři stabilní identity; remízy mají pořadí 1,1,3,4 a 1,1,1,1 bez přeuspořádání hráčů');
  await finish();assert.equal(run('workshopState.stage'),'swap');
  assert.ok(el('workshopContent').innerHTML.includes('Teď si vyměňte role'));
  checks.push('První konec kola vede k výměně rolí');
  assert.equal(run('workshopState.results.length'),1);
  assert.equal(run('workshopState.results[0].round'),1);
  assert.deepEqual(JSON.parse(run('JSON.stringify(workshopState.results[0].players.map(p=>p.score))')),[5,5,2,0]);
  const firstResult=run('JSON.stringify(workshopState.results[0])');
  click('freePlayTab');assert.equal(el('switchDialog').open,true);click('cancelSwitch');
  assert.equal(run('experience'),'workshop');
  assert.equal(run('JSON.stringify(workshopState.results[0])'),firstResult);
  run('game.players[0].score=999;renderWorkshop(false)');
  assert.equal(run('JSON.stringify(workshopState.results[0])'),firstResult);
  assert.ok(!el('workshopContent').innerHTML.includes('999'));
  checks.push('Výsledek prvního kola je samostatná kopie; změna živých hráčů ani zrušené přepnutí jej nezmění');
  action('round2');begin();assert.equal(run('workshopState.round'),2);
  assert.equal(run('game.players.every(p=>p.score===0)'),true);
  run('game.players[0].score=8');click('startButton');begin();
  assert.equal(run('workshopState.round'),2);
  assert.equal(run('game.players.every(p=>p.score===0)'),true);
  assert.equal(run('workshopState.results.length'),1);
  assert.equal(run('JSON.stringify(workshopState.results[0])'),firstResult);
  checks.push('Druhé kolo i jeho restart začínají od nuly a zachovávají pouze hotové první kolo');
  run('game.players.forEach((p,i)=>p.score=[1,4,4,2][i]);renderHUD()');
  await finish();assert.equal(run('workshopState.stage'),'reflect');
  assert.equal(run('workshopState.results.length'),2);
  assert.equal(run('workshopState.results[1].round'),2);
  assert.deepEqual(JSON.parse(run('JSON.stringify(workshopState.results[1].players.map(p=>p.score))')),[1,4,4,2]);
  assert.equal(run('JSON.stringify(workshopState.results[0])'),firstResult);
  const bothResults=run('JSON.stringify(workshopState.results)');
  const bothMarkup=run('workshopResultsMarkup()');
  assert.ok(el('workshopContent').innerHTML.includes(bothMarkup));
  for(const q of ['Co postava chtěla?','Co se stalo?','Co by mohla udělat jinak?'])assert.ok(el('workshopContent').innerHTML.includes(q));
  action('story');assert.equal(run('workshopState.stage'),'story');
  assert.ok(el('workshopContent').innerHTML.includes(bothMarkup));
  assert.equal((el('workshopContent').innerHTML.match(/class="story-panel"/g)||[]).length,3);
  action('reflect');assert.equal(run('workshopState.stage'),'reflect');action('story');action('done');assert.equal(run('workshopState.stage'),'done');
  assert.equal(run('JSON.stringify(workshopState.results)'),bothResults);
  assert.ok(el('workshopContent').innerHTML.includes(bothMarkup));
  checks.push('Obě samostatná kola zůstávají viditelná při reflexi, tvorbě i dokončení bez sčítání hráčů');
  checks.push('Druhé kolo vede do tří otázek, tvorby tří scén a dokončení; návrat k otázkám funguje');
  for(const scenario of ['ending','mood']){
    action('new');await Promise.resolve();await Promise.resolve();choose('mode','solo');choose('scenario',scenario);
    assert.equal(run('workshopState.results.length'),0);
    action('briefing');action('round');begin();await finish();
    assert.ok(el('workshopContent').innerHTML.includes('Druhý pokus s novým plánem'));
    action('round2');begin();await finish();action('story');
    assert.ok(el('workshopContent').innerHTML.includes('Nakresli'));
    action('done');assert.equal(run('workshopState.stage'),'done');
  }
  checks.push('Sólo průchod oběma dalšími scénáři až do dokončení');
  action('free');await Promise.resolve();await Promise.resolve();assert.equal(run('experience'),'free');
  assert.equal(run('workshopState.results.length'),0);
  checks.push('Nová výzva a přepnutí na volnou hru vyčistí předchozí výsledky');
  el('difficultySelect').value='hard';click('startButton');begin();assert.equal(run('game.difficulty'),'hard');
  run("game.players.forEach((p,i)=>p.score=[5,5,2,0][i]);game.remaining=.001");tick(35);
  assert.equal(run('game.phase'),'ended');
  assert.ok(el('winnerTitle').textContent.includes('REMÍZA'));
  const freeRanking=el('resultRanking').innerHTML;
  assert.equal((freeRanking.match(/class="champion"/g)||[]).length,2);
  checks.push('Výsledková karta volné hry správně označí oba vítěze při remíze');
  click('playAgainButton');
  assert.equal(run('game.phase'),'countdown');
  tick(2000);assert.equal(run('game.phase'),'countdown');
  assert.ok(run('game.countdown')>1&&run('game.countdown')<1.2);
  tick(1200);assert.equal(run('game.phase'),'playing');assert.equal(run('game.remaining'),90);
  const simulationStart=run('game.t');tick(1000);
  assert.equal(run('game.remaining'),89);
  assert.ok(run('game.t')-simulationStart<.1,'Fyzika musí zachovat limit kroků také při 1 FPS');
  run('pauseToggle(true)');clock+=30000;click('resumeButton');tick(1000);
  assert.equal(run('game.remaining'),88,'Třicet sekund bez RAF během pauzy nesmí ubrat čas kola');
  checks.push('Návrat po 30 sekundách pauzy bez RAF neodečte pauzu z časomíry');
  for(let i=0;i<87;i++)tick(1000);
  assert.equal(run('game.phase'),'playing');assert.equal(run('game.remaining'),1);
  tick(1000);assert.equal(run('game.phase'),'ended');assert.equal(run('game.remaining'),0);
  checks.push('Při 1 FPS běží odpočet skutečným časem a zápas skončí po 90 aktivních sekundách; fyzika má původní limit kroků');
  click('playAgainButton');begin();
  click('workshopTab');assert.equal(el('switchDialog').open,true);click('cancelSwitch');assert.equal(run('experience'),'free');assert.equal(run('paused'),false);
  click('workshopTab');click('confirmSwitch');await Promise.resolve();await Promise.resolve();assert.equal(run('experience'),'workshop');assert.equal(run('started'),false);
  checks.push('Volná hra zachová obtížnost; přepnutí lze zrušit nebo potvrdit');
  document.fullscreenElement=el('gameFrame');let exited=false;document.exitFullscreen=async()=>{exited=true;document.fullscreenElement=null;};
  assert.equal(run('immersiveMode'),false);await run('exitImmersive()');assert.equal(exited,true);
  checks.push('Logika zavření zavolá exitFullscreen také bez mobilního překryvu (atrapa API)');
  const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'..','manifest.webmanifest'),'utf8'));
  assert.equal(manifest.orientation,'any');
  checks.push('Manifest nevnucuje orientaci landscape během čtení pokynů');
  const results={type:'Node VM / jednotkové testy s atrapou DOM',passed:checks.length,checks,
    limitations:['Neověřuje skutečný prohlížeč, CSS ani vstupní zařízení.','Playwright/Chromium je v prostředí blokován systémovým oprávněním socket().']};
  fs.mkdirSync(path.join(__dirname,'..','qa'),{recursive:true});
  fs.writeFileSync(path.join(__dirname,'..','qa','unit_results.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
