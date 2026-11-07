import * as T from './three.module.js';
import {mountainRanges,mountainHeight} from './terrain.js';
export function addMountains(parent,{distance,night=false}){
 const root=new T.Group();root.name='mountain-ranges';parent.add(root);const color=new T.Color();
 for(const range of mountainRanges(distance)){
  const g=new T.PlaneGeometry(range.rx*2,range.rz*2,96,128);g.rotateX(-Math.PI/2);const p=g.attributes.position,colors=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){const x=p.getX(i)+range.x,z=p.getZ(i)+range.z,y=mountainHeight(range,x,z);p.setXYZ(i,x,y-.12,z);const step=12,slope=Math.hypot(mountainHeight(range,x+step,z)-mountainHeight(range,x-step,z),mountainHeight(range,x,z+step)-mountainHeight(range,x,z-step))/(step*2),snow=y>range.height*.6+Math.sin(x*.006)*65; color.set(snow?'#dce6e8':slope>.42?'#7d8585':y>650?'#858878':'#5f7959');if(night)color.multiplyScalar(.65);color.multiplyScalar(.91+.09*Math.sin(x*.014+z*.009));color.toArray(colors,i*3);}
  g.setAttribute('color',new T.BufferAttribute(colors,3));g.computeVertexNormals();const mesh=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.95}));mesh.receiveShadow=true;root.add(mesh);
 }root.userData.ranges=mountainRanges(distance);return root;
}
