import {groundHeight,landingSurface} from './terrain.js';

// Lowest points on the outer wings, measured from the game's actual imported models.
const probes={a380:[-39.885,.695,15.123],b747:[-28.38,.227,11.441],an225:[-42.849,-.694,7.61],b738:[-14.299,-1.572,2.281],a320:[-14.241,-1.11,.297],b763:[-22.721,.287,6.615],beluga:[-18.443,-.293,3.039],b788:[-24.717,1.148,8.202],a343:[-24.315,-.013,6.873],b772:[-24.567,1.287,4.399],conc:[-10.861,-3.53,14.411],a359:[-25.982,1.452,7.36]};
export function localToWorld(f,[x,y,z]){const cz=Math.cos(f.roll),sz=Math.sin(f.roll),cx=Math.cos(f.pitch),sx=Math.sin(f.pitch),cy=Math.cos(f.yaw),sy=Math.sin(f.yaw),a=x*cz-y*sz,b=x*sz+y*cz,c=b*cx-z*sx,d=b*sx+z*cx;return {x:f.x+a*cy+d*sy,y:f.y+c,z:f.z-a*sy+d*cy};}
export function wingProbe(f,side){const p=probes[f.plan.plane];return localToWorld(f,[side==='left'?p[0]:-p[0],p[1],p[2]]);}
export function groundWingContacts(f){if(f.velocity<12)return [];return ['left','right'].filter(side=>!f.wingDamage[side]).map(side=>({side,point:wingProbe(f,side),source:'ziemia'})).filter(hit=>landingSurface(f.plan,hit.point.x,hit.point.z).kind==='land'&&hit.point.y<=groundHeight(f.plan,hit.point.x,hit.point.z)+.3);}
// Sweep each outer wing across each simulation substep; a narrow obstacle cannot be skipped.
function intersectBox(a,b,box){let low=0,high=1;for(const axis of ['x','y','z']){const d=b[axis]-a[axis],lo=box.min[axis]-.5,hi=box.max[axis]+.5;if(Math.abs(d)<1e-8){if(a[axis]<lo||a[axis]>hi)return null;}else{let t0=(lo-a[axis])/d,t1=(hi-a[axis])/d;if(t0>t1)[t0,t1]=[t1,t0];low=Math.max(low,t0);high=Math.min(high,t1);}}return low<=high&&high>=0&&low<=1?{x:a.x+(b.x-a.x)*low,y:a.y+(b.y-a.y)*low,z:a.z+(b.z-a.z)*low}:null;}
export function obstacleWingContacts(before,after,boxes){
 const hits=[];for(const side of ['left','right']){if(after.wingDamage[side])continue;const p=probes[after.plan.plane],sign=side==='left'?1:-1,at=(f,t)=>localToWorld(f,[p[0]*sign*t,p[1]*t,p[2]*t]);
  const a=at(before,1),b=at(after,1),innerA=at(before,.6),innerB=at(after,.6),middleA=at(before,.8),middleB=at(after,.8);
  for(const box of boxes){let point;for(const [start,end] of [[a,b],[innerA,innerB],[middleA,middleB],[innerA,a],[innerB,b]]){point=intersectBox(start,end,box);if(point)break;}if(point){hits.push({side,point,source:'przeszkoda'});break;}}
 }return hits;
}
