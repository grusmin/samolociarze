import * as T from './three.module.js';
import {AIRPORTS,WEATHER} from './catalog.js';
import {surface} from './scenery.js';
import {trafficState,RUNWAY_X} from './traffic.js';
import {SERVICE_STANDS,TAXI_LAYOUT,departureRunway} from './ground.js';
import {addAirportFleet} from './airport-fleet.js';
import {disposeScenery} from './scene-resources.js';
import {addAirportFence} from './airport-fence.js';
import {addAirportBuildings} from './airport-buildings.js';
import {addLakes} from './lakes.js';

export function createWorld(scene){
 let group=null,plan=null,passengers=[],vehicles=[],clouds=[],beacon=null,rain=null,water=null,time=0,sky,routeGuide,terrain,lakes;
 const guideDummy=new T.Object3D();
 const palette={white:'#e9eee9',dark:'#25323d',glass:'#345665',metal:'#a7b3b8',yellow:'#edc967',red:'#cb554d'};
 function material(color,roughness=.8){return new T.MeshStandardMaterial({color,roughness,metalness:roughness<.5?.25:.05});}
 function box(parent,w,h,d,mat,x=0,y=0,z=0){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);return m;}
 function label(text,width,height,x,y,z,parent=group){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#d7e5e8';ctx.font='bold 110px system-ui';ctx.textAlign='center';ctx.fillText(text,512,155);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map:t,transparent:true,side:T.DoubleSide,depthWrite:false}));m.position.set(x,y,z);parent.add(m);return m;}
 function standSign(text,color,x,z,parent){const c=document.createElement('canvas');c.width=1024;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle='#153748ee';ctx.fillRect(0,0,1024,192);ctx.fillStyle=color;ctx.fillRect(0,0,12,192);ctx.font='bold 66px system-ui';ctx.textAlign='center';ctx.fillText(text,512,117);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;const sign=new T.Sprite(new T.SpriteMaterial({map:t,depthWrite:false}));sign.position.set(x,34,z);sign.scale.set(104,19.5,1);parent.add(sign);return sign;}
 function instanced(geo,mat,items,parent=group){const mesh=new T.InstancedMesh(geo,mat,items.length),dummy=new T.Object3D();items.forEach((item,i)=>{dummy.position.set(...item.p);dummy.scale.set(...(item.s||[1,1,1]));dummy.rotation.set(...(item.r||[0,0,0]));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(item.color)mesh.setColorAt(i,new T.Color(item.color));});mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function dispose(){if(!group)return;scene.remove(group);disposeScenery(group);group=null;}
 function airport(code,z){
  const airport=AIRPORTS[code],root=new T.Group();root.position.z=z;root.userData.code=code;root.userData.traffic=[];group.add(root);
  const asphalt=material('#778188'),roadTexture=surface('asphalt');roadTexture.repeat.set(2,55);asphalt.map=roadTexture;
  const concrete=material('#c2c2b5'),concreteTexture=surface('concrete');concreteTexture.repeat.set(7,18);concrete.map=concreteTexture;
  const white=material(palette.white),metal=material(palette.metal,.4),glass=material(palette.glass,.25),dark=material(palette.dark),yellow=new T.MeshBasicMaterial({color:palette.yellow});
  box(root,96,.18,3200,asphalt,0,.08,0);box(root,50,.12,3200,concrete,160,.02,0);box(root,370,.12,920,concrete,275,.04,1050);
  for(const zz of [-1200,-600,0,600,1250]){box(root,160,.12,35,concrete,80,.02,zz);box(root,160,.025,1,yellow,80,.19,zz);}
  box(root,1,.03,3100,yellow,160,.19,0);box(root,60,.03,1,yellow,190,.19,1250);
  // Taxiway A goes around the rear end, to a hold point outside the runway.
  box(root,50,.12,250,concrete,160,.02,1695);box(root,210,.12,50,concrete,80,.02,TAXI_LAYOUT.rearZ);box(root,50,.12,270,concrete,0,.02,1655);
  box(root,1,.03,260,yellow,160,.2,1640);box(root,160,.03,1,yellow,80,.2,TAXI_LAYOUT.rearZ);box(root,1,.03,260,yellow,0,.2,1640);
  for(let i=0;i<8;i++)box(root,3,.03,3,yellow,TAXI_LAYOUT.holdX,.23,TAXI_LAYOUT.rearZ-22+i*6);
  root.userData.departureMarkers=[];
  const dep=departureRunway(code);
  for(const [kind,point,text,color] of [['hold',dep.hold,'STOP · PAS '+dep.number,'#f2b15b'],['start',dep.start,'START · PAS '+dep.number,'#76dfff']]){
   const mat=new T.MeshBasicMaterial({color}),arrow=new T.Mesh(new T.ConeGeometry(3.5,8,4),mat);arrow.rotation.z=Math.PI;arrow.position.set(point.x,23,point.z);arrow.visible=false;root.add(arrow);
   const sign=standSign(text,color,point.x,point.z,root);sign.visible=false;root.userData.departureMarkers.push({kind,...point,sign,arrow});
  }
  const markings=[];for(let zz=-1500;zz<1550;zz+=100)markings.push({p:[0,.2,zz],s:[1.8,.025,40]});for(const x of [-45,45])markings.push({p:[x,.2,0],s:[1,.025,3150]});for(const end of [-1,1])for(let x=-32;x<40;x+=9)markings.push({p:[x,.22,end*1450],s:[5,.03,70]});instanced(new T.BoxGeometry(1,1,1),white,markings,root);
  const second=new T.Group();second.position.x=-260;root.add(second);box(second,96,.18,3200,asphalt,0,.08,0);instanced(new T.BoxGeometry(1,1,1),white,markings,second);box(root,260,.12,35,concrete,-130,.02,1250);box(root,260,.025,1,yellow,-130,.19,1250);
  for(const [parent,suffix] of [[root,'R'],[second,'L']])for(const end of [-1,1]){const s=label((end===1?airport.runway:String((Number(airport.runway)+17)%36+1).padStart(2,'0'))+suffix,36,24,0,.26,end*1335,parent);s.rotation.x=-Math.PI/2;if(end===-1)s.rotation.z=Math.PI;}
  const lights=[];for(let zz=-1550;zz<=1550;zz+=60)for(const x of [-49,49])lights.push({p:[x,.6,zz],s:[1.4,.8,1.4]});for(let i=0;i<12;i++)lights.push({p:[0,.5,1650+i*45],s:[2,.6,2]});const lightMat=new T.MeshStandardMaterial({color:'#f2e8bd',emissive:'#ffd981',emissiveIntensity:WEATHER[plan.weather].night?4:.2});instanced(new T.BoxGeometry(1,1,1),lightMat,lights,root);
  instanced(new T.BoxGeometry(1,1,1),lightMat,lights,second);
  // Runway approach indicator: four lamps turn red when the aircraft is low.
  const papi=[];for(let i=0;i<4;i++){const m=box(root,2,1,2,new T.MeshBasicMaterial({color:'#ed514d'}),-65-i*4,.7,1100);papi.push(m);}root.userData.papi=papi;
  addAirportBuildings(root,{code,city:airport.city,night:WEATHER[plan.weather].night});
  root.userData.stands=[];
  for(const [job,stand] of Object.entries(SERVICE_STANDS)){
   const paint=new T.MeshBasicMaterial({color:stand.color}),fill=new T.MeshBasicMaterial({color:stand.color,transparent:true,opacity:.09,depthWrite:false});
   box(root,98,.025,108,fill,stand.x,.21,stand.z);
   for(const dx of [-49,49])box(root,1.2,.03,108,paint,stand.x+dx,.24,stand.z);
   for(const dz of [-54,54])box(root,98,.03,1.2,paint,stand.x,.24,stand.z+dz);
   const circle=new T.Mesh(new T.RingGeometry(stand.radius-1,stand.radius,48),paint);circle.rotation.x=-Math.PI/2;circle.position.set(stand.x,.25,stand.z);root.add(circle);
   box(root,1,.03,70,yellow,220,.2,stand.z-35);if(job==='cargo')box(root,190,.03,1,yellow,255,.2,stand.z);
   const arrow=new T.Mesh(new T.ConeGeometry(3.5,8,4),paint);arrow.rotation.z=Math.PI;arrow.position.set(stand.x,23,stand.z);arrow.visible=false;root.add(arrow);
   const sign=standSign(stand.label,stand.color,stand.x,stand.z,root);root.userData.stands.push({job,fill,sign,arrow,x:stand.x,z:stand.z});
  }
  // Apron vehicles and luggage carts have real wheel and body geometry.
  for(let i=0;i<3;i++){const van=new T.Group();root.add(van);van.position.set(285+i*38,0,1150);box(van,4,3,8,i===0?white:yellow,0,2,0);box(van,3.8,1.5,3,glass,0,3,-2);for(const x of [-2.1,2.1])for(const zz of [-2.4,2.4]){const tyre=new T.Mesh(new T.CylinderGeometry(.65,.65,.5,10),dark);tyre.rotation.z=Math.PI/2;tyre.position.set(x,.7,zz);van.add(tyre);}vehicles.push({root:van,z,baseX:van.position.x,baseZ:van.position.z});}
  const people=new T.Group();root.add(people);for(let i=0;i<18;i++){const person=new T.Group();people.add(person);box(person,.65,1.05,.4,material(['#cc7446','#456882','#7c627e'][i%3]),0,1,0);const head=new T.Mesh(new T.SphereGeometry(.22,8,6),material('#d3ab8b'));head.position.y=1.76;person.add(head);box(person,.19,.65,.21,dark,-.17,.3,0);box(person,.19,.65,.21,dark,.17,.3,0);passengers.push({root:person,z,index:i});}
  addAirportFleet(root);addAirportFence(root);
  return root;
 }
 function build(nextPlan){
  dispose();plan=nextPlan;passengers=[];vehicles=[];clouds=[];time=0;group=new T.Group();scene.add(group);
  const airportInfo=AIRPORTS[plan.from],weather=WEATHER[plan.weather],grassTexture=surface('grass');grassTexture.repeat.set(750,750);const groundMat=material(airportInfo.color);groundMat.map=grassTexture;const ground=new T.Mesh(new T.PlaneGeometry(100000,100000),groundMat);ground.rotation.x=-Math.PI/2;ground.position.set(0,-.14,-plan.distance*.5);ground.receiveShadow=true;group.add(ground);terrain=ground;
  const skyColors=weather.night?['#071325','#1b3046']:plan.weather==='sunset'?['#32608b','#efb087']:weather.rain?['#536675','#9caeb8']:['#367db5','#c5dce7'];
  sky=new T.Mesh(new T.SphereGeometry(47000,24,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color(skyColors[0])},bottom:{value:new T.Color(skyColors[1])}},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v;uniform vec3 top;uniform vec3 bottom;void main(){gl_FragColor=vec4(mix(bottom,top,pow(max(normalize(v).y,0.),.5)),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));group.add(sky);
  lakes=addLakes(group,{distance:plan.distance,night:weather.night});
  const airports=[airport(plan.from,0),airport(plan.to,-plan.distance)];group.userData.airports=airports;
  routeGuide=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({color:'#68d9ff',transparent:true,opacity:.85,depthWrite:false}),8);routeGuide.count=0;routeGuide.frustumCulled=false;group.add(routeGuide);
  let seed=plan.from.charCodeAt(0)*81+plan.to.charCodeAt(0);const random=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
  const trees=[];for(let i=0;i<1800;i++){const x=(random()-.5)*26000,z=5000-random()*(plan.distance+10000);if(Math.abs(x)<650)continue;trees.push({p:[x,9,z],s:[7+random()*8,8+random()*12,7+random()*8],color:random()>.5?'#416944':'#526f48'});}instanced(new T.IcosahedronGeometry(1,1),material('#4b6b45'),trees);
  const fields=[];for(let i=0;i<80;i++){const x=(random()-.5)*24000;if(Math.abs(x)<650)continue;fields.push({p:[x,0,5000-random()*(plan.distance+10000)],s:[500+random()*900,.1,700+random()*1300],color:['#8c9369','#a5a17a','#6f805e','#9a9e72'][i%4]});}instanced(new T.BoxGeometry(1,1,1),material('#8b9472'),fields);
  for(const [code,z] of [[plan.from,0],[plan.to,-plan.distance]]){
   const info=AIRPORTS[code],blocks=[];for(let i=0;i<180;i++){const x=1300+random()*4500,h=15+random()*(code==='JFK'||code==='HND'?200:70);blocks.push({p:[x,h/2,z+(random()-.5)*6000],s:[20+random()*60,h,25+random()*60],color:weather.night?'#334252':['#c0b9a8','#a8b1b0','#a3aa9b'][i%3]});}instanced(new T.BoxGeometry(1,1,1),material('#a6b0ad'),blocks);
   // Distinct skyline silhouettes for the destinations, built from light geometry.
   const stone=material('#b6b3a1');if(code==='WAW'){box(group,45,150,45,stone,2300,75,z-1000);box(group,20,70,20,stone,2300,185,z-1000);}
   if(code==='CDG'){const tower=new T.Mesh(new T.ConeGeometry(65,270,4,12,true),new T.MeshStandardMaterial({color:'#7f796b',wireframe:true}));tower.position.set(2200,135,z-1200);group.add(tower);}
   if(code==='LHR'){const wheel=new T.Mesh(new T.TorusGeometry(75,3,6,48),stone);wheel.position.set(2200,85,z-900);group.add(wheel);box(group,25,110,25,stone,2500,55,z-1100);}
   if(['HND','ICN','PEK','BOG'].includes(code)||info.biome==='mountains'){const hills=[];for(let i=0;i<12;i++)hills.push({p:[-6000-i*500,100,z-5000+i*900],s:[800+random()*500,650+random()*1000,1000+random()*700]});instanced(new T.ConeGeometry(1,1,7),material('#70836f'),hills);}
   if(info.biome==='coast'||info.biome==='river'){const mat=new T.MeshStandardMaterial({color:weather.night?'#173b50':'#4c93a4',roughness:.25,metalness:.28});const river=box(group,info.biome==='coast'?12000:500,.04,13000,mat,-(info.biome==='coast'?9000:2500),-.05,z-3500);water=river;}
  }
  // Three additional towns with connected streets and houses along the route.
  const roadMat=material('#5b666a'),roofMat=material('#a06a54'),wallMat=material('#d0c4a8'),windowsMat=new T.MeshStandardMaterial({color:weather.night?'#ffdc95':'#8faeba',emissive:weather.night?'#e4a75a':'#000000',emissiveIntensity:weather.night?1.3:0});
  const houses=[],roofs=[],roads=[],windows=[];
  for(let town=0;town<3;town++){
   const cx=town===1?-2200:2300,cz=-plan.distance*(.23+town*.23);
   roads.push({p:[cx,.16,cz],s:[3200,.12,18]});roads.push({p:[cx,.16,cz],s:[18,.12,2900]});
   for(let street=-3;street<=3;street++){roads.push({p:[cx+street*240,.16,cz],s:[12,.12,1600]});roads.push({p:[cx,.16,cz+street*210],s:[1900,.12,12]});}
   for(let x=-8;x<=8;x++)for(let z=-7;z<=7;z++){if(x%2===0||z%2===0)continue;const px=cx+x*105,pz=cz+z*90,h=6+random()*8;houses.push({p:[px,h/2,pz],s:[20+random()*12,h,22+random()*10],color:['#c6c4ac','#d7c2a0','#adbbb2','#cfb7a6'][Math.floor(random()*4)]});roofs.push({p:[px,h+1.5,pz],s:[24,4,28]});windows.push({p:[px,h*.65,pz+15],s:[12,2,.2]});}
   label(['NAD RZEKĄ','ZIELONE WZGÓRZA','PRZEDMIEŚCIA'][town],250,45,cx,55,cz-850);
  }
  // A main highway connects all three towns with the airport approach roads.
  roads.push({p:[2000,.15,-plan.distance*.5],s:[26,.12,plan.distance+4500]});roads.push({p:[1200,.15,1550],s:[2400,.12,22]});roads.push({p:[1200,.15,-plan.distance+1550],s:[2400,.12,22]});
  instanced(new T.BoxGeometry(1,1,1),roadMat,roads);instanced(new T.BoxGeometry(1,1,1),wallMat,houses);instanced(new T.BoxGeometry(1,1,1),roofMat,roofs);instanced(new T.BoxGeometry(1,1,1),windowsMat,windows);
  const cloudCanvas=document.createElement('canvas');cloudCanvas.width=256;cloudCanvas.height=128;const ctx=cloudCanvas.getContext('2d');for(const [x,y,r] of [[60,75,55],[125,50,55],[185,75,60]]){const gr=ctx.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,weather.rain?'rgba(200,210,215,.6)':'rgba(255,255,255,.68)');gr.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gr;ctx.fillRect(0,0,256,128);}const cloudTex=new T.CanvasTexture(cloudCanvas);
  for(let i=0;i<(weather.rain?65:35);i++){const c=new T.Sprite(new T.SpriteMaterial({map:cloudTex,transparent:true,opacity:weather.night?.25:.8,depthWrite:false}));c.position.set((random()-.5)*22000,weather.rain?1000+random()*600:1700+random()*1000,5000-random()*(plan.distance+12000));c.scale.set(2000+random()*1800,900,1);group.add(c);clouds.push(c);}
  if(weather.rain){const g=new T.BufferGeometry(),a=new Float32Array(1000*3);for(let i=0;i<a.length;i+=3){a[i]=(random()-.5)*350;a[i+1]=random()*180;a[i+2]=(random()-.5)*350;}g.setAttribute('position',new T.BufferAttribute(a,3));rain=new T.Points(g,new T.PointsMaterial({color:'#d3e6eb',size:.55,transparent:true,opacity:.45,depthWrite:false}));rain.frustumCulled=false;group.add(rain);}else rain=null;
  beacon=new T.Mesh(new T.SphereGeometry(.5,8,6),new T.MeshBasicMaterial({color:'#ff5450'}));group.add(beacon);
  return group;
 }
 function update(dt,flight,aircraft){time+=dt;lakes?.update(dt);for(const c of clouds)c.position.x+=dt*8;if(sky&&flight)sky.position.set(flight.x,0,flight.z);
  if(flight?.plan.mode==='free'&&terrain)for(const axis of ['x','z']){const offset=flight[axis]-terrain.position[axis];if(Math.abs(offset)>20000)terrain.position[axis]+=Math.round(offset/20000)*20000;}
  const onDeparture=!flight||['toService','boarding','prep','taxi','hold','lineup','takeoff'].includes(flight.stage),service=flight?.serviceActive,serviceProgress=flight?.serviceProgress||0,serviceZ=onDeparture?0:flight?.targetZ;
  for(const p of passengers){p.root.visible=!!service&&plan.job==='passengers'&&p.z===serviceZ;const t=(serviceProgress+p.index/18)%1;p.root.position.set(290-t*75,0,1245+(p.index%3)*2);}
  for(const v of vehicles){const working=service&&v.z===serviceZ;v.root.position.set(working&&plan.job==='cargo'?415+Math.sin(time*.6)*12:v.baseX+(working?Math.sin(time*.6)*12:0),0,working&&plan.job==='cargo'?790:v.baseZ);}
  for(const airport of group.userData.airports)for(const stand of airport.userData.stands){const active=flight&&['toService','boarding','taxiin','unloading'].includes(flight.stage)&&stand.job===plan.job&&airport.position.z===serviceZ;stand.fill.opacity=active?.15+Math.sin(time*2)*.035:.06;stand.arrow.visible=!!active;stand.arrow.position.y=23+Math.sin(time*2)*1.5;stand.sign.visible=!!flight&&!flight.airborne;if(flight){const distance=Math.hypot(flight.x-stand.x,flight.z-airport.position.z-stand.z),width=42+62*Math.min(1,distance/220);stand.sign.visible=stand.sign.visible&&distance<2000;stand.sign.scale.set(width,width*192/1024,1);}}
  for(const airport of group.userData.airports)for(const marker of airport.userData.departureMarkers){const visible=flight&&airport.userData.code===flight.plan.from&&(['taxi','hold'].includes(flight.stage)?marker.kind==='hold':['lineup','takeoff'].includes(flight.stage)&&marker.kind==='start');marker.sign.visible=marker.arrow.visible=!!visible;marker.arrow.position.y=23+Math.sin(time*2)*1.5;if(visible){const distance=Math.hypot(flight.x-marker.x,flight.z-marker.z),width=35+45*Math.min(1,distance/220);marker.sign.scale.set(width,width*192/1024,1);}}
  routeGuide.count=0;if(flight&&['taxi','lineup','taxiin'].includes(flight.stage)){const points=[flight,...flight.taxiPath.slice(flight.taxiIndex)];for(let i=1;i<points.length&&routeGuide.count<8;i++){const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.z-a.z);if(length<.1)continue;guideDummy.position.set((a.x+b.x)/2,.28,(a.z+b.z)/2);guideDummy.rotation.set(0,Math.atan2(b.x-a.x,b.z-a.z),0);guideDummy.scale.set(2.8,.025,length);guideDummy.updateMatrix();routeGuide.setMatrixAt(routeGuide.count++,guideDummy.matrix);}routeGuide.instanceMatrix.needsUpdate=true;}
  if(rain&&flight){rain.position.set(flight.x,flight.y-30,flight.z);const a=rain.geometry.attributes.position.array;for(let i=1;i<a.length;i+=3){a[i]-=dt*100;if(a[i]<0)a[i]=180;}rain.geometry.attributes.position.needsUpdate=true;}
  if(beacon&&aircraft){beacon.position.copy(aircraft.position);beacon.position.y+=5;beacon.visible=time%1.2<.12;}
  if(flight)for(const airport of group.userData.airports){const distance=Math.max(1,Math.abs(flight.z-airport.position.z)-1000),slope=Math.atan2(flight.y-7,distance)*180/Math.PI,red=slope<2.5?4:slope<2.8?3:slope<3.2?2:slope<3.6?1:0;airport.userData.papi.forEach((lamp,i)=>lamp.material.color.set(i<red?'#ed514d':'#fff0d6'));}
  for(const airport of group.userData.airports)airport.userData.traffic.forEach((jet,i)=>{const reserved=!!flight&&(airport.userData.code===flight.arrivedAirport&&i===flight.runwayIndex&&flight.landingClearance&&flight.elapsed<flight.reservedUntil||airport.userData.code===flight.plan.from&&i===0&&flight.elapsed<flight.departureReservedUntil),traffic=trafficState(airport.userData.code,flight?.elapsed??time,i,reserved);jet.visible=traffic.busy;if(jet.visible){const t=traffic.phase/26;jet.position.set(RUNWAY_X[i],7+Math.max(0,(.42-t)*500),2500-t*4200);jet.rotation.set(t<.42?-.035:0,0,0);}});
 }
 return {build,update,dispose,get root(){return group;}};
}
