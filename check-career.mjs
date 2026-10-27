import assert from 'node:assert/strict';
import {makePlan,PLANES,AIRPORTS} from './dist/catalog.js';
import {Flight} from './dist/flight.js';
import {freshProfile,purchase,completeContract,sanitizeProfile,readProfile,saveProfile,SAVE_KEY} from './dist/career.js';
import {trafficState} from './dist/traffic.js';
const plan=makePlan({from:'WAW',to:'LHR',plane:'a380',weather:'sun',difficulty:'captain'});
assert.equal(Object.keys(PLANES).length,12);assert.equal(Object.keys(AIRPORTS).length,11);
assert.throws(()=>makePlan({from:'WAW',to:'WAW'}));assert.throws(()=>makePlan({from:'WAW',to:'LAX',plane:'b738'}));assert.throws(()=>makePlan({plane:'an225',job:'passengers'}));
const p=freshProfile(),before=p.credits;assert.equal(purchase(p,'b738'),true);assert.equal(p.credits,before-PLANES.b738.price);assert.equal(purchase(p,'b738'),false);assert.throws(()=>purchase(p,'a359'));assert.throws(()=>sanitizeProfile({...p,credits:-1}));
let stored=null;const storage={getItem:key=>key===SAVE_KEY?stored:null,setItem:(key,value)=>stored=value};assert(saveProfile(storage,p));assert.deepEqual(readProfile(storage).owned,p.owned);assert.equal(readProfile({getItem(){return '{broken'}}).credits,6000);
console.log('PASS: 12 aircraft, 11 airports, route and cargo restrictions, buying, save validation');
function reachStand(f){f.action('service');assert(!f.serviceActive,'No loading away from stand');f.action('engine');assert(f.engines,'Engines can start before loading to reach the stand');f.action('assist');for(let i=0;i<4000&&f.stage==='toService';i++)f.update(.05);assert.equal(f.stage,'boarding');assert(f.canService);}
function depart(f){reachStand(f);f.action('service');for(let i=0;i<420;i++)f.update(.05);assert.equal(f.stage,'prep');f.action('tower');assert.equal(f.stage,'taxi');f.action('service');for(let i=0;i<4000&&f.stage==='taxi';i++)f.update(.05);assert.equal(f.stage,'hold','Taxi reaches holding point: '+JSON.stringify({x:f.x,z:f.z,yaw:f.yaw,stage:f.stage}));for(let i=0;i<2000&&f.stage==='hold';i++){f.action('tower');if(f.stage==='hold')f.update(.05);}assert.equal(f.stage,'lineup');f.action('service');for(let i=0;i<4000&&f.stage==='lineup';i++)f.update(.05);assert.equal(f.stage,'takeoff');}
const cargo=new Flight(makePlan({plane:'an225',job:'cargo'}));reachStand(cargo);cargo.action('service');for(let i=0;i<41;i++)cargo.update(.05);assert.equal(cargo.stage,'prep','Cargo boarding takes about two seconds');cargo.stage='unloading';Object.assign(cargo,cargo.serviceZone);cargo.action('service');for(let i=0;i<41;i++)cargo.update(.05);assert(cargo.won,'Cargo unloading takes about two seconds');console.log('PASS: cargo loading and unloading complete in two seconds at cargo stands');
const f=new Flight(plan);depart(f);f.action('flaps');f.throttle=1;
for(let i=0;i<800&&!f.airborne;i++)f.update(.05,{elev:f.velocity>f.spec.rotate?1:0});assert(f.airborne,'Takeoff');f.action('gear');f.flaps=0;const pitch=f.pitch;f.windX=0;for(let i=0;i<20;i++)f.update(.05);assert.equal(f.pitch,pitch,'Pitch holds after releasing control');
const save=f.snapshot(),restored=Flight.restore(JSON.parse(JSON.stringify(save)));assert.equal(restored.stage,f.stage);assert.equal(restored.x,f.x);assert.throws(()=>Flight.restore({...save,state:{...save.state,x:Infinity}}));
f.action('failure','left');assert(f.engineFault);const yaw=f.yaw;f.update(.05);assert(f.yaw>yaw);f.throttle=1;f.action('repair');assert(f.failed,'Engine procedure requires low power');f.throttle=.3;f.action('repair');assert(!f.failed&&f.damagedEngine&&f.handledFailures===1);f.action('failure','gear');f.velocity=110;f.action('repair');assert(f.failed);f.velocity=80;f.action('repair');assert(f.gear&&!f.failed);
console.log('PASS: boarding, taxi, clearance, takeoff, pitch hold, resume and failure procedures');
const trafficFlight=new Flight(plan);trafficFlight.airborne=true;trafficFlight.stage='approach';trafficFlight.wp=4;trafficFlight.z=trafficFlight.targetZ+4000;trafficFlight.engines=true;
const trafficSeed=[...plan.to].reduce((n,c)=>n+c.charCodeAt(0),0);trafficFlight.elapsed=(90-trafficSeed%90)%90+2;assert(trafficFlight.traffic.busy);trafficFlight.action('tower');assert(!trafficFlight.landingClearance,'Busy runway denies landing');trafficFlight.action('runway');assert.equal(trafficFlight.runwayX,-260);assert(!trafficFlight.traffic.busy);trafficFlight.action('tower');assert(trafficFlight.landingClearance,'Second runway can be cleared');assert(!trafficFlight.traffic.busy,'Clearance reserves runway');assert.equal(Flight.restore(trafficFlight.snapshot()).runwayX,-260);console.log('PASS: AI runway occupancy, denial, alternate runway, reservation and saved runway selection');
// Follow the actual mission using steering/elevator inputs, including crosswind.
const g=new Flight(plan);depart(g);g.flaps=1;g.throttle=1;
let frames=0;
for(;frames<35000&&!g.finished;frames++){
 let input={};
 if(g.stage==='takeoff')input.elev=g.velocity>g.spec.rotate?1:0;
 else if(g.airborne){
  g.gear=g.stage==='approach';g.flaps=g.stage==='approach'?2:0;if(g.stage==='approach'&&!g.landingClearance)g.action('tower');
  const target=g.stage==='approach'?{x:0,y:-12,z:g.targetZ+1000}:g.target;
  const dx=target.x-g.x,dz=target.z-g.z,dist=Math.hypot(dx,dz),desiredYaw=(g.stage==='approach'&&g.y<23?0:Math.atan2(-dx,-dz))+Math.asin(Math.min(.3,g.windX/Math.max(50,g.velocity)));
  const diff=Math.atan2(Math.sin(desiredYaw-g.yaw),Math.cos(desiredYaw-g.yaw));input.steer=Math.max(-1,Math.min(1,diff*8));
  let desiredPitch=Math.max(-.16,Math.min(.22,Math.atan2(target.y-g.y,dist)));
  if(g.stage==='approach'&&g.y<23)desiredPitch=-.022;
  input.elev=Math.max(-1,Math.min(1,(desiredPitch-g.pitch)*18));g.throttle=g.stage==='approach'?.52:.72;
 }else if(g.stage==='rollout')input.brake=true;
 else if(g.stage==='taxiin'&&!g.autotaxi)g.action('service');
 else if(g.stage==='unloading'&&!g.serviceActive)g.action('service');
 g.update(.05,input);
}
console.log({stage:g.stage,wp:g.wp,x:g.x,y:g.y,z:g.z,velocity:g.velocity,score:g.landingScore,frames,last:g.events.at(-1)});
assert(g.finished&&g.won,'Full mission should complete');assert.equal(g.wp,4);assert(g.landingScore>50);const award=completeContract(p,g);assert(award.reward>0&&award.xp>0);const credits=p.credits;assert.equal(completeContract(p,g),null);assert.equal(p.credits,credits,'Reward only once');assert(p.badges.includes('first'));assert.equal(p.current,null);
const free=new Flight({...plan,mode:'free'});free.finish(true,'Free');assert.equal(completeContract(p,free),null);
const failed=new Flight(plan);failed.stage='takeoff';failed.engines=true;failed.throttle=1;failed.cleared=true;for(let i=0;i<2200&&!failed.finished;i++)failed.update(.05);assert(failed.finished&&!failed.won,'Runway overrun');assert.equal(completeContract(p,failed),null);
console.log('PASS: full windy mission through 4 waypoints, landing, taxi-in, unloading, rewards once; free/failed flights give no reward');
