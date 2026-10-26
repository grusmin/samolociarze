import * as THREE from './three.module.js';
export function tailPaint(isA){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.fillStyle=isA?'#f9faf8':'#169fce';ctx.fillRect(0,0,512,512);if(isA){for(const [i,color] of ['#008552','#f7f8f7','#192126'].entries()){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(90+i*95,0);ctx.lineTo(185+i*95,0);ctx.lineTo(410+i*95,512);ctx.lineTo(315+i*95,512);ctx.closePath();ctx.fill();}ctx.fillStyle='#d21e32';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(115,0);ctx.lineTo(345,512);ctx.lineTo(0,512);ctx.closePath();ctx.fill();}else{ctx.fillStyle='white';ctx.font='bold 110px Arial';ctx.textAlign='center';ctx.fillText('KLM',265,245);for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(200+i*42,125,13,0,Math.PI*2);ctx.fill();}ctx.fillRect(192,146,146,16);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshStandardMaterial({map:t,roughness:.35,metalness:.1});}
export function surface(kind){
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');let seed=417;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 ctx.fillStyle=kind==='grass'?'#829066':kind==='asphalt'?'#363a3d':'#969b96';ctx.fillRect(0,0,512,512);
 for(let i=0;i<23000;i++){const v=Math.floor(random()*65);ctx.fillStyle=kind==='grass'?`rgba(${70+v},${80+v},${38+v/2},.28)`:`rgba(${100+v},${100+v},${100+v},.13)`;ctx.fillRect(random()*512,random()*512,1+random()*3,1+random()*3);}
 if(kind==='concrete'){ctx.strokeStyle='#747c77';ctx.lineWidth=2;for(let i=0;i<=512;i+=128){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,512);ctx.moveTo(0,i);ctx.lineTo(512,i);ctx.stroke();}}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
export function upgradeScenery(scene,terrain,asphalt,concrete){
 const grass=surface('grass');grass.repeat.set(1100,1100);terrain.material.map=grass;terrain.material.color.set('#eef0d8');terrain.material.roughness=1;
 const road=surface('asphalt');road.repeat.set(3,65);asphalt.map=road;asphalt.color.set('#b5b8b9');asphalt.roughness=.94;
 const apron=surface('concrete');apron.repeat.set(12,22);concrete.map=apron;concrete.color.set('#e0ded4');
 const sky=new THREE.Mesh(new THREE.SphereGeometry(41000,32,20),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color('#236bb0')},bottom:{value:new THREE.Color('#c4dff2')}},vertexShader:'varying vec3 vPos; void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top; uniform vec3 bottom; varying vec3 vPos;void main(){float h=normalize(vPos).y;gl_FragColor=vec4(mix(bottom,top,pow(max(h,0.),.45)),1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));sky.material.fragmentShader=sky.material.fragmentShader.replace(';#include',';\n#include');sky.renderOrder=-10;scene.add(sky);
 const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');
 const puffs=[[110,150,82],[190,115,91],[270,125,100],[365,160,90],[240,175,94]];for(const [x,y,r] of puffs){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(255,255,255,.65)');g.addColorStop(.5,'rgba(250,253,255,.42)');g.addColorStop(1,'rgba(230,242,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,512,256);}const cloud=new THREE.CanvasTexture(c);cloud.colorSpace=THREE.SRGBColorSpace;
 for(let i=0;i<44;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:cloud,transparent:true,opacity:.7,depthWrite:false,fog:true}));s.position.set(Math.sin(i*24.71)*15000,1700+(i%5)*220,-25000+(i*1697)%32000);s.scale.set(1900+(i%4)*300,750+(i%3)*130,1);scene.add(s);}
 let seed=891;const rand=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
 // Broadleaf trees share geometry and one draw call, keeping phone rendering light.
 const trees=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:'#3f5837',roughness:1}),1800);const dummy=new THREE.Object3D();let count=0;
 for(let i=0;i<1800;i++){const x=(rand()-.5)*15000,z=(rand()-.75)*30000;if(Math.abs(x)<260||x>100&&x<720&&(Math.abs(z+650)<1000||Math.abs(z+18250)<1000))continue;dummy.position.set(x,7+rand()*8,z);dummy.scale.set(9+rand()*9,10+rand()*13,9+rand()*9);dummy.rotation.set(rand(),rand()*6,rand());dummy.updateMatrix();trees.setMatrixAt(count,dummy.matrix);trees.setColorAt(count,new THREE.Color().setHSL(.23+rand()*.06,.2+rand()*.16,.39+rand()*.12));count++;}trees.count=count;scene.add(trees);
 const dark=new THREE.MeshStandardMaterial({color:'#202a30',roughness:.95});const silver=new THREE.MeshStandardMaterial({color:'#adb4b5',metalness:.5,roughness:.42});const glass=new THREE.MeshStandardMaterial({color:'#41606b',metalness:.6,roughness:.22});
 const box=(w,h,d,m,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);b.receiveShadow=true;scene.add(b);return b;};
 for(const z of [-900,-18500]){
  // Terminal mullions, jet bridges, apron stands and airport service vehicles.
  for(let i=0;i<32;i++)box(.6,8,106,silver,266+i*10,14,z+200);
  for(let i=0;i<7;i++){const x=300+i*38;box(12,3,77,glass,x,7,z+290);box(12,1,82,silver,x,9,z+290);box(10,1,12,dark,x,4,z+334);box(1,6,1,silver,x,3,z+320);}
  for(let i=0;i<8;i++){const pole=box(.8,27,.8,silver,200+(i%2)*460,13.5,z-300+Math.floor(i/2)*290);box(12,.6,3,silver,pole.position.x,27,pole.position.z);}
  for(let i=0;i<10;i++){const x=245+(i%5)*43,zz=z+380+Math.floor(i/5)*70;box(3,2,7,silver,x,1.6,zz);box(2.7,1.3,2,glass,x,2.1,zz-2);for(const side of [-1,1])box(.5,.8,5,dark,x+side*1.6,.6,zz);}
  const yellow=new THREE.MeshBasicMaterial({color:'#d5ba58'});box(1,.03,3000,yellow,160,.18,z);for(let i=0;i<6;i++){box(200,.03,.6,yellow,315,.19,z+380+i*60);}
  // Touchdown rubber deposits taper into the runway.
  const skidCanvas=document.createElement('canvas');skidCanvas.width=128;skidCanvas.height=512;const sc=skidCanvas.getContext('2d');for(let i=0;i<180;i++){sc.fillStyle=`rgba(5,8,12,${rand()*.065})`;sc.fillRect(28+rand()*72,rand()*340,1+rand()*4,80+rand()*110);}const skidTexture=new THREE.CanvasTexture(skidCanvas);const skid=new THREE.Mesh(new THREE.PlaneGeometry(34,650),new THREE.MeshBasicMaterial({map:skidTexture,transparent:true,depthWrite:false}));skid.rotation.x=-Math.PI/2;skid.position.set(0,.26,z+1050);scene.add(skid);
 }
}
