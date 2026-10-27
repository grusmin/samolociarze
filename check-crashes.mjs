import assert from 'node:assert/strict';
import {Flight} from './dist/flight.js';
import {makePlan} from './dist/catalog.js';

function touchdown(overrides={}){
 const f=new Flight(makePlan({mode:'free',weather:'sun',difficulty:'captain'}));
 Object.assign(f,{airborne:true,stage:'approach',x:0,y:7.02,z:f.targetZ+500,yaw:0,pitch:-.02,roll:0,velocity:70,throttle:.4,gear:true,flaps:2,landingClearance:true,windX:0,windZ:0,...overrides});
 f.update(.05);return f;
}
const good=touchdown();assert.equal(good.stage,'rollout');assert(!good.crashed&&!good.finished,'Normal landing has no explosion');
const hard=touchdown({pitch:-.2,velocity:80});assert(hard.finished&&hard.crashed&&!hard.won);assert(!hard.engines&&!hard.airborne);assert.equal(hard.velocity,0);hard.finish(true,'late');assert(hard.crashed&&!hard.won,'Impact is recorded once');
assert(touchdown({gear:false}).crashed,'Landing without gear is an impact');
assert(touchdown({x:160}).crashed,'Ground impact outside the runway is a crash');
assert(touchdown({roll:.3}).crashed,'Wing strike is a crash');
const noPermission=touchdown({landingClearance:false});assert(noPermission.finished&&!noPermission.won&&!noPermission.crashed,'Safe touchdown rejected by ATC rules does not explode');
const overrun=new Flight(makePlan({weather:'sun'}));Object.assign(overrun,{stage:'takeoff',x:0,z:-1800,velocity:80,engines:true,throttle:1});overrun.update(.05);assert(overrun.finished&&overrun.crashed,'Runway overrun is an impact');
const area=new Flight(makePlan({weather:'sun'}));Object.assign(area,{airborne:true,stage:'cruise',x:23000,y:800,velocity:100,engines:true});area.update(.05);assert(area.finished&&!area.crashed,'Leaving the mission area does not explode');
console.log('PASS: hard impacts, gear/wing/ground crashes, runway overrun, engine stop, single crash result, safe landings and non-impact mission failures');
