import assert from 'node:assert/strict';
import {Flight} from './dist/flight.js';
import {makePlan,PLANES} from './dist/catalog.js';
import {SERVICE_STANDS,serviceStand} from './dist/ground.js';

for(const job of ['passengers','cargo']){
 const f=new Flight(makePlan({plane:job==='cargo'?'an225':'a380',job}));
 assert.equal(f.stage,'toService');assert(f.serviceDistance>100);f.action('service');assert(!f.serviceActive);
 const wrong=SERVICE_STANDS[job==='cargo'?'passengers':'cargo'];f.stage='boarding';Object.assign(f,wrong);f.action('service');assert(!f.serviceActive,'The other stand cannot service this job');
 Object.assign(f,serviceStand(job));f.velocity=2;f.action('service');assert(!f.serviceActive,'Moving aircraft cannot load');
 f.velocity=0;f.throttle=.2;f.action('service');assert(!f.serviceActive,'High power cannot load');
 f.throttle=0;f.action('service');assert(f.serviceActive);f.update(.05);assert(f.serviceProgress>0);
 f.x+=100;f.update(.05);assert(!f.serviceActive);assert.equal(f.serviceProgress,0,'Leaving the stand cancels loading');
 const old=new Flight(makePlan({plane:job==='cargo'?'an225':'a380',job}));old.stage='boarding';old.x=220;old.z=1250;
 const restored=Flight.restore(old.snapshot());assert.equal(restored.x,old.x);assert.equal(restored.z,old.z);assert.equal(restored.stage,job==='cargo'?'toService':'boarding','Legacy saves retain position and are guided to the correct stand');
 old.stage='unloading';old.z=old.targetZ+1250;const oldArrival=Flight.restore(old.snapshot());assert.equal(oldArrival.stage,job==='cargo'?'taxiin':'unloading');
}
// Exercise steering and assistance with every fleet type and both job categories.
for(const [plane,spec] of Object.entries(PLANES))for(const job of ['cargo',...(spec.seats?['passengers']:[])]){
 const f=new Flight(makePlan({plane,job}));f.action('engine');f.action('assist');f.update(.05,{brake:true});assert.equal(f.velocity,0,'H stops taxi assistance');
 for(let i=0;i<4000&&f.stage==='toService';i++)f.update(.05);
 assert.equal(f.stage,'boarding',`${plane}/${job} reaches its stand`);assert(f.canService);
 const copy=Flight.restore(f.snapshot());assert(copy.canService,'Ready-to-load state survives reload');
 f.action('service');const seconds=job==='cargo'?2:20;assert.equal(f.serviceDuration,seconds);for(let i=0;i<seconds*20-1;i++)f.update(.05);assert.equal(f.stage,'boarding',`${job} loading does not finish early`);for(let i=0;i<2;i++)f.update(.05);assert.equal(f.stage,'prep',`${job} loading finishes at ${seconds} seconds`);
 f.action('tower');f.action('service');for(let i=0;i<4000&&f.stage==='taxi';i++)f.update(.05);assert.equal(f.stage,'hold',`${plane}/${job} reaches runway after loading`);
 // After landing, use the actual arrival route to the destination stand.
 f.stage='rollout';f.x=-260;f.z=f.targetZ-400;f.velocity=0;f.throttle=0;f.update(.05);assert.equal(f.stage,'taxiin');f.action('service');
 for(let i=0;i<6000&&f.stage==='taxiin';i++)f.update(.05);
 assert.equal(f.stage,'unloading',`${plane}/${job} reaches destination stand`);assert(f.canService);assert(Math.abs(f.z-(f.targetZ+SERVICE_STANDS[job].z))<25);
 f.action('service');for(let i=0;i<150&&!f.finished;i++)f.update(.05);assert(f.won);
}
const manual=new Flight(makePlan({weather:'sun'}));manual.action('engine');manual.throttle=.25;const start=manual.z;for(let i=0;i<200;i++)manual.update(.05);assert(manual.z>start+10,'Manual taxi works before loading');assert.equal(manual.stage,'toService');assert(!manual.serviceActive);
console.log('PASS: terminal/cargo separation, stopped/idle gates, interrupted service, legacy saves, manual taxi, H brake, assistance to both stands and runway for all 11 aircraft, destination unloading, passengers load in 20 seconds and cargo in 2');
