import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Flight} from './dist/flight.js';
import {AIRPORTS,PLANES,WEATHER,makePlan} from './dist/catalog.js';
import {freshProfile,completeContract,saveCurrentFlight} from './dist/career.js';

function takeoff(f){
 f.throttle=1;
 for(let i=0;i<2500&&!f.airborne&&!f.finished;i++)f.update(.05,{elev:f.velocity>f.spec.rotate?1:0});
 assert(f.airborne&&!f.finished,'Must take off without taxiing: '+f.plan.plane);assert.equal(f.stage,'cruise');f.gear=false;f.flaps=0;
 for(let i=0;i<2000&&f.y<150&&!f.finished;i++)f.update(.05);
 assert(!f.finished&&f.y>=150);f.pitch=0;f.throttle=.72;
}
let tested=0;
for(const plane of Object.keys(PLANES))for(const weather of Object.keys(WEATHER)){
 const plan=makePlan({plane,weather,mode:'free',difficulty:'expert',from:'WAW',to:'WAW'}),f=new Flight(plan);
 assert.notEqual(plan.from,plan.to);assert.equal(plan.payload,0);assert.equal(plan.reward,0);
 assert.equal(f.stage,'takeoff');assert(!f.airborne&&f.engines&&f.gear&&f.cleared);assert.equal(f.y,7);assert.equal(f.velocity,0);assert.equal(f.throttle,0);assert.equal(f.flaps,1);assert.equal(f.x,f.departureRunway.start.x);assert.equal(f.z,f.departureRunway.start.z);assert.equal(f.yaw,0);assert.equal(f.taxiPath.length,0);f.action('tower');assert(f.events.at(-1).includes('zgoda na start'));takeoff(f);const altitude=f.y;
 for(let i=0;i<1200;i++)f.update(.05);
 assert(!f.finished&&!f.failed);assert.equal(f.fuel,100);assert.equal(f.y,altitude);assert.equal(f.stage,'cruise','Flying near a destination does not force a mission or approach');
 const restored=Flight.restore(f.snapshot());assert.equal(restored.stage,'cruise');assert.equal(restored.x,f.x);assert.equal(restored.velocity,f.velocity);tested++;
}
for(const from of Object.keys(AIRPORTS)){const f=new Flight(makePlan({from,mode:'free',weather:'sun'}));assert.equal(f.plan.from,from);assert.equal(f.stage,'takeoff');assert.equal(f.z,1510);assert(f.departureRunway.number.startsWith(AIRPORTS[from].runway));}
const controls=new Flight(makePlan({mode:'free',weather:'sun'}));takeoff(controls);const x=controls.x,z=controls.z,altitude=controls.y;
for(let i=0;i<60;i++)controls.update(.05,{steer:1,elev:.3});assert(controls.x!==x&&controls.z!==z&&controls.y>altitude,'Flight controls work immediately');
const originalPitch=controls.pitch;for(let i=0;i<30;i++)controls.update(.05);assert.equal(controls.pitch,originalPitch,'Pitch holds after release');
const long=new Flight(makePlan({mode:'free',difficulty:'expert',weather:'sun'}));takeoff(long);for(let i=0;i<14000;i++)long.update(.05);assert(!long.finished&&!long.failed);assert(long.z< -50000);assert.equal(long.fuel,100,'Long free flight has no fuel or mission-area timeout');
assert.throws(()=>makePlan({plane:'b738',from:'WAW',to:'LAX'}));assert.equal(makePlan({mode:'free',plane:'b738',from:'WAW',to:'LAX'}).reward,0);assert.equal(makePlan({mode:'free',plane:'an225'}).job,'cargo');

const profile=freshProfile(),career=new Flight(makePlan({}));assert(saveCurrentFlight(profile,career));const before=JSON.stringify(profile),savedCareer=profile.current;
assert(!saveCurrentFlight(profile,controls));assert.equal(profile.current,savedCareer);assert.equal(JSON.stringify(profile),before);
for(const airport of ['WAW','LHR'])for(const direction of [1,-1]){
 const f=new Flight(makePlan({mode:'free',weather:'sun'})),airportZ=airport==='WAW'?0:-f.plan.distance,seed=[...airport].reduce((n,c)=>n+c.charCodeAt(0),0);
 Object.assign(f,{airborne:true,stage:'cruise',x:0,y:7.02,z:airportZ+direction*1250,yaw:direction===1?0:Math.PI,pitch:-.02,roll:0,velocity:f.spec.stall+14,throttle:.4,gear:true,flaps:2,elapsed:(90-seed%90)%90+40});
 f.action('tower');assert.equal(f.arrivedAirport,airport,'Tower picks the nearest airport');assert(f.landingClearance);f.update(.05);assert.equal(f.stage,'rollout');
 for(let i=0;i<500&&!f.finished;i++)f.update(.05,{brake:true});assert(f.finished&&f.won);assert.equal(f.stage,'complete','No unloading or ground mission after a free landing');assert.equal(completeContract(profile,f),null);assert.equal(JSON.stringify(profile),before,'Landing does not overwrite career or award coins');
}
const crash=new Flight(makePlan({mode:'free'}));crash.finish(false,'Test');assert(!saveCurrentFlight(profile,crash));assert.equal(completeContract(profile,crash),null);assert.equal(JSON.stringify(profile),before);
const legacy=new Flight(makePlan({mode:'free'}));Object.assign(legacy,{airborne:false,stage:'boarding',x:220,y:7,z:1250,velocity:0,engines:false});const migrated=Flight.restore(legacy.snapshot());assert.equal(migrated.stage,'takeoff');assert(!migrated.airborne&&migrated.engines);assert.equal(migrated.z,1510);
for(const file of ['career.html','index.html']){const html=fs.readFileSync('dist/'+file,'utf8');assert.equal((html.match(/id="freeFlight"/g)||[]).length,1);assert(html.includes('Po prostu leć'));assert.equal((html.match(/id="distanceLabel"/g)||[]).length,1);}
assert.equal(fs.readFileSync('dist/career.html','utf8'),fs.readFileSync('dist/index.html','utf8'));
console.log(`PASS: ${tested} plane/weather runway starts and real takeoffs, all 11 airports, flight controls, pitch hold, long free flight, no route/payload restrictions, optional landing at either airport in either direction, career save protection, legacy saves and matching entry pages`);
