import * as T from './three.module.js';

export function addLakes(parent,{distance,night=false}){
 const root=new T.Group();root.name='lakes';parent.add(root);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#8080fa';ctx.fillRect(0,0,128,128);
 for(let i=0;i<64;i++){ctx.strokeStyle=`rgb(${116+i%17},${120+i%13},250)`;ctx.lineWidth=1+i%2;ctx.beginPath();ctx.moveTo(0,i*2);ctx.bezierCurveTo(35,i*2-5,82,i*2+5,128,i*2);ctx.stroke();}
 const normal=new T.CanvasTexture(canvas);normal.wrapS=normal.wrapT=T.RepeatWrapping;normal.repeat.set(24,24);
 const water=new T.MeshPhysicalMaterial({color:night?'#163e53':'#3a8293',roughness:.22,metalness:.45,clearcoat:.8,normalMap:normal,normalScale:new T.Vector2(.3,.3),envMapIntensity:1.3});
 const sand=new T.MeshStandardMaterial({color:'#a8a080',roughness:1}),stone=new T.MeshStandardMaterial({color:'#858f82',roughness:.95}),green=new T.MeshStandardMaterial({color:'#687c40',roughness:.95});
 const definitions=[{x:-1600,z:-2500,r:550,stretch:.72},{x:1100,z:-distance*.48,r:650,stretch:.85},{x:-1550,z:-distance+3400,r:580,stretch:.65}];
 const rocks=[],reeds=[];const segments=72;
 for(const [index,lake] of definitions.entries()){
  const outline=[];
  for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,r=lake.r*(1+.1*Math.sin(a*3+index)+.07*Math.cos(a*5-index));outline.push(new T.Vector2(Math.cos(a)*r,Math.sin(a)*r*lake.stretch));}
  const shape=new T.Shape(outline),surface=new T.Mesh(new T.ShapeGeometry(shape),water);surface.rotation.x=-Math.PI/2;surface.position.set(lake.x,.01,lake.z);root.add(surface);
  const shore=new T.Shape(outline.map(p=>p.clone().multiplyScalar(1.055)));shore.holes.push(new T.Path([...outline].reverse()));const bank=new T.Mesh(new T.ShapeGeometry(shore),sand);bank.rotation.x=-Math.PI/2;bank.position.set(lake.x,.035,lake.z);root.add(bank);
  for(let i=0;i<segments;i++){
   const p=outline[i];
   if(i%3===0)rocks.push({x:lake.x+p.x*1.035,z:lake.z-p.y*1.035,s:1.4+i%4});
   if(i%2===0)for(let j=0;j<5;j++)reeds.push({x:lake.x+p.x*(.995+j*.002)+Math.sin(j*9+i)*3,z:lake.z-p.y*(.995+j*.002)+Math.cos(j*7+i)*3,h:.9+(i+j)%4*.25});
  }
 }
 const dummy=new T.Object3D();
 const stones=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),stone,rocks.length);
 rocks.forEach((p,i)=>{dummy.position.set(p.x,.3,p.z);dummy.rotation.set(i*.3,i,0);dummy.scale.set(p.s,p.s*.5,p.s*.8);dummy.updateMatrix();stones.setMatrixAt(i,dummy.matrix);});stones.computeBoundingSphere();root.add(stones);
 const plants=new T.InstancedMesh(new T.CylinderGeometry(.045,.065,1,5),green,reeds.length);
 reeds.forEach((p,i)=>{dummy.position.set(p.x,p.h/2,p.z);dummy.rotation.set(.1*Math.sin(i),0,.1*Math.cos(i));dummy.scale.set(1,p.h,1);dummy.updateMatrix();plants.setMatrixAt(i,dummy.matrix);});plants.computeBoundingSphere();root.add(plants);
 root.userData.lakes=definitions;
 return {root,update(dt){normal.offset.x+=dt*.012;normal.offset.y+=dt*.007;}};
}
