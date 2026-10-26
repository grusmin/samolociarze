export const RUNWAY_X=[0,-260];
export function trafficState(code,elapsed,index=0,reserved=false){
 const seed=[...code].reduce((sum,c)=>sum+c.charCodeAt(0),0),phase=((elapsed+seed+index*45)%90+90)%90;
 return {phase,busy:!reserved&&phase<26,wait:Math.max(0,Math.ceil(26-phase)),x:RUNWAY_X[index]};
}
