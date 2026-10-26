import {AIRPORTS} from './catalog.js';
import {RUNWAY_X} from './traffic.js';
// Shared positions keep the flight rules, map and 3D markings in agreement.
export const TAXI_LAYOUT={version:2,x:160,rearZ:1770,holdX:85,startZ:1510,runwayHalfLength:1600};
export function departureRunway(code){
 const number=String(AIRPORTS[code].runway).padStart(2,'0')+'R';
 return {index:0,x:RUNWAY_X[0],number,label:number+' (prawy)',hold:{x:TAXI_LAYOUT.holdX,z:TAXI_LAYOUT.rearZ},start:{x:RUNWAY_X[0],z:TAXI_LAYOUT.startZ},available:TAXI_LAYOUT.runwayHalfLength+TAXI_LAYOUT.startZ};
}
export function airportGroundAllowed(x,z){
 return Math.abs(z)<1730&&(RUNWAY_X.some(rx=>Math.abs(x-rx)<48)||x>120&&x<190)
  ||x>=-310&&x<460&&Math.abs(z-1050)<480
  ||Math.abs(x-160)<25&&z>=1500&&z<1820
  ||x>=-25&&x<=185&&Math.abs(z-TAXI_LAYOUT.rearZ)<25
  ||Math.abs(x)<25&&z>=1500&&z<1820;
}
export const APRON_SPAWN={x:220,y:7,z:950,yaw:Math.PI};
export const SERVICE_STANDS={
 passengers:{x:220,z:1250,radius:25,name:'terminalu pasażerskiego',label:'TERMINAL · PASAŻEROWIE',short:'Terminal',color:'#62cfad'},
 cargo:{x:350,z:780,radius:25,name:'strefy załadunku cargo',label:'CARGO · ZAŁADUNEK',short:'Strefa cargo',color:'#efb654'}
};
export function serviceStand(job,airportZ=0){const stand=SERVICE_STANDS[job]||SERVICE_STANDS.passengers;return {...stand,y:7,z:stand.z+airportZ};}
