import {clamp} from './catalog.js';

// A small game model, not aircraft performance data. Pitch is the attitude of
// the fuselage; the flight path is pitch minus the angle of attack. Approach
// speed and deployed flaps therefore allow a descent with the nose above level.
export function approachAngleOfAttack(spec,speed,flaps){
 const slow=clamp((spec.stall+45-speed)/30,0,1);
 const blend=slow*slow*(3-2*slow);
 return (.02+clamp(flaps,0,2)*.04)*blend;
}
