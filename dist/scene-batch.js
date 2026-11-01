import * as T from './three.module.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
export function geometryBatch(parent){
 const buckets=new Map(),dummy=new T.Object3D();
 function add(g,m,x,y,z,rx=0,ry=0,rz=0){
  dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(1,1,1);dummy.updateMatrix();g.applyMatrix4(dummy.matrix);
  if(!g.attributes.normal)g.computeVertexNormals();if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
  if(!buckets.has(m))buckets.set(m,[]);buckets.get(m).push(g.index?g.toNonIndexed():g);if(g.index)g.dispose();
 }
 const box=(w,h,d,m,x,y,z,rx=0,ry=0,rz=0)=>add(new T.BoxGeometry(w,h,d),m,x,y,z,rx,ry,rz);
 function beam(a,b,r,m){const direction=new T.Vector3(...b).sub(new T.Vector3(...a)),g=new T.CylinderGeometry(r,r,direction.length(),5);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize()));add(g,m,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);}
 function face(points,m,holes=[]){const shape=new T.Shape();points.forEach((p,i)=>i?shape.lineTo(p[0],p[1]):shape.moveTo(p[0],p[1]));shape.closePath();for(const hole of holes){const path=new T.Path();hole.forEach((p,i)=>i?path.lineTo(p[0],p[1]):path.moveTo(p[0],p[1]));path.closePath();shape.holes.push(path);}const g=new T.ShapeGeometry(shape);for(let i=0;i<g.attributes.uv.count;i++)g.attributes.uv.setXY(i,g.attributes.position.getX(i)*.65,g.attributes.position.getY(i)*.65);add(g,m,0,0,points[0][2]);}
 function finish(){for(const [m,parts] of buckets){const g=mergeGeometries(parts,false),mesh=new T.Mesh(g,m);g.computeBoundingSphere();mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);parts.forEach(p=>p.dispose());}}
 return {add,box,beam,face,finish};
}
export const sceneMaterial=(color,roughness=.8,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
