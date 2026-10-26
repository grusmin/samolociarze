import fs from 'node:fs';
import * as T from './dist/three.module.js';
import {GLTFLoader} from './dist/vendor/GLTFLoader.js';
import {prepareAircraft} from './dist/fleet.js';
import {PLANES} from './dist/catalog.js';
globalThis.ProgressEvent=class{constructor(type,init){Object.assign(this,init)}};
const assert=(condition,message)=>{if(!condition)throw Error(message);};
for(const [type,{span,engines}] of Object.entries(PLANES)){
 const j=JSON.parse(fs.readFileSync(`dist/models/${type}.gltf`));
 for(const image of j.images)assert(fs.existsSync('dist/models/'+image.uri),'Missing texture '+image.uri);
 // Node checks the real vertex/index data; texture appearance is checked in a browser.
 delete j.images;delete j.textures;
 for(const m of j.materials){delete m.pbrMetallicRoughness.baseColorTexture;delete m.normalTexture;delete m.emissiveTexture;}
 for(const b of j.buffers)b.uri='data:application/octet-stream;base64,'+fs.readFileSync('dist/models/'+b.uri).toString('base64');
 const asset=await new GLTFLoader().parseAsync(JSON.stringify(j),'');
 const root=prepareAircraft(asset.scene,type),bounds=new T.Box3().setFromObject(root),size=bounds.getSize(new T.Vector3());
 assert(Math.abs(size.x-span)<1,'Aircraft wingspan is in metres: '+type);
 assert(Math.abs(bounds.min.y)<.1,'Wheels touch ground: '+type);
 let triangles=0,draws=0;root.traverse(o=>{if(o.isMesh){draws++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;assert([...o.geometry.attributes.position.array].every(Number.isFinite),'Finite vertices: '+type);}});
 assert(triangles>4000,'Detailed imported geometry: '+type);assert(draws<160,'Batched geometry for mobile: '+type);
 const engineNodes=j.nodes.filter(n=>type==='an225'?/^Engine-[LR][IMO]-Casing$/.test(n.name):type==='b747'?/^Blades(_\d+)?$/.test(n.name):/^fan_[1-4]$/.test(n.name));
 if(['a380','b747','an225'].includes(type))assert(engineNodes.length===engines,'Correct engine count: '+type);
 const gear=root.children[0];assert(gear.children.length>0,'Landing gear exists: '+type);
 console.log(`PASS: ${type}, ${engines} engines, ${Math.round(triangles)} triangles, ${draws} batches, wheels on ground`);
}
