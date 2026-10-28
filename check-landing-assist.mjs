import assert from 'node:assert/strict';
import {Flight} from './dist/flight.js';
import {makePlan,PLANES,WEATHER} from './dist/catalog.js';

function approach({plane='a380',direction=1,x=440,y=280,z=5000,yaw,mode='free',weather='wind'}={}){
 const f=new Flight(makePlan({plane,mode,weather,difficulty:'captain'}));
 Object.assign(f,{airborne:true,engines:true,stage:'approach',targetZ:0,arrivedAirport:'WAW',runwayX:-260,runwayIndex:1,x,y,z:z*direction,yaw:yaw??(direction===1?.1:Math.PI-.1),velocity:f.spec.stall+30,throttle:.6,wp:4,landingClearance:true,reservedUntil:100000});
 f.action('landingAssist');assert(f.landingAssist);return f;
}
function land(f){for(let i=0;i<20000&&!f.finished&&f.stage!=='taxiin';i++)f.update(.05);assert(!f.crashed,f.resultMessage);return f;}
let count=0;
for(const plane of Object.keys(PLANES))for(const weather of Object.keys(WEATHER))for(const direction of [1,-1]){const f=land(approach({plane,direction,weather}));assert(f.finished&&f.won,'Assisted landing: '+plane+' '+direction);assert(f.landingScore>65);count++;}
for(const data of [{x:1500,z:4000,y:400,yaw:.4},{x:500,z:1000,y:60,yaw:0},{x:50,z:1800,y:100,yaw:0},{x:300,z:4500,y:250,yaw:Math.PI},{x:3500,z:6500,y:700,yaw:.8}])assert(land(approach(data)).won,'Recovery from a wide, late, high or reversed approach');
const career=land(approach({mode:'career'}));assert.equal(career.stage,'taxiin');assert(!career.finished,'Landing assist does not bypass unloading or rewards');
const manual=approach();manual.update(.05,{steer:1});assert(!manual.landingAssist,'Pilot input immediately disengages assistance');
const blocked=new Flight(makePlan({mode:'free'}));blocked.action('landingAssist');assert(!blocked.landingAssist,'No landing assist on the runway');Object.assign(blocked,{airborne:true,stage:'approach'});blocked.action('landingAssist');assert(!blocked.landingAssist,'Clearance is required');
const saved=approach();saved.update(.05);const restored=Flight.restore(saved.snapshot());assert(restored.landingAssist);assert.equal(restored.landingDirection,saved.landingDirection);
console.log(`PASS: ${count} assisted landings across all aircraft and both directions in crosswind, approach recovery, braking, manual override, clearance, career stages and resume`);
