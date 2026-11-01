import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Flight} from './dist/flight.js';
import {PLANES,WEATHER,makePlan} from './dist/catalog.js';

const radians=degrees=>degrees*Math.PI/180;
function approach(plane='a380',weather='sun',direction=1,difficulty='captain'){
 const f=new Flight(makePlan({plane,weather,mode:'free',difficulty}));
 Object.assign(f,{airborne:true,stage:'approach',targetZ:0,arrivedAirport:'WAW',x:0,y:140,z:4000*direction,yaw:direction===1?0:Math.PI,pitch:radians(3),roll:0,velocity:f.spec.stall+14,angleOfAttack:.1,engines:true,gear:true,flaps:2,landingClearance:true,reservedUntil:100000});
 f.throttle=f.velocity/(f.spec.cruise*.9*.88);return f;
}
let count=0;
for(const plane of Object.keys(PLANES))for(const weather of Object.keys(WEATHER))for(const direction of [1,-1]){
 const f=approach(plane,weather,direction),height=f.y,held=f.pitch;
 for(let i=0;i<20;i++)f.update(.05);
 assert(f.pitch>0&&f.y<height&&f.verticalSpeed<0,plane+': nose above horizon while descending');
 assert.equal(f.pitch,held,'Releasing the elevator preserves attitude');
 const sink=f.verticalSpeed;
 f.update(.05,{elev:1});assert(f.verticalSpeed>sink,'Pulling back reduces descent');
 // A test pilot flies using ordinary controls; no landing controller is shipped.
 for(let i=0;i<5000&&!f.finished;i++){
  if(f.airborne){
   const base=direction===1?0:Math.PI,wind=f.windX*(1+Math.sin(f.elapsed*.37)*.15);
   const yaw=base+Math.asin(wind*Math.cos(base)/f.velocity);
   const diff=Math.atan2(Math.sin(yaw-f.yaw),Math.cos(yaw-f.yaw));
   const pitch=radians(f.y<15?4.9:3);
   f.update(.05,{steer:Math.max(-1,Math.min(1,diff*8)),elev:Math.max(-1,Math.min(1,(pitch-f.pitch)*18))});
  }else f.update(.05,{brake:true});
 }
 assert(f.finished&&f.won,plane+' '+weather+' '+direction+': '+f.resultMessage);
 assert(f.landingSink<1.5,'Manual nose-up flare gives a soft touchdown');count++;
}
const slow=approach(),fast=approach();fast.throttle=.8;
for(let i=0;i<120;i++){slow.update(.05);fast.update(.05);}
assert(fast.velocity>slow.velocity&&fast.verticalSpeed>slow.verticalSpeed,'Power can reduce descent by increasing airspeed');
const smooth=approach();smooth.flaps=0;smooth.angleOfAttack=.02;smooth.action('flaps');smooth.action('flaps');smooth.update(.05);
assert(smooth.angleOfAttack>.02&&smooth.angleOfAttack<.04,'Flap extension changes the path gradually');
const saved=approach();saved.update(.05);const resumed=Flight.restore(saved.snapshot());assert.equal(resumed.pitch,saved.pitch);assert.equal(resumed.angleOfAttack,saved.angleOfAttack);
saved.update(.05);resumed.update(.05);assert.equal(resumed.y,saved.y,'New saves resume the exact same descent');
const old=approach().snapshot();delete old.state.angleOfAttack;old.state.pitch=-.025;old.state.landingAssist=true;old.state.landingAssistPhase='final';
const migrated=Flight.restore(old);assert(migrated.pitch>0);assert(Math.abs(migrated.pitch-migrated.angleOfAttack+.025)<1e-9,'Legacy save preserves flight path');assert(!('landingAssist' in migrated),'Old autopilot is never restored');
assert.throws(()=>Flight.restore({...old,state:{...old.state,angleOfAttack:NaN}}));
const manual=approach();manual.y=20;manual.pitch=-.14;manual.action('landingAssist');const throttle=manual.throttle,yaw=manual.yaw;
manual.update(.05);assert.equal(manual.throttle,throttle);assert.equal(manual.yaw,yaw);assert.equal(manual.pitch,-.14);assert(manual.verticalSpeed< -6.5,'No automatic flare or attitude correction near the runway');
const rookie=approach('a380','sun',1,'rookie');rookie.y=20;rookie.pitch=-.14;rookie.update(.05);assert(rookie.verticalSpeed< -6.5,'Training difficulty has no automatic flare either');
for(const file of ['dist/index.html','dist/career.html','dist/app.js','dist/flight.js'])assert(!/landingAssist|landing-assist|Pomóż w lądowaniu/.test(fs.readFileSync(file,'utf8')),'Removed autopilot UI and input: '+file);
assert(!fs.existsSync('dist/landing-assist.js'));
console.log(`PASS: ${count} manual nose-up descents, flares and landings across 12 aircraft, five weathers and both directions; power response, smooth flaps, pitch hold, save migration and no automatic landing/flare`);
