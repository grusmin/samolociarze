// Optional browser regression suite. Start the game with node server.cjs first.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
const base=process.env.GAME_TEST_URL||'http://127.0.0.1:4174/';
await mkdir('.openai/mobile',{recursive:true});
const errors=[];
const rects=page=>page.evaluate(()=>{
 const ids=['missionPanel','camera','radio','map','moreControls','telemetry','brake'];
 const nodes=[...ids.map(id=>document.getElementById(id)),...document.querySelectorAll('[data-key]')];
 return nodes.filter(el=>el.getClientRects().length).map(el=>{const r=el.getBoundingClientRect();return {id:el.id||el.dataset.key,x:r.x,y:r.y,w:r.width,h:r.height};});
});
function inside(r,width,height){assert(r.x>=-1&&r.y>=-1&&r.x+r.w<=width+1&&r.y+r.h<=height+1,`${r.id} outside ${width}x${height}: ${JSON.stringify(r)}`);}
function overlaps(a,b){return a.x<b.x+b.w-1&&a.x+a.w>b.x+1&&a.y<b.y+b.h-1&&a.y+a.h>b.y+1;}
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 await context.route('https://fonts.googleapis.com/**',route=>route.abort());
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base);await page.locator('#loading').waitFor({state:'hidden',timeout:60000});
 for(const [width,height] of [[320,568],[390,844],[844,390],[1024,768]]){
  await page.setViewportSize({width,height});
  await page.waitForFunction(({width,height})=>innerWidth===width&&innerHeight===height,{width,height});
  const fly=await page.locator('#freeFlight').boundingBox(),panel=await page.locator('.panel').boundingBox();
  assert(fly.y+fly.height<=panel.y,'Start button stays above the career menu, including with fallback fonts');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Menu must not scroll sideways');
  await page.screenshot({path:`.openai/mobile/menu-${width}x${height}.png`,fullPage:true});
 }
 await page.setViewportSize({width:390,height:844});
 for(const tab of ['career','hangar','log','settings']){
  await page.locator(`[data-tab="${tab}"]`).tap();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Menu must not scroll sideways');
 }
 await page.screenshot({path:'.openai/mobile/settings.png',fullPage:true});
 await page.locator('[data-tab="career"]').tap();await page.locator('#freeFlight').tap();await page.locator('#hud').waitFor({state:'visible'});
 for(const [width,height] of [[320,568],[360,640],[390,844],[430,932],[568,320],[667,375],[844,390],[932,430],[1024,768]]){
  await page.setViewportSize({width,height});
  await page.waitForFunction(({width,height})=>innerWidth===width&&innerHeight===height,{width,height});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const boxes=await rects(page);
  for(const box of boxes)inside(box,width,height);
  for(const box of boxes.filter(r=>!['missionPanel','telemetry'].includes(r.id)))assert(box.w>=43&&box.h>=43,box.id+' must be a finger-sized target: '+JSON.stringify(box));
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)assert(!overlaps(boxes[i],boxes[j]),`${width}x${height}: ${boxes[i].id} overlaps ${boxes[j].id}`);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Flight must not scroll sideways');
  await page.screenshot({path:`.openai/mobile/flight-${width}x${height}.png`});
  await page.locator('#map').tap();await page.locator('[data-close-panel="navPanel"]').tap();
  await page.locator('#moreControls').tap();await page.locator('#orbit').tap();await page.locator('[data-view="1"]').tap();
  await page.locator('#moreControls').tap();await page.locator('#failure').tap();await page.locator('[data-close-panel="failurePanel"]').tap();
  await page.locator('#camera').tap();assert(await page.locator('#telemetry').isVisible(),'Phone cockpit keeps flight instruments visible');
  await page.locator('#camera').tap();
  console.log(`PASS: touch layout, controls, panels and cockpit ${width}x${height}`);
 }
 await page.setViewportSize({width:844,height:390});
 await page.evaluate(()=>{for(const [side,value] of Object.entries({top:0,right:44,bottom:21,left:44}))document.documentElement.style.setProperty('--safe-'+side,value+'px');});
 const safeBoxes=await rects(page);for(const box of safeBoxes)inside(box,844,390);
 for(let i=0;i<safeBoxes.length;i++)for(let j=i+1;j<safeBoxes.length;j++)assert(!overlaps(safeBoxes[i],safeBoxes[j]),'Controls stay separate with a phone notch and home indicator');
 await page.screenshot({path:'.openai/mobile/safe-insets.png'});
 await page.evaluate(()=>{for(const side of ['top','right','bottom','left'])document.documentElement.style.removeProperty('--safe-'+side);});
 await page.setViewportSize({width:390,height:844});
 const client=await context.newCDPSession(page);
 const center=async selector=>{const r=await page.locator(selector).boundingBox();return {x:r.x+r.width/2,y:r.y+r.height/2};};
 const plus={id:1,...await center('[data-key="Equal"]')},up={id:2,...await center('[data-key="ArrowDown"]')};
 const touch=async(type,points)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:points});
 const initialPower=Number(await page.locator('#power').innerText());
 await touch('touchStart',[plus]);await touch('touchStart',[plus,up]);await page.waitForTimeout(700);
 assert(await page.locator('[data-key="Equal"]').evaluate(el=>el.classList.contains('pressed')));
 assert(await page.locator('[data-key="ArrowDown"]').evaluate(el=>el.classList.contains('pressed')));
 assert(Number(await page.locator('#power').innerText())>initialPower,'Real multi-touch increases engine power');
 await touch('touchEnd',[up]);assert.equal(await page.locator('[data-key="ArrowDown"]').getAttribute('aria-pressed'),'false');
 assert.equal(await page.locator('[data-key="Equal"]').getAttribute('aria-pressed'),'true','Releasing pitch preserves the other finger on power');
 await touch('touchCancel',[]);assert.equal(await page.locator('[data-key="Equal"]').getAttribute('aria-pressed'),'false');
 await page.waitForTimeout(180); // The HUD samples the simulation every 100 ms.
 const stoppedPower=await page.locator('#power').innerText();await page.waitForTimeout(400);assert.equal(await page.locator('#power').innerText(),stoppedPower,'Cancelled touch releases power');
 const brake={id:3,...await center('#brake')};await touch('touchStart',[brake]);await page.locator('#brakeIndicator').waitFor({state:'visible'});await touch('touchEnd',[]);await page.locator('#brakeIndicator').waitFor({state:'hidden'});
 const minus={id:4,...await center('[data-key="Minus"]')};await touch('touchStart',[minus]);await page.waitForTimeout(1000);await touch('touchEnd',[]);
 await page.keyboard.down('Equal');await touch('touchStart',[plus]);await touch('touchEnd',[]);const powerWithKeyboard=Number(await page.locator('#power').innerText());await page.waitForTimeout(400);assert(Number(await page.locator('#power').innerText())>powerWithKeyboard,'Releasing touch preserves a held keyboard key');await page.keyboard.up('Equal');
 await touch('touchStart',[plus]);await page.keyboard.press('Escape');assert.equal(await page.locator('[data-key="Equal"]').getAttribute('aria-pressed'),'false');await touch('touchEnd',[]);await page.locator('#resume').tap();
 await page.locator('#pause').tap();await page.locator('#returnMenu').tap();await page.locator('#start').tap();await page.locator('#hud').waitFor({state:'visible'});
 const strip=await page.locator('.flightButtons').boundingBox();
 await touch('touchStart',[{id:5,x:strip.x+strip.width-12,y:strip.y+20}]);
 for(let i=1;i<=8;i++)await touch('touchMove',[{id:5,x:strip.x+strip.width-12-i*30,y:strip.y+20}]);
 await touch('touchEnd',[]);
 await page.waitForFunction(()=>document.querySelector('.flightButtons').scrollLeft>20);
 await page.locator('#flaps').tap();assert.match(await page.locator('#flaps').innerText(),/1/);
 await page.locator('#engine').tap();assert.match(await page.locator('#engine').innerText(),/✓/);await page.locator('#groundAssist').tap();
 await page.waitForTimeout(300);await page.locator('#pause').tap();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('samolociarzeCareerV1')).current);assert(saved?.state,'Touch career controls preserve the saved flight');
 await page.locator('#returnMenu').tap();await page.locator('#resumeFlight').tap();await page.locator('#hud').waitFor({state:'visible'});
 console.log('PASS: real multi-touch holds/releases/cancel, brake, keyboard coexistence, pause, career start/save/resume');
 await context.close();
 const desktop=await browser.newPage({viewport:{width:1366,height:768}});desktop.on('pageerror',error=>errors.push(error.message));
 await desktop.goto(base);await desktop.locator('#loading').waitFor({state:'hidden',timeout:60000});await desktop.locator('#freeFlight').click();
 assert(!(await desktop.locator('#moreControls').isVisible()));assert(await desktop.locator('#orbit').isVisible());assert(await desktop.locator('#failure').isVisible());
 await desktop.locator('#camera').click();await desktop.keyboard.press('KeyM');await desktop.locator('[data-close-panel="navPanel"]').click();await desktop.keyboard.press('Escape');await desktop.locator('#resume').click();
 await desktop.screenshot({path:'.openai/mobile/desktop.png'});
 assert.deepEqual(errors,[],'No browser JavaScript errors');console.log('PASS: desktop controls, camera, map, pause and no browser errors');
}finally{await browser.close();}
