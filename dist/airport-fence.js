import * as T from './three.module.js';

// Both runways, rear taxiway and approach lights stay inside the perimeter.
export const AIRPORT_PERIMETER={minX:-440,maxX:720,minZ:-1850,maxZ:2260,height:3.1,gateZ:1550,gateWidth:52};

export function addAirportFence(parent){
 const fence=new T.Group();fence.name='airport-perimeter';parent.add(fence);
 const {minX,maxX,minZ,maxZ,height,gateZ,gateWidth}=AIRPORT_PERIMETER;
 const spans=[[[minX,minZ],[maxX,minZ]],[[maxX,minZ],[maxX,gateZ-gateWidth/2]],[[maxX,gateZ+gateWidth/2],[maxX,maxZ]],[[maxX,maxZ],[minX,maxZ]],[[minX,maxZ],[minX,minZ]]];
 const metal=new T.MeshStandardMaterial({color:'#a9b6b7',metalness:.65,roughness:.45});
 const footings=new T.MeshStandardMaterial({color:'#a5aaa2',roughness:.95});
 const positions=[],uv=[],indices=[],posts=[],rails=[],bases=[],wires=[],seen=new Set();
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d');ctx.clearRect(0,0,256,256);ctx.strokeStyle='#bbc8c8';ctx.lineWidth=3;
 for(let n=-256;n<=512;n+=32){ctx.beginPath();ctx.moveTo(n,0);ctx.lineTo(n+256,256);ctx.moveTo(n,0);ctx.lineTo(n-256,256);ctx.stroke();}
 const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
 const netMaterial=new T.MeshStandardMaterial({map:texture,alphaTest:.32,side:T.DoubleSide,metalness:.4,roughness:.65,alphaToCoverage:true});
 for(const [a,b] of spans){
  const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),steps=Math.ceil(length/8),offset=positions.length/3;
  positions.push(a[0],.2,a[1],b[0],.2,b[1],b[0],height,b[1],a[0],height,a[1]);
  uv.push(0,0,length/2,0,length/2,(height-.2)/2,0,(height-.2)/2);indices.push(offset,offset+1,offset+2,offset,offset+2,offset+3);
  for(let i=0;i<=steps;i++){
   const x=a[0]+dx*i/steps,z=a[1]+dz*i/steps,key=x.toFixed(3)+','+z.toFixed(3);
   if(!seen.has(key)){posts.push({x,z});seen.add(key);}
   if(i<steps){const x2=a[0]+dx*(i+1)/steps,z2=a[1]+dz*(i+1)/steps;rails.push({x:(x+x2)/2,z:(z+z2)/2,length:length/steps,yaw:Math.atan2(dx,dz)});}
  }
  bases.push({x:(a[0]+b[0])/2,z:(a[1]+b[1])/2,length,yaw:Math.atan2(dx,dz)});
  for(const y of [height+.12,height+.32])wires.push(a[0],y,a[1],b[0],y,b[1]);
 }
 const net=new T.BufferGeometry();net.setAttribute('position',new T.Float32BufferAttribute(positions,3));net.setAttribute('uv',new T.Float32BufferAttribute(uv,2));net.setIndex(indices);net.computeVertexNormals();
 const mesh=new T.Mesh(net,netMaterial);mesh.name='chain-link';fence.add(mesh);
 const dummy=new T.Object3D();
 function instances(name,geometry,material,items,place){
  const batch=new T.InstancedMesh(geometry,material,items.length);batch.name=name;
  items.forEach((item,i)=>{dummy.position.set(0,0,0);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);place(item,dummy);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);});batch.computeBoundingSphere();fence.add(batch);return batch;
 }
 instances('fence-posts',new T.CylinderGeometry(.09,.12,1,7),metal,posts,(p,o)=>{o.position.set(p.x,(height+.4)/2,p.z);o.scale.y=height+.4;});
 instances('fence-rails',new T.BoxGeometry(1,1,1),metal,rails.flatMap(r=>[{...r,y:.45},{...r,y:height}]),(r,o)=>{o.position.set(r.x,r.y,r.z);o.rotation.y=r.yaw;o.scale.set(.09,.09,r.length);});
 instances('fence-footings',new T.BoxGeometry(1,1,1),footings,bases,(r,o)=>{o.position.set(r.x,.08,r.z);o.rotation.y=r.yaw;o.scale.set(.35,.16,r.length);});
 const wireGeometry=new T.BufferGeometry();wireGeometry.setAttribute('position',new T.Float32BufferAttribute(wires,3));fence.add(new T.LineSegments(wireGeometry,new T.LineBasicMaterial({color:'#91a3a6'})));
 // The existing access road crosses the east fence here; the whole opening is clear.
 const booth=new T.Group();booth.name='airport-gate';fence.add(booth);
 const box=(w,h,d,material,x,y,z)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),material);m.position.set(x,y,z);booth.add(m);return m;};
 const white=new T.MeshStandardMaterial({color:'#dce1da',roughness:.8}),glass=new T.MeshStandardMaterial({color:'#315b68',metalness:.35,roughness:.25}),red=new T.MeshStandardMaterial({color:'#bd5544',roughness:.6});
 box(8,3.6,7,white,maxX+12,1.8,gateZ-gateWidth/2-8);box(8.3,.3,7.3,metal,maxX+12,3.7,gateZ-gateWidth/2-8);box(8.05,1.3,7.05,glass,maxX+12,2.4,gateZ-gateWidth/2-8);
 for(const side of [-1,1]){box(.65,4,.65,white,maxX,2,gateZ+side*(gateWidth/2+.5));box(.7,.7,.7,red,maxX,3,gateZ+side*(gateWidth/2+.5));}
 fence.userData.perimeter={...AIRPORT_PERIMETER,postCount:posts.length};
 return fence;
}
