import * as T from './three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {PLANES,GAME_VERSION} from './catalog.js';

const templates=new Map();
const specs=PLANES,pending=new Map();
function materialKey(m){
 const fields=['type','side','transparent','opacity','alphaTest','depthWrite','depthTest','blending','premultipliedAlpha','roughness','metalness','emissiveIntensity','normalMapType','aoMapIntensity','lightMapIntensity','wireframe','vertexColors','flatShading'];
 const maps=['map','alphaMap','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap','lightMap'];
 return [...fields.map(k=>m[k]),...maps.map(k=>m[k]?.uuid||''),m.color?.getHexString(),m.emissive?.getHexString(),m.normalScale?.toArray().join(',')].join('|');
}
export async function loadFleet(types=['a380','b747','an225']){
 const loader=new GLTFLoader();
 await Promise.all(types.map(async type=>{
  if(templates.has(type))return;if(pending.has(type))return pending.get(type);
  const task=(async()=>{
  const modelUrl=new URL(`./models/${type}.gltf`,import.meta.url);modelUrl.searchParams.set('v',GAME_VERSION);
  const asset=await loader.loadAsync(modelUrl.href);
  templates.set(type,prepareAircraft(asset.scene,type));
  })();pending.set(type,task);try{await task;}finally{pending.delete(type);}
 }));
}
export function prepareAircraft(imported,type){
 imported.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(imported),center=bounds.getCenter(new T.Vector3());
 const dy=type==='an225'?-7-bounds.min.y:-4.5-bounds.min.y;
 const transform=new T.Matrix4().makeTranslation(-center.x,dy,-center.z);
 const root=new T.Group(),gear=new T.Group();root.add(gear);
 root.userData.sharedFleet=true;root.userData.span=specs[type].span;
 const groups=new Map(),seen=new Set();
 imported.traverse(o=>{
  if(!o.isMesh)return;
  // FlightGear alternatives (closed doors, baked shadows) are not drawn together.
  if(/shadow|static_disc|CDoor|WheelWell/i.test(o.name))return;
  if(!['a380','b747','an225'].includes(type)&&/tire|tyre|gear|nlg|wlg/i.test(o.name))return;
  const geometry=o.geometry.clone();geometry.applyMatrix4(transform.clone().multiply(o.matrixWorld));
  geometry.computeBoundingBox();const b=geometry.boundingBox;
  let indexHash=0;for(const n of geometry.index?.array||[])indexHash=(Math.imul(indexHash,31)+n)|0;
  const signature=[...b.min.toArray(),...b.max.toArray(),geometry.attributes.position.count,geometry.index?.count||0,indexHash].map(n=>Number(n).toFixed(4)).join(',');
  if(type==='a380'&&seen.has(signature)){geometry.dispose();return;}seen.add(signature);
  const isGear=type==='an225'&&/^[LR]-(MG|NG)-/.test(o.name);
  const material=o.material.clone();
  material.roughness=/glass|wind|window/i.test(o.name)? .16:.42;
  material.metalness=/chrome|rim|hub|strut/i.test(o.name)? .65:.08;
  material.envMapIntensity=.7;
  if(material.map)material.map.anisotropy=4;
  if(/glass|wind|window/i.test(o.name)&&!material.map){material.color.set('#263f4a');material.transparent=false;material.opacity=1;}
  // Imported files often repeat identical materials. Combining only visually
  // identical surfaces keeps the original textures while reducing draw calls.
  const key=(isGear?'gear:':'body:')+materialKey(material);
  if(!groups.has(key))groups.set(key,{material,geometries:[],parent:isGear?gear:root});else material.dispose();
  const g=geometry.index?geometry.toNonIndexed():geometry;
  for(const attr of Object.keys(g.attributes))if(!['position','normal','uv'].includes(attr))g.deleteAttribute(attr);
  if(!g.attributes.normal)g.computeVertexNormals();
  if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
  groups.get(key).geometries.push(g);
 });
 for(const group of groups.values()){
  const geometry=mergeGeometries(group.geometries,false),mesh=new T.Mesh(geometry,group.material);
  mesh.castShadow=true;mesh.receiveShadow=true;group.parent.add(mesh);
  group.geometries.forEach(g=>g.dispose());
 }
 if(type!=='an225')addGear(gear,type);
 root.position.set(0,7,380);
 // Particle origins are in the same local coordinates as the normalized aircraft.
 const engine=type==='a380'?[-25.5,2.6+dy,9.4-center.z]:type==='b747'?[-21.2,-2+dy,9.94-center.z]:type==='an225'?[-24.8,.41+dy,9.9-center.z]:type==='conc'?[-5.9,-3.3,11]:[-specs[type].span*.2,-3.3,-specs[type].length*.04];
 root.userData.engineSmoke=engine;
 root.userData.brakeWheels=type==='conc'?[[-3.2,-6.65,7.8],[3.2,-6.65,7.8]]:type==='an225'?[[-4,-6.65,4],[4,-6.65,4]]:[[-4.3,-6.65,3],[4.3,-6.65,3]];
 return root;
}
function addGear(parent,type){
 const rubber=new T.MeshStandardMaterial({color:'#171b20',roughness:.86}),metal=new T.MeshStandardMaterial({color:'#a2a9ad',metalness:.7,roughness:.3});
 const make=(geometry,mat,x,y,z)=>{const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;};
 const units=type==='conc'?[[-3.2,7.8,2],[3.2,7.8,2],[0,-23.4,1]]:type==='a380'?[[-4.4,1,2],[4.4,1,2],[-2,7,3],[2,7,3],[0,-28,1]]:type==='b747'?[[-4.2,1,2],[4.2,1,2],[-1.5,5,2],[1.5,5,2],[0,-26,1]]:[[-specs[type].span*.07,3,type==='b772'?3:specs[type].span>40?2:1],[specs[type].span*.07,3,type==='b772'?3:specs[type].span>40?2:1],[0,-specs[type].length*.34,1]];
 for(const [x,z,rows] of units){make(new T.CylinderGeometry(.14,.17,2.5,12),metal,x,-5.15,z);for(let row=0;row<rows;row++)for(const s of [-1,1]){const zz=z+(row-(rows-1)/2)*1.2;const tyre=make(new T.CylinderGeometry(.63,.63,.45,20),rubber,x+s*.45,-6.37,zz);tyre.rotation.z=Math.PI/2;const hub=make(new T.CylinderGeometry(.31,.31,.46,16),metal,x+s*.46,-6.37,zz);hub.rotation.z=Math.PI/2;}}
 const parts=[...parent.children],batches=new Map();
 for(const part of parts){part.updateMatrix();const g=part.geometry.clone().applyMatrix4(part.matrix);if(!batches.has(part.material))batches.set(part.material,[]);batches.get(part.material).push(g);parent.remove(part);part.geometry.dispose();}
 for(const [mat,geometries] of batches){const mesh=new T.Mesh(mergeGeometries(geometries,false),mat);mesh.castShadow=true;parent.add(mesh);geometries.forEach(g=>g.dispose());}
}
export function fleetAircraft(type){
 const template=templates.get(type);if(!template)throw Error('Brak modelu '+type);
 const root=template.clone(true);return {root,gear:[root.children[0]],fans:[]};
}
