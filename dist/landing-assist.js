import {clamp} from './catalog.js';
const wrap=n=>Math.atan2(Math.sin(n),Math.cos(n));

// Assistance steers the normal flight model; it never teleports the aircraft.
export function landingAssistInput(f,input){
 if(!f.landingAssist)return input;
 if(Math.abs(input.steer||0)>.1||Math.abs(input.elev||0)>.1||Math.abs(input.power||0)>.1){f.landingAssist=false;f.message('Asysta lądowania wyłączona. Sterujesz samodzielnie.');return input;}
 if(f.stage==='rollout'){f.throttle=0;return {...input,steer:clamp(wrap((f.landingDirection===1?0:Math.PI)-f.yaw)*6,-.3,.3),elev:0,power:0,brake:true};}
 if(!f.airborne||f.stage!=='approach'||!f.landingClearance){f.landingAssist=false;return input;}
 if(f.reservedUntil-f.elapsed<30)f.radio();
 const direction=f.landingDirection,along=(f.z-f.targetZ)*direction,lateral=Math.abs(f.x-f.runwayX);
 const aligned=Math.abs(wrap((direction===1?0:Math.PI)-f.yaw))<.35;
 if(f.landingAssistPhase==='intercept'&&along>1600&&along<6000&&(lateral<180&&aligned||Math.hypot(f.x-f.runwayX,along-4500)<950))f.landingAssistPhase='final';
 if(f.landingAssistPhase==='final'&&(along< -1400||along< -500&&f.y>70))f.landingAssistPhase='intercept';
 const final=f.landingAssistPhase==='final';
 const targetX=f.runwayX,targetZ=f.targetZ+direction*(final?-1200:4500);
 const desiredSpeed=f.spec.stall+(final?14:25),factor=f.engineFault?.64:f.damagedEngine?.78:1;
 f.gear=true;f.flaps=2;f.throttle=clamp(desiredSpeed/(f.spec.cruise*.9*.88*factor),.28,.98);
 const dx=targetX-f.x,dz=targetZ-f.z,course=final?(direction===1?0:Math.PI)+Math.atan(clamp((f.x-f.runwayX)*direction/550,-.65,.65)):Math.atan2(-dx,-dz),windCorrection=Math.asin(clamp((f.windX*Math.cos(course)-f.windZ*Math.sin(course))/Math.max(f.velocity,f.spec.stall),-.32,.32));
 const desiredYaw=course+windCorrection;
 const height=final?7+Math.max(0,along-950)*.052:220;
 let climb=clamp((height-f.y)*.35-(final&&along>950?f.velocity*.052:0),-8,12);
 if(final&&f.y<30)climb=Math.max(climb,-1.5);if(final&&f.y<12)climb=-.7;
 const desiredPitch=clamp(Math.asin(clamp(climb/Math.max(40,f.velocity),-.2,.2)),-.12,.2);
 return {steer:clamp(wrap(desiredYaw-f.yaw)*7,-1,1),elev:clamp((desiredPitch-f.pitch)*20,-1,1),power:0,brake:!!input.brake||f.velocity>desiredSpeed+12};
}
