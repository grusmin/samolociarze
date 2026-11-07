import {smoothPath} from './terrain.js';
import * as T from './three.module.js';
import {geometryBatch,sceneMaterial} from './scene-batch.js';
import {surface} from './scenery.js';
import {REGION_BOUNDS,REGION_LANDMARKS,LAKE_OUTLINE,RIVER_PATH,REGION_ROADS,INTERCHANGE_RAMPS} from './region-layout.js';
export {REGION_BOUNDS,REGION_LANDMARKS} from './region-layout.js';

const smooth=points=>new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,0,z)),false,'centripetal');
function sample(points,step=25){const curve=smooth(points);return curve.getPoints(Math.max(2,Math.ceil(curve.getLength()/step)));}
function nearLine(x,z,points,width){return points.some(p=>Math.hypot(x-p.x,z-p.z)<width);}
export function addLocalRegion(parent,{night=false}={}){
 const root=new T.Group();root.name='mapped-local-region';parent.add(root);const {add,box,beam,finish}=geometryBatch(root);
 const asphalt=sceneMaterial('#626768'),edge=sceneMaterial('#d2d3c4'),concrete=sceneMaterial('#a8ada4'),steel=sceneMaterial('#778587',.5,.5),dark=sceneMaterial('#29383c'),sand=sceneMaterial('#b2ad8d'),green=sceneMaterial('#60815b'),trunk=sceneMaterial('#726451'),wall=sceneMaterial('#d0c8b4'),roof=sceneMaterial('#786e64');
 for(const [m,units] of [[asphalt,-2],[edge,-4],[sand,-4]]){m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=units;}
 const roadTexture=surface('asphalt');roadTexture.repeat.set(1,1);asphalt.map=roadTexture;
 const meadow=sceneMaterial('#b5b7a0');meadow.map=surface('grass');meadow.map.repeat.set(100,120);
 box(5800,.08,7500,meadow,600,-.025,450);
 const roadLines=[];
 function ribbon(points,width,mat,height=.15){
  const positions=[],uv=[];
  for(let i=0;i<points.length;i++){
   const p=points[i],a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],len=Math.hypot(b.x-a.x,b.z-a.z)||1,nx=(b.z-a.z)/len,nz=-(b.x-a.x)/len,y=typeof height==='function'?height(p,i):height;
   positions.push(p.x-nx*width/2,y,p.z-nz*width/2,p.x+nx*width/2,y,p.z+nz*width/2);uv.push(0,i*.65,1,i*.65);
  }
  const indices=[];for(let i=0;i<points.length-1;i++){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();mat.side=T.DoubleSide;add(g,mat,0,0,0);return points;
 }
 const bridgeHeight=p=>.22+6.5*Math.exp(-Math.pow(Math.hypot(p.x-1390,p.z+2200)/190,4));
 function offsetLine(line,offset){return line.map((p,i)=>{const a=line[Math.max(0,i-1)],b=line[Math.min(line.length-1,i+1)],l=Math.hypot(b.x-a.x,b.z-a.z)||1;return new T.Vector3(p.x+(b.z-a.z)/l*offset,0,p.z-(b.x-a.x)/l*offset);});}
 for(const road of REGION_ROADS){
  const line=sample(road.points,12),height=road.id==='s1'?bridgeHeight:.2;roadLines.push(line);
  ribbon(line,road.width+3,concrete,p=>(typeof height==='function'?height(p):height)-.05);ribbon(line,road.width,asphalt,height);
  const offsets=road.divided?[-road.width/2+.7,-1.2,1.2,road.width/2-.7]:[-road.width/2+.5,road.width/2-.5];
  for(const o of offsets)ribbon(offsetLine(line,o),.14,edge,p=>(typeof height==='function'?height(p):height)+.025);
  if(road.divided){
   ribbon(line,1.3,green,p=>(typeof height==='function'?height(p):height)+.04);
   for(const o of [-road.width*.25,road.width*.25]){const lane=offsetLine(line,o);for(let i=0;i<lane.length-1;i+=3)ribbon(lane.slice(i,i+2),.16,edge,p=>(typeof height==='function'?height(p):height)+.03);}
   for(let i=0;i<line.length;i+=5){const p=line[i],y=typeof height==='function'?height(p):height;box(.16,.75,.16,steel,p.x,y+.38,p.z);}
  }
 }
 for(const points of INTERCHANGE_RAMPS){const line=sample(points,10);ribbon(line,6.5,concrete,.15);ribbon(line,4.5,asphalt,.22);for(const side of [-1,1])ribbon(offsetLine(line,side*1.95),.12,edge,.25);}
 // Support piers and rails under the S1 overpass at the DK86 crossing.
 for(const x of [1320,1380,1440])for(const z of [-2214,-2188])box(2,6,2,concrete,x,3,z);
 for(const z of [-2210,-2190])beam([1300,7.2,z],[1480,7.2,z],.12,steel);
 // Large irregular lake, shoreline and sand spits, rather than circular ponds.
 const outline=smoothPath(LAKE_OUTLINE,240,true).slice(0,-1).map(([x,z])=>new T.Vector2(x,-z)),shape=new T.Shape(outline),waterMat=new T.MeshPhysicalMaterial({color:night?'#123c4b':'#2a7182',roughness:.22,metalness:.48,clearcoat:.9,envMapIntensity:1.15});
 waterMat.polygonOffset=true;waterMat.polygonOffsetFactor=-1;waterMat.polygonOffsetUnits=-4;
 const waveCanvas=document.createElement('canvas');waveCanvas.width=waveCanvas.height=128;const wc=waveCanvas.getContext('2d');wc.fillStyle='#8080ff';wc.fillRect(0,0,128,128);for(let i=0;i<64;i++){wc.strokeStyle=`rgb(${120+i%15},${120+i%12},250)`;wc.beginPath();wc.moveTo(0,i*2);wc.bezierCurveTo(36,i*2-4,88,i*2+4,128,i*2);wc.stroke();}
 const wave=new T.CanvasTexture(waveCanvas);wave.wrapS=wave.wrapT=T.RepeatWrapping;wave.repeat.set(100,180);waterMat.normalMap=wave;waterMat.normalScale.set(.2,.2);
 const lake=new T.Mesh(new T.ShapeGeometry(shape),waterMat);lake.rotation.x=-Math.PI/2;lake.position.y=.075;lake.name='Pogoria IV';root.add(lake);
 const center=new T.Vector2(900,-1400),outer=outline.map(p=>p.clone().sub(center).multiplyScalar(1.014).add(center)),bankShape=new T.Shape(outer);bankShape.holes.push(new T.Path([...outline].reverse()));const shore=new T.Mesh(new T.ShapeGeometry(bankShape),sand);shore.rotation.x=-Math.PI/2;shore.position.y=.085;root.add(shore);
 const river=sample(RIVER_PATH,18);ribbon(river,20,sand,.075);ribbon(river,10,waterMat,.105);
 // Beach on the north-east shore, a pier, parking and small boats.
 box(100,.12,85,sand,1410,.03,-850);box(48,.12,80,concrete,1510,.1,-820);box(5,.4,45,sceneMaterial('#a39477'),1370,.5,-830,0,-.5);box(16,.4,5,sceneMaterial('#a39477'),1360,.5,-810);
 for(let i=0;i<7;i++){const boat=new T.Mesh(new T.ConeGeometry(1,1,4),sceneMaterial(i%2?'#e9dfcc':'#d7e6e5'));boat.geometry.rotateX(Math.PI);boat.geometry.rotateY(Math.PI/4);boat.scale.set(2,.7,5);boat.position.set(1160+i%3*42,.5,-700+Math.floor(i/3)*70);boat.rotation.y=i*.7;root.add(boat);}
 // Fields use distinct strips with farm tracks; roads and water remain clear.
 const fields=[[-1600,-1400,900,450],[-1100,-900,650,340],[-1250,-300,950,600],[-900,370,800,600],[-1600,1000,950,480],[-1400,1600,700,420],[-1550,-2200,650,500],[-650,-1700,900,370],[1900,-500,260,500],[1950,400,260,700],[2060,1100,220,500]];
 const cropMats=['#829164','#9b9f72','#a0a27c'].map(c=>{const m=sceneMaterial(c);m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=-2;return m;});
 fields.forEach(([x,z,w,d],i)=>{box(w,.045,d,cropMats[i%3],x,.035,z);for(let strip=0;strip<5;strip++)box(w,.015,.5,sand,x,.063,z-d/2+strip*d/5);});
 // Houses follow the actual street corridors instead of a regular town grid.
 const houses=[],crowns=[],treeStems=[];let seed=1831;const random=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
 const localRoads=REGION_ROADS.filter(r=>!r.divided&&!['dk91','koscielna'].includes(r.id));
 for(const road of localRoads){const line=sample(road.points,42);for(let i=1;i<line.length-1;i++)for(const side of [-1,1]){
  const p=line[i],a=line[i-1],b=line[i+1],len=Math.hypot(b.x-a.x,b.z-a.z)||1,x=p.x+(b.z-a.z)/len*side*(22+random()*12),z=p.z-(b.x-a.x)/len*side*(22+random()*12);
  if(Math.hypot(x,z)<55||Math.hypot(x-680,z+1490)<125||x>375&&z> -650&&z<4100&&x<1700)continue;
  const w=10+random()*8,d=10+random()*7,h=4+random()*3,yaw=Math.atan2(b.x-a.x,b.z-a.z);houses.push({x,z,w,d,h,yaw});
 }}
 for(const h of houses){box(h.w,h.h,h.d,wall,h.x,h.h/2,h.z,0,h.yaw);const g=new T.ConeGeometry(1,1,4);g.rotateY(Math.PI/4);g.scale((h.w+1)/Math.SQRT2,3,(h.d+1)/Math.SQRT2);add(g,roof,h.x,h.h+1.5,h.z,0,h.yaw);box(h.w*.65,1.4,.12,dark,h.x,h.h*.58,h.z+h.d/2+.15,0,h.yaw);}
 // Western and eastern woodland belts, with a clear space around the home.
 for(let i=0;i<1700;i++){
  const x=i<1050?-1700+random()*1600:1700+random()*480,z=i<1050?800+random()*3100:-700+random()*4000;
  if(roadLines.some(line=>nearLine(x,z,line,30))||Math.hypot(x,z)<85)continue;
  const h=4+random()*5;crowns.push({x,z,h});treeStems.push({x,z,h});
 }
 for(let i=0;i<80;i++)crowns.push({x:-500+random()*550,z:-600+random()*460,h:4+random()*4});
 function instances(geometry,mat,list,place){const mesh=new T.InstancedMesh(geometry,mat,list.length),dummy=new T.Object3D();list.forEach((p,i)=>{place(dummy,p,i);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();root.add(mesh);return mesh;}
 instances(new T.IcosahedronGeometry(1,1),green,crowns,(d,p)=>{d.position.set(p.x,p.h*.7,p.z);d.scale.set(p.h*.38,p.h*.6,p.h*.38);});
 instances(new T.CylinderGeometry(.15,.3,1,5),trunk,treeStems,(d,p)=>{d.position.set(p.x,p.h*.2,p.z);d.scale.set(1,p.h*.4,1);});
 const school=addSchool(root,{night});finish();root.userData.features=['pogoria-iv','dk86','s1','podwarpie-interchange','school','sports-courts','river','street-villages','fields','woodland'];root.userData.landmarks=REGION_LANDMARKS;root.userData.lakeOutline=LAKE_OUTLINE;root.userData.roads=REGION_ROADS;root.userData.school=school;
 return {root,update(dt){wave.offset.x+=dt*.007;wave.offset.y+=dt*.004;}};
}

function addSchool(parent,{night}){
 const root=new T.Group();root.name='school-wojkowice';root.position.set(680,0,-1490);root.rotation.y=-.42;parent.add(root);const {add,box,beam,finish}=geometryBatch(root);
 const white=sceneMaterial('#e1e2d8'),yellow=sceneMaterial('#a7ad40'),grey=sceneMaterial('#858a85'),dark=sceneMaterial('#343a39'),gym=sceneMaterial('#80716b'),blue=sceneMaterial('#377caa'),paint=sceneMaterial('#f1eee1'),red=sceneMaterial('#b36451'),green=sceneMaterial('#478266'),steel=sceneMaterial('#869392',.4,.5),glass=sceneMaterial('#64818a',.28,.4);
 if(night){glass.emissive.set('#dfc995');glass.emissiveIntensity=.35;}
 box(18,11.5,64,white,0,5.9,0);box(18,.55,64,dark,0,.35,0);box(19,.35,65,dark,0,11.8,0);box(18.5,.2,64.5,grey,0,11.6,0);
 for(const side of [-1,1])for(const y of [2.5,5.9,9.3])for(let i=0;i<13;i++){const z=-28+i*4.5;box(.22,2.2,3.4,yellow,side*9.05,y,z);box(.25,1.9,2.45,glass,side*9.2,y,z+.25);box(.1,1.95,.09,white,side*9.4,y,z+.25);box(.35,.1,2.7,white,side*9.25,y-1,z+.25);}
 for(const z of [-32.2,32.2])for(const y of [2.6,6,9.4]){box(3.6,1.4,.18,glass,0,y,z);box(.1,1.45,.25,white,0,y,z);}
 box(5,3,.25,blue,-2,1.8,32.3);box(7,.3,4,grey,-2,3.6,33.3);for(const x of [-4.6,.6])box(.18,3.6,.18,steel,x,1.8,34.5);
 box(22,4,10,white,-19,2.1,19);box(30,7,22,gym,-28,3.6,1);box(31,.35,23,dark,-28,7.25,1);
 for(let i=0;i<7;i++)box(2.2,1.6,.18,glass,-40+i*4,3.7,12.2);
 box(34,.1,72,grey,0,.1,6);box(12,.12,68,grey,-21,.12,8);
 // A fenced green/orange multi-sport court and a red athletics loop.
 box(46,.1,64,red,-62,.09,-8);box(34,.12,50,green,-62,.16,-8);box(18,.035,28,sceneMaterial('#cd9c57'),-62,.24,-8);
 for(const x of [-78,-46])box(.15,.03,48,paint,x,.25,-8);for(const z of [-32,16])box(32,.03,.15,paint,-62,.25,z);box(32,.03,.15,paint,-62,.25,-8);
 for(const z of [-32,16]){for(const x of [-65,-59])box(.1,2,.1,paint,x,1.25,z);box(6,.1,.1,paint,-62,2.3,z);}
 for(const x of [-85,-39])for(let z=-40;z<=24;z+=8)box(.1,4,.1,steel,x,2,z);for(const z of [-40,24])for(let x=-85;x<=-39;x+=8)box(.1,4,.1,steel,x,2,z);
 for(const y of [1,2,3,4]){beam([-85,y,-40],[-85,y,24],.018,steel);beam([-39,y,-40],[-39,y,24],.018,steel);beam([-85,y,-40],[-39,y,-40],.018,steel);beam([-85,y,24],[-39,y,24],.018,steel);}
 for(let i=0;i<6;i++){box(5,.025,.1,paint,-14,.2,28+i*4);box(2.4,1.2,4.5,i%2?blue:grey,-14,.8,29+i*4);}
 const c=document.createElement('canvas');c.width=1024;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#285d87';ctx.font='bold 62px system-ui';ctx.textAlign='center';ctx.fillText('ZESPÓŁ SZKOLNO-PRZEDSZKOLNY',512,80);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const sign=new T.Mesh(new T.PlaneGeometry(30,3.75),new T.MeshBasicMaterial({map:tex,transparent:true,side:T.DoubleSide}));sign.position.set(-9.5,10.4,-4);sign.rotation.y=-Math.PI/2;root.add(sign);
 finish();root.userData.features=['three-storey-white-building','yellow-window-recesses','flat-roof','lower-gym','connector','multisport-court','court-fence','parking'];return root;
}
