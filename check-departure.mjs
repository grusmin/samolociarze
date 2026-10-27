import assert from 'node:assert/strict';
import {Flight} from './dist/flight.js';
import {AIRPORTS,PLANES,makePlan} from './dist/catalog.js';
import {TAXI_LAYOUT,departureRunway,serviceStand} from './dist/ground.js';
import {trafficState} from './dist/traffic.js';
let count=0;
const cases=[...Object.keys(AIRPORTS).map(from=>({from,plane:'a380'})),...Object.keys(PLANES).map(plane=>({from:'WAW',plane}))];
for(const {from,plane} of cases){
 const job=PLANES[plane].seats?'passengers':'cargo',to=from==='LHR'?'WAW':'LHR';
 const f=new Flight(makePlan({from,to,plane,job}));Object.assign(f,serviceStand(job),{stage:'prep',engines:true});f.action('tower');
 assert.equal(f.stage,'taxi');assert.equal(f.departureRunway.number,AIRPORTS[from].runway+'R');assert(f.events.at(-1).includes(f.departureRunway.number));
 assert(f.taxiPath.some(p=>p.z>1600),'Route passes behind the runway end');assert.equal(f.taxiPath.at(-1).x,TAXI_LAYOUT.holdX);
 f.action('service');for(let i=0;i<5000&&f.stage==='taxi';i++){f.update(.05);assert(f.groundAllowed(),'Taxi route stays on paved areas');}
 assert.equal(f.stage,'hold');assert(!f.cleared);assert(f.z-PLANES[plane].length/2>1600,'Entire aircraft holds outside the runway');
 const seed=[...from].reduce((n,c)=>n+c.charCodeAt(0),0);f.elapsed=(90-seed%90)%90+2;assert(trafficState(from,f.elapsed).busy);f.action('tower');assert.equal(f.stage,'hold');assert(f.events.at(-1).includes(f.departureRunway.number));
 f.elapsed=(90-seed%90)%90+40;f.action('tower');assert.equal(f.stage,'lineup');assert(f.cleared);assert(f.departureReservedUntil>f.elapsed+100);
 const resumed=Flight.restore(f.snapshot());assert.equal(resumed.stage,'lineup');assert.deepEqual(resumed.taxiPath,f.taxiPath);
 f.action('service');f.update(.05,{brake:true});assert.equal(f.velocity,0,'H stops lineup assistance');for(let i=0;i<4000&&f.stage==='lineup';i++)f.update(.05);
 assert.equal(f.stage,'takeoff');assert(Math.abs(f.x)<5);assert(f.z>1450&&f.z<1530);assert.equal(f.yaw,0);assert(f.departureRunway.available>3000,'Full runway available ahead');
 f.throttle=1;f.flaps=1;for(let i=0;i<1500&&!f.airborne&&!f.finished;i++)f.update(.05,{elev:f.velocity>f.spec.rotate?1:0});assert(f.airborne,`${from}/${plane} can take off from the beginning`);count++;
}
const manual=new Flight(makePlan({}));manual.engines=true;manual.stage='taxi';Object.assign(manual,manual.departureRunway.start);manual.action('tower');assert(!manual.cleared,'Shortcut does not grant departure');manual.update(.05);assert.equal(manual.stage,'taxi');
manual.stage='lineup';manual.cleared=true;manual.z=1050;manual.update(.05);assert.equal(manual.stage,'lineup','Middle of runway is not the new start point');Object.assign(manual,manual.departureRunway.start,{yaw:0,velocity:0});manual.update(.05);assert.equal(manual.stage,'takeoff','Manual lineup completes at the assigned start');
const old=new Flight(makePlan({}));old.stage='hold';old.x=0;old.z=1050;const saved=old.snapshot();delete saved.state.taxiLayoutVersion;const migrated=Flight.restore(saved);assert.equal(migrated.stage,'taxi');assert.equal(migrated.x,0);assert.equal(migrated.z,1050);assert.equal(migrated.taxiPath.at(-1).z,TAXI_LAYOUT.rearZ);
saved.state.stage='takeoff';saved.state.cleared=true;assert.equal(Flight.restore(saved).stage,'takeoff','Already-started old departures continue');
const expert=new Flight(makePlan({difficulty:'expert'}));expert.elapsed=900;expert.stage='takeoff';expert.engines=true;expert.velocity=80;expert.pitch=.1;expert.update(.05);assert(expert.airborne&&!expert.failed,'Taxi waiting does not trigger an immediate airborne failure');expert.airTime=170.1;expert.update(.05);assert(expert.failed);assert.equal(Flight.restore(expert.snapshot()).airTime,expert.airTime);
console.log(`PASS: ${count} departures covering all ${Object.keys(AIRPORTS).length} airports and ${Object.keys(PLANES).length} aircraft; rear taxi route, named runway, STOP outside the runway, traffic denial, clearance, lineup, takeoff, manual guidance, save migration and airborne failure timer`);
