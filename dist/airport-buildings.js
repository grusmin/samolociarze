import * as T from './three.module.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

// Architectural pieces are baked by material: detailed buildings without hundreds of draw calls.
export function addAirportBuildings(parent,{code,city,night=false}){
 const root=new T.Group();root.name='airport-buildings-3d';parent.add(root);
 const buckets=new Map(),dummy=new T.Object3D();
 const mat=(color,metalness=0,roughness=.8)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const white=mat('#e2e5e1',.18,.52),steel=mat('#87999f',.65,.32),concrete=mat('#b6b6a9'),dark=mat('#26363d'),rubber=mat('#17232a'),yellow=mat('#dbb650');
 const accent=mat(['#b76b50','#3c7f92','#7f8892'][code.charCodeAt(0)%3],.2,.55);
 const glass=mat(night?'#526e79':'#416975',.65,.2);glass.emissive.set(night?'#e2b777':'#0b2330');glass.emissiveIntensity=night?.45:.06;
 const lamp=mat('#f9edd1');lamp.emissive.set('#ffd894');lamp.emissiveIntensity=night?2.5:.2;
 function add(geometry,material,x,y,z,rx=0,ry=0,rz=0){
  dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(1,1,1);dummy.updateMatrix();geometry.applyMatrix4(dummy.matrix);
  if(!geometry.attributes.normal)geometry.computeVertexNormals();
  if(!geometry.attributes.uv)geometry.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*2),2));
  if(!buckets.has(material))buckets.set(material,[]);buckets.get(material).push(geometry.index?geometry.toNonIndexed():geometry);if(geometry.index)geometry.dispose();
 }
 const box=(w,h,d,m,x,y,z,rx=0,ry=0,rz=0)=>add(new T.BoxGeometry(w,h,d),m,x,y,z,rx,ry,rz);
 const cylinder=(rt,rb,h,m,x,y,z,rx=0,ry=0,rz=0,sides=10)=>add(new T.CylinderGeometry(rt,rb,h,sides),m,x,y,z,rx,ry,rz);
 function beam(a,b,r=.25,m=steel){
  const direction=new T.Vector3(...b).sub(new T.Vector3(...a)),length=direction.length();
  const geometry=new T.CylinderGeometry(r,r,length,6);geometry.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize()));
  add(geometry,m,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);
 }
 function roof(cx,cz,width,depth,y,rise){
  const positions=[],uv=[],indices=[],segments=12;
  for(let i=0;i<=segments;i++){const t=i/segments,x=cx-width/2+t*width,yy=y+Math.sin(t*Math.PI)*rise;positions.push(x,yy,cz-depth/2,x,yy,cz+depth/2);uv.push(t,0,t,1);}
  for(let i=0;i<segments;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  add(geometry,white,0,0,0);
  for(const zz of [cz-depth/2,cz+depth/2])for(let i=0;i<segments;i++){
   const a=i/segments,b=(i+1)/segments;beam([cx-width/2+a*width,y+Math.sin(a*Math.PI)*rise-.3,zz],[cx-width/2+b*width,y+Math.sin(b*Math.PI)*rise-.3,zz],.35);
  }
 }
 function sign(text,w,h,x,y,z,rotation=0){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#193d4b';ctx.fillRect(0,0,1024,128);ctx.fillStyle='#f2e9ce';ctx.font='bold 64px system-ui';ctx.textAlign='center';ctx.fillText(text,512,88);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));mesh.position.set(x,y,z);mesh.rotation.y=rotation;root.add(mesh);
 }

 // A two-storey hall, recessed curtain wall, columns, deep canopies and barrel roofs.
 box(300,3,108,concrete,370,1.5,1450);box(298,3,107,white,370,13,1450);
 box(298,9,1.2,glass,370,7.5,1396);box(298,9,1.2,glass,370,19.5,1396);
 box(298,18,1.2,glass,370,12,1504);box(2,21,108,white,221,12,1450);box(2,21,108,white,519,12,1450);
 for(let i=0;i<=20;i++){const x=220+i*15;box(.55,22,2,steel,x,13,1394);box(.55,22,2,steel,x,13,1506);cylinder(.38,.48,25,steel,x,12.5,1389);}
 for(const y of [4,10,16,22]){box(300,.32,1.8,steel,370,y,1394);box(300,.32,1.8,steel,370,y,1506);}
 for(let bay=0;bay<10;bay++)roof(235+bay*30,1450,30,122,24,7);
 box(318,.65,14,white,370,12.7,1385);box(308,.5,15,white,370,5.3,1510);
 box(85,3,18,accent,370,3,1512);box(70,7,1,glass,370,6.5,1521.1);box(92,.6,23,white,370,10,1515);
 for(const x of [331,409])cylinder(.45,.5,10,steel,x,5,1523);
 sign(code+' · '+city.toUpperCase(),180,13,370,19,1392,Math.PI);

 // Enclosed jet bridges, articulated cabins, support legs and realistic small wheels.
 for(let gate=0;gate<4;gate++){
  const x=272+gate*55;
  box(8,1,72,white,x,7.4,1359);box(8,.7,74,white,x,11.2,1359);box(.18,3.2,70,glass,x-4,9.3,1359);box(.18,3.2,70,glass,x+4,9.3,1359);
  for(let part=0;part<7;part++){const z=1326+part*10;box(.3,4,1,steel,x-4,9.3,z);box(.3,4,1,steel,x+4,9.3,z);}
  box(9,5,10,accent,x,8.5,1320);box(7,3,1,glass,x,9,1314.8);box(10,.5,11,white,x,11.3,1320);
  for(const dx of [-2.7,2.7]){cylinder(.22,.3,7,steel,x+dx,3.5,1325);cylinder(.6,.6,.4,rubber,x+dx,.65,1325,0,0,Math.PI/2);}
  sign('GATE '+(gate+1),9,2.5,x,13,1314.5,Math.PI);
 }

 // Tapered octagonal control tower with overhanging observation cabin and antennae.
 cylinder(6,10,49,concrete,470,24.5,800,0,Math.PI/8,0,8);
 cylinder(18,13,5,steel,470,50,800,0,Math.PI/8,0,8);cylinder(17,17,9,glass,470,56,800,0,Math.PI/8,0,8);
 cylinder(20,20,1.3,white,470,61,800,0,Math.PI/8,0,8);add(new T.ConeGeometry(21,4,8),white,470,63.5,800,0,Math.PI/8);
 for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/8;cylinder(.22,.22,10,steel,470+Math.cos(a)*17,55.5,800+Math.sin(a)*17);}
 cylinder(.18,.35,12,steel,470,70,800);add(new T.SphereGeometry(.5,8,6),lamp,470,76.3,800);
 for(const dx of [-7,7])cylinder(.12,.12,6,steel,470+dx,67,800);

 // Hollow maintenance hangars: real doorway depth, roof arches and roof skylights.
 for(let index=0;index<2;index++){
  const z=-350-index*180;
  box(132,.2,100,concrete,500,.2,z);box(3,27,96,white,435,13.5,z);box(3,27,96,white,565,13.5,z);box(130,27,2,white,500,13.5,z-48);
  box(130,5,3,accent,500,25,z+47);box(12,22,4,steel,440,11,z+46);box(12,22,4,steel,560,11,z+46);
  box(105,20,.5,dark,500,10,z-46.5);roof(500,z,136,104,27,12);
  for(let rib=0;rib<12;rib++)box(.6,24,.6,steel,439+rib*11,12,z-46);
  for(const x of [465,500,535])box(12,.25,42,glass,x,37,z);
  sign('HANGAR '+(index+1),85,8,500,25,z+49);
 }

 // Cargo docks with inset roller doors, bumpers, pallets and roof monitors.
 box(160,24,100,white,550,12,700);box(164,.6,104,steel,550,24.5,700);
 for(let door=0;door<4;door++){
  const z=665+door*23;box(.8,17,17,dark,469.2,8.5,z);box(2,2,19,concrete,467,1,z);
  for(let slat=0;slat<14;slat++)box(1,.18,16,steel,468.5,2+slat, z);
  for(const dz of [-9,9])box(2,3,1.3,rubber,466,1.5,z+dz);
 }
 for(let i=0;i<4;i++){box(24,4,72,accent,490+i*39,27,700);box(20,.3,64,glass,490+i*39,29.2,700);}
 sign('CARGO · '+code,100,12,550,19,751);
 for(let i=0;i<10;i++){const x=435+i%3*8,z=760+Math.floor(i/3)*8;box(5,.35,5,steel,x,.5,z);box(4.6,3.8,4.6,i%2?accent:white,x,2.6,z);box(5,.15,.2,dark,x,3.2,z);}

 // Buses, fuel bowser, baggage carts and a raised belt loader, clear of the service stands.
 function wheel(x,y,z,r=.65){cylinder(r,r,.5,rubber,x,y,z,0,0,Math.PI/2);cylinder(r*.45,r*.45,.53,steel,x,y,z,0,0,Math.PI/2);}
 const bus={x:345,z:1165};box(4.2,2.8,12,white,bus.x,2.1,bus.z);box(4.25,1.25,10.2,glass,bus.x,3,bus.z);box(4.4,.25,12.3,accent,bus.x,3.85,bus.z);
 for(const x of [-2.2,2.2])for(const z of [-3.8,3.8])wheel(bus.x+x,.8,bus.z+z,.8);
 for(let i=0;i<7;i++)box(4.3,1.3,.2,white,bus.x,3,bus.z-4.5+i*1.5);
 const fuel={x:410,z:1000};box(4.3,.6,13,steel,fuel.x,1.2,fuel.z);box(4,3.2,3.2,yellow,fuel.x,2.5,fuel.z-5);box(4.05,1.1,2.8,glass,fuel.x,3.1,fuel.z-5);
 cylinder(1.8,1.8,8,white,fuel.x,3,fuel.z+1,Math.PI/2,0,0,12);
 for(const x of [-2.25,2.25])for(const z of [-4.5,3,5])wheel(fuel.x+x,.85,fuel.z+z,.85);
 for(let i=0;i<6;i++){const x=285+i*7,z=1195;box(3,.5,4,steel,x,1,z);box(2.7,1.7,3.5,i%2?yellow:accent,x,2,z);for(const dx of [-1.6,1.6])for(const dz of [-1.3,1.3])wheel(x+dx,.45,z+dz,.4);}
 box(2.4,.6,12,steel,303,2.7,1350,-.3);for(let i=0;i<10;i++)box(2.2,.08,.15,yellow,303,1.1+i*.34,1344.5+i*1.1);
 for(const dx of [-1.3,1.3])for(const dz of [-3.7,3.7])wheel(303+dx,.55,1350+dz,.5);

 // Landside parking and lights add depth when seen from above or across the apron.
 box(330,.12,100,dark,445,.12,1640);
 for(let row=0;row<2;row++)for(let i=0;i<18;i++){
  const x=292+i*17,z=1616+row*49;box(1.9,.9,4.5,i%3===0?accent:i%3===1?white:steel,x,.8,z);box(1.65,.65,2.25,glass,x,1.55,z);
  for(const dx of [-1,1])for(const dz of [-1.3,1.3])wheel(x+dx,.4,z+dz,.32);
  box(.14,.025,7,white,x-5,.22,z);box(.14,.025,7,white,x+5,.22,z);
 }
 for(let i=0;i<8;i++){const x=430+i%4*40,z=i<4?1090:600;cylinder(.23,.5,24,steel,x,12,z);box(10,.4,2,steel,x,24,z);box(9,.08,1.8,lamp,x,23.75,z);}

 for(const [material,parts] of buckets){
  const geometry=mergeGeometries(parts,false);const mesh=new T.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);parts.forEach(part=>part.dispose());
 }
 root.userData.terminal={x:370,z:1450,width:300,depth:108};root.userData.features=['vaulted-terminal','jet-bridges','control-tower','open-hangars','cargo-docks','service-vehicles','parking'];
 return root;
}
