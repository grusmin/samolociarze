import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from './dist/three.module.js';
import {createHome,addNeighborhood,HOME_LANDMARK,inNeighborhood} from './dist/neighborhood.js';
import {disposeScenery} from './dist/scene-resources.js';

globalThis.document={createElement(){return {width:0,height:0,getContext(){return new Proxy({fillStyle:''},{get(t,k){return k in t?t[k]:(()=>{});},set(t,k,v){t[k]=v;return true;}});}};}};
for(const night of [false,true]){
 const scene=new T.Group(),neighborhood=addNeighborhood(scene,{night});scene.updateMatrixWorld(true);
 let draws=0,triangles=0;
 neighborhood.traverse(o=>{if(!o.geometry)return;draws++;const p=o.geometry.attributes.position;for(const v of p.array)assert(Number.isFinite(v));assert(o.geometry.boundingSphere===null||Number.isFinite(o.geometry.boundingSphere.radius));triangles+=(o.geometry.index?.count??p.count)/3*(o.isInstancedMesh?o.count:1);});
 assert(draws<45,'Bounded geometry batches for mobile rendering');assert(triangles<60000);
 assert.equal(neighborhood.position.x,HOME_LANDMARK.x);assert(inNeighborhood(HOME_LANDMARK.x,HOME_LANDMARK.z));assert(!inNeighborhood(0,0));
 const house=neighborhood.userData.house;const ray=new T.Raycaster(new T.Vector3(HOME_LANDMARK.x+8.4,2,HOME_LANDMARK.z+20),new T.Vector3(0,0,-1));const glazing=ray.intersectObject(house,true).find(hit=>hit.point.z<HOME_LANDMARK.z+3);assert(glazing?.object.material.transparent,'Tall facade is glazed, with an opening behind it');const entryRay=new T.Raycaster(new T.Vector3(HOME_LANDMARK.x+.7,1.5,HOME_LANDMARK.z+10),new T.Vector3(0,0,-1));const entry=entryRay.intersectObject(house,true).find(hit=>hit.point.z<HOME_LANDMARK.z+3);assert(entry&&entry.point.z<HOME_LANDMARK.z+.1,'Recessed front door is visible, not blocked by the garage wall');const bounds=new T.Box3().setFromObject(house),size=bounds.getSize(new T.Vector3());
 assert(size.x>30&&size.x<40);assert(size.y>8&&size.y<10);assert(house.userData.features.includes('tall-asymmetric-glazing'));assert(house.userData.features.includes('garden-terrace'));
 // The entire neighborhood is outside the airfield fence and its service paths.
 const full=new T.Box3().setFromObject(neighborhood);assert(full.max.x< -440);
 let disposed=0;house.traverse(o=>o.geometry?.addEventListener('dispose',()=>disposed++));disposeScenery(neighborhood);assert(disposed>0);
 console.log(`PASS: ${night?'night':'day'} home and rural neighborhood, ${draws} draw calls, ${Math.round(triangles)} triangles, finite geometry, house proportions, airfield clearance and cleanup`);
}
const source=fs.readFileSync('dist/neighborhood.js','utf8');assert(!/https?:\/\/|\.jpg|\.jpeg|gmaps|google\.com|latitude|longitude/i.test(source),'No private photos, location URLs or external map services in the game model');
for(const page of ['dist/index.html','dist/career.html'])assert(fs.readFileSync(page,'utf8').includes('Dom i okolica'));
