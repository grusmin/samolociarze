import {fleetAircraft} from './fleet.js';

export const AIRPORT_FLEET_TYPES=['b738','a320'];
export function addAirportFleet(airport,makeAircraft=fleetAircraft){
 const add=(type,role,x,z,yaw)=>{
  const {root,gear}=makeAircraft(type);
  root.userData.sharedFleet=true;root.userData.type=type;root.userData.role=role;
  root.position.set(x,7,z);root.rotation.set(0,yaw,0);root.scale.setScalar(1);
  gear.forEach(g=>g.visible=true);airport.add(root);return root;
 };
 const parked=[add('a320','parked',335,985,Math.PI/2),add('b738','parked',385,1160,Math.PI/2)];
 const traffic=AIRPORT_FLEET_TYPES.map(type=>{const jet=add(type,'traffic',0,0,0);jet.visible=false;return jet;});
 airport.userData.parked=parked;airport.userData.traffic=traffic;
 return {parked,traffic};
}
