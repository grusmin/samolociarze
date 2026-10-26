import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from './dist/three.module.js';
import {GLTFLoader} from './dist/vendor/GLTFLoader.js';
import {prepareAircraft} from './dist/fleet.js';
import {addAirportFleet,AIRPORT_FLEET_TYPES} from './dist/airport-fleet.js';
import {disposeScenery} from './dist/scene-resources.js';
globalThis.ProgressEvent=class{constructor(type,init){Object.assign(this,init)}};
const templates=new Map(),geometries=new Set(),materials=new Set();
for(const type of AIRPORT_FLEET_TYPES){
 const json=JSON.parse(fs.readFileSync(`dist/models/${type}.gltf`));delete json.images;delete json.textures;
 for(const m of json.materials){delete m.pbrMetallicRoughness.baseColorTexture;delete m.normalTexture;delete m.emissiveTexture;}
 for(const b of json.buffers)b.uri='data:application/octet-stream;base64,'+fs.readFileSync('dist/models/'+b.uri).toString('base64');
 const asset=await new GLTFLoader().parseAsync(JSON.stringify(json),'');
 const root=prepareAircraft(asset.scene,type);templates.set(type,root);root.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);materials.add(o.material);}});
}
const makeAircraft=type=>{const root=templates.get(type).clone(true);return {root,gear:[root.children[0]]};};
const scenery=new T.Group();let count=0;
for(const z of [0,-23000]){
 const airport=new T.Group();airport.position.z=z;scenery.add(airport);
 const fleet=addAirportFleet(airport,makeAircraft);assert.equal(fleet.parked.length,2);assert.equal(fleet.traffic.length,2);
 for(const jet of [...fleet.parked,...fleet.traffic]){
  assert(jet.userData.sharedFleet);assert(AIRPORT_FLEET_TYPES.includes(jet.userData.type));assert.equal(jet.scale.x,1,'Other planes retain their real metre scale');
  assert(jet.children[0].visible,'Other planes have landing gear');let triangles=0,batches=0;
  jet.traverse(o=>{if(o.isMesh){assert(geometries.has(o.geometry),'Uses the detailed imported aircraft, sharing geometry');triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;batches++;}});
  assert(triangles>20000,'Detailed exterior geometry');assert(batches<25,'Batched for phones');
  const bounds=new T.Box3().setFromObject(jet);assert(Math.abs(bounds.min.y)<.1,'NPC wheels touch ground');count++;
 }
}
let sharedDisposals=0;for(const resource of [...geometries,...materials])resource.addEventListener('dispose',()=>sharedDisposals++);
const sharedTexture=new T.Texture();sharedTexture.addEventListener('dispose',()=>sharedDisposals++);[...materials][0].map=sharedTexture;
const geometry=new T.BoxGeometry(),texture=new T.Texture(),material=new T.MeshStandardMaterial({map:texture});let sceneryDisposals=0;
for(const resource of [geometry,material,texture])resource.addEventListener('dispose',()=>sceneryDisposals++);scenery.add(new T.Mesh(geometry,material));
disposeScenery(scenery);assert.equal(sharedDisposals,0,'Rebuilding scenery must preserve shared player/NPC GPU resources');assert.equal(sceneryDisposals,3,'Scenery resources are released');
console.log(`PASS: ${count} real-scale detailed 737/A320 aircraft across both airports, landing gear, shared geometry, phone batch budget and safe scenery cleanup`);
