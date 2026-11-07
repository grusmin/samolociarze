import assert from 'node:assert/strict';
import {Flight} from './dist/flight.js';
import {PLANES,makePlan} from './dist/catalog.js';
import {landingSurface,groundHeight,mountainRanges,mountainHeight,smoothPath} from './dist/terrain.js';
import {wingProbe,obstacleWingContacts} from './dist/wing-contact.js';
import {REGION_ORIGIN,RIVER_PATH} from './dist/region-layout.js';
import {freshProfile,completeContract} from './dist/career.js';
import * as T from './dist/three.module.js';
import {addMountains} from './dist/mountains.js';
import {createSmoke} from './dist/smoke.js';
import {createCrashEffect} from './dist/crash-effect.js';

function flying(plane='a380',overrides={}){const f=new Flight(makePlan({mode:'free',plane,weather:'sun'}));Object.assign(f,{airborne:true,stage:'cruise',x:0,z:-3000,y:300,velocity:90,throttle:.65,pitch:.1,angleOfAttack:.03,windX:0,windZ:0,gear:false,flaps:2,...overrides});return f;}
for(const side of ['left','right']){
 const sign=side==='left'?1:-1,f=flying();f.strikeWing(side,wingProbe(f,side));assert(!f.finished&&f.airborne&&f.engines);assert(!f.strikeWing(side,wingProbe(f,side)),'A wing bursts once');assert.equal(f.wingImpacts.length,1);
 const saved=JSON.parse(JSON.stringify(f.snapshot())),restored=Flight.restore(saved);assert.deepEqual(restored.wingDamage,f.wingDamage);assert.equal(restored.wingImpacts.length,0,'No replay on resume');saved.state.wingDamage.left=!saved.state.wingDamage.left;assert.deepEqual(restored.wingDamage,f.wingDamage,'Independent save object');
 for(let i=0;i<120;i++)f.update(.025);assert(sign*f.roll>.65,'Very strong roll without correction');assert(f.y<330&&!f.finished);
 const startRoll=f.roll;for(let i=0;i<120;i++)f.update(.025,{steer:-sign});assert(Math.abs(f.roll)<Math.abs(startRoll),'Full opposite control can fight the roll');
 f.repair();assert(f.wingDamage[side],'Cannot repair a broken wing in flight');
}
for(const plane of Object.keys(PLANES)){
 const f=flying(plane,{y:25,roll:.55}),p=wingProbe(f,'left');f.y+=.2-p.y;f.update(.01);assert(f.wingDamage.left&&!f.wingDamage.right&&!f.finished&&f.airborne,plane+': actual outer-wing ground contact preserves fuselage');
 const right=flying(plane,{y:25,roll:-.55}),q=wingProbe(right,'right');right.y+=.2-q.y;right.update(.01);assert(right.wingDamage.right&&!right.finished,plane+': mirrored wing contact');
 const a=flying(plane,{y:50}),b={...a,z:a.z-20},probe=wingProbe(a,'left');const box={min:{x:probe.x-1,y:probe.y-1,z:probe.z-11},max:{x:probe.x+1,y:probe.y+1,z:probe.z-9}};
 const hits=obstacleWingContacts(a,b,[box]);assert.equal(hits.length,1);assert.equal(hits[0].side,'left','Swept wing catches a thin wall');a.update(.05,{},[box]);
}
const plan=makePlan({mode:'free',weather:'sun',to:'LHR'});
assert.equal(landingSurface(plan,REGION_ORIGIN.x+1000,REGION_ORIGIN.z+1400).kind,'water');
for(const [x,z] of smoothPath(RIVER_PATH,(RIVER_PATH.length-1)*18).filter((_,i)=>i%30===0))assert.equal(landingSurface(plan,REGION_ORIGIN.x+x,REGION_ORIGIN.z+z).kind,'water','Visible river agrees with ditching surface');
assert.equal(landingSurface(plan,-2500,-plan.distance-3500).kind,'water','Destination river');
assert.equal(landingSurface(plan,2000,-4000).kind,'land');
function emergencyTouchdown(water,overrides={}){const f=flying('a380',{x:water?-2500:2100,z:water?-plan.distance-3500:-6000,y:water?4.01:7.01,velocity:70,pitch:.078,angleOfAttack:.1,gear:!water,...overrides});f.action('emergency');f.update(.05);return f;}
for(const water of [false,true]){
 const f=emergencyTouchdown(water);assert.equal(f.stage,'emergencyRollout',JSON.stringify({water,stage:f.stage,message:f.resultMessage}));assert(!f.crashed&&!f.finished);const restored=Flight.restore(JSON.parse(JSON.stringify(f.snapshot())));assert.equal(restored.emergencyTouchdown,water?'water':'land');
 for(let i=0;i<3000&&!f.finished;i++)f.update(.025,{brake:true});assert(f.won&&f.finished&&!f.crashed,'Safe emergency stop');assert.equal(f.velocity,0);assert.equal(completeContract(freshProfile(),{...f,plan:{...f.plan,mode:'career'}}),null,'No unflown-contract reward');
 assert(emergencyTouchdown(water,{gear:water}).crashed,'Wrong gear is a hard impact');assert(emergencyTouchdown(water,{pitch:-.2}).crashed,'Hard water/field impact still crashes');
}
const fault=flying('a380',{x:2100,z:-6000,y:7.01,velocity:70,pitch:.078,angleOfAttack:.1,gear:true});fault.triggerFailure('panel');fault.update(.05);assert.equal(fault.stage,'emergencyRollout','Existing failure permits an immediate off-airport touchdown');
const invalid=flying().snapshot();invalid.state.wingDamage={left:'yes',right:false};assert.throws(()=>Flight.restore(invalid));
for(const r of mountainRanges(plan.distance)){assert(mountainHeight(r,r.x,r.z)>600);assert.equal(mountainHeight(r,r.x+r.rx,r.z),0);assert.equal(mountainHeight(r,r.x+r.rx+100,r.z),0);}
for(const z of [0,-plan.distance])for(const x of [-260,0])for(let dz=-3000;dz<=3000;dz+=100)assert.equal(groundHeight(plan,x,z+dz),0,'Runways and approaches stay clear');
const scene=new T.Scene(),mountains=addMountains(scene,{distance:plan.distance});assert.equal(mountains.children.length,3);let triangles=0;for(const m of mountains.children){assert([...m.geometry.attributes.position.array].every(Number.isFinite));assert([...m.geometry.attributes.normal.array].every(Number.isFinite));triangles+=m.geometry.index.count/3;}assert(triangles<80000,'Three mountain draws with a bounded phone geometry budget');
globalThis.innerHeight=720;globalThis.devicePixelRatio=1;globalThis.document={createElement(){return {getContext(){return {createRadialGradient(){return {addColorStop(){}};},fillRect(){}};}};}};
const aircraft=new T.Group();aircraft.position.set(0,100,0);aircraft.userData={span:80,wingSmoke:{left:[-23,0,7],right:[23,0,7]},brakeWheels:[[-4,-6.65,3],[4,-6.65,3]]};
const smoke=createSmoke(scene),burst=createCrashEffect(scene,{capacity:64});smoke.update(.1,{aircraft,wingDamage:{left:true},airborne:true,speed:90});assert(smoke.engineCount>0,'Broken wing keeps smoking');smoke.clear();assert.equal(smoke.liveCount,0);smoke.update(.1,{aircraft,ditching:true,speed:70});assert(smoke.liveCount>0&&smoke.engineCount===0,'Ditching leaves white spray, not engine fire');
const point=new T.Vector3(-38,80,4);burst.trigger(aircraft,{point,scale:.35});const flash=scene.children.find(o=>o.isMesh&&o.geometry.type==='SphereGeometry');assert.deepEqual(flash.position.toArray(),point.toArray(),'Explosion is at wing contact, not fuselage');for(let i=0;i<70;i++)burst.update(.1);assert(!burst.active,'Local explosion ends without stopping the aircraft');
console.log('PASS: both wing strikes for all 12 aircraft, single local impact, save/resume, severe but controllable roll, thin-obstacle sweep, river/lake surfaces, soft/hard ditching, emergency field landing, gear rules, braking, no false contract reward and mountains clear of runways');
