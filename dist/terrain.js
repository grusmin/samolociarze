import {AIRPORTS} from './catalog.js';
import {LAKE_OUTLINE,RIVER_PATH,REGION_ORIGIN} from './region-layout.js';

// The same descriptions drive visible terrain and emergency contact checks.
export const lakeDefinitions=distance=>[{x:1100,z:-distance*.48,r:650,stretch:.85},{x:-1550,z:-distance+3400,r:580,stretch:.65}];
export function lakePolygon(lake,index){return Array.from({length:72},(_,i)=>{const a=i/72*Math.PI*2,r=lake.r*(1+.1*Math.sin(a*3+index)+.07*Math.cos(a*5-index));return [lake.x+Math.cos(a)*r,lake.z-Math.sin(a)*r*lake.stretch];});}
export function insidePolygon(x,z,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [ax,az]=points[i],[bx,bz]=points[j];if((az>z)!==(bz>z)&&x<(bx-ax)*(z-az)/(bz-az)+ax)inside=!inside;}return inside;}
function segmentDistance(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}
// Centripetal Catmull-Rom, matching the visible river and lake without importing WebGL.
export function smoothPath(points,segments,closed=false){
 const at=i=>points[closed?(i%points.length+points.length)%points.length:Math.max(0,Math.min(points.length-1,i))];
 return Array.from({length:segments+1},(_,n)=>{const u=n/segments*(closed?points.length:points.length-1),i=Math.min(Math.floor(u),closed?points.length-1:points.length-2),t=u-i,p1=at(i),p2=at(i+1);let p0=at(i-1),p3=at(i+2);if(!closed&&i===0)p0=p1.map((v,k)=>2*v-p2[k]);if(!closed&&i===points.length-2)p3=p2.map((v,k)=>2*v-p1[k]);let d0=Math.sqrt(Math.hypot(p1[0]-p0[0],p1[1]-p0[1])),d1=Math.sqrt(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])),d2=Math.sqrt(Math.hypot(p3[0]-p2[0],p3[1]-p2[1]));if(d1<1e-4)d1=1;if(d0<1e-4)d0=d1;if(d2<1e-4)d2=d1;return p1.map((v,k)=>{const m1=((v-p0[k])/d0-(p2[k]-p0[k])/(d0+d1)+(p2[k]-v)/d1)*d1,m2=((p2[k]-v)/d1-(p3[k]-v)/(d1+d2)+(p3[k]-p2[k])/d2)*d1;return (2*t**3-3*t*t+1)*v+(t**3-2*t*t+t)*m1+(-2*t**3+3*t*t)*p2[k]+(t**3-t*t)*m2;});});
}
const mappedLake=smoothPath(LAKE_OUTLINE,240,true),mappedRiver=smoothPath(RIVER_PATH,(RIVER_PATH.length-1)*18);
export const mountainRanges=distance=>[
 {x:7200,z:-distance*.35,rx:3400,rz:5400,height:1450,seed:1},
 {x:-10400,z:-distance*.63,rx:3400,rz:5800,height:1750,seed:3},
 {x:8500,z:-distance+4200,rx:2800,rz:3500,height:1100,seed:6}
];
export function mountainHeight(range,x,z){const u=(x-range.x)/range.rx,v=(z-range.z)/range.rz,r=Math.hypot(u,v);if(r>=1)return 0;const envelope=(1-r*r)**2,ridge=.52+.28*Math.abs(Math.sin(u*9+v*4+range.seed))+.2*Math.abs(Math.sin(v*12-u*5));return range.height*envelope*ridge;}
export function groundHeight(plan,x,z){let h=0;for(const range of mountainRanges(plan.distance))h=Math.max(h,mountainHeight(range,x,z));return h;}
export function landingSurface(plan,x,z){
 const localX=x-REGION_ORIGIN.x,localZ=z-REGION_ORIGIN.z;
 if(insidePolygon(localX,localZ,mappedLake))return {kind:'water',height:.075,name:'Pogoria IV'};
 for(let i=1;i<mappedRiver.length;i++)if(segmentDistance(localX,localZ,mappedRiver[i-1],mappedRiver[i])<=5)return {kind:'water',height:.105,name:'rzeka'};
 for(const [i,lake] of lakeDefinitions(plan.distance).entries())if(Math.abs(x-lake.x)<lake.r*1.2&&Math.abs(z-lake.z)<lake.r*1.2&&insidePolygon(x,z,lakePolygon(lake,i)))return {kind:'water',height:.01,name:'jezioro'};
 const biome=AIRPORTS[plan.to].biome,dz=z+plan.distance+3500;
 if(Math.abs(dz)<6500&&(biome==='river'&&Math.abs(x+2500)<250||biome==='coast'&&Math.abs(x+9000)<6000))return {kind:'water',height:0,name:biome==='river'?'rzeka':'morze'};
 const height=groundHeight(plan,x,z),slope=Math.max(Math.abs(groundHeight(plan,x+5,z)-groundHeight(plan,x-5,z)),Math.abs(groundHeight(plan,x,z+5)-groundHeight(plan,x,z-5)))/10;
 return {kind:'land',height,slope,name:height>5?'zbocze górskie':'teren poza lotniskiem'};
}
