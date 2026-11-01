import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from './dist/three.module.js';
import {REGION_LANDMARKS,REGION_BOUNDS,LAKE_OUTLINE,REGION_ROADS,INTERCHANGE_RAMPS} from './dist/region-layout.js';
import {addLocalRegion} from './dist/local-region.js';
import {HOME_LANDMARK,inNeighborhood} from './dist/neighborhood.js';
import {disposeScenery} from './dist/scene-resources.js';

globalThis.document={createElement(){return {width:0,height:0,getContext(){return new Proxy({fillStyle:''},{get(t,k){return k in t?t[k]:(()=>{});},set(t,k,v){t[k]=v;return true;}});}};}};
const area=Math.abs(T.ShapeUtils.area(LAKE_OUTLINE.map(p=>new T.Vector2(...p))));
assert(area>4e6&&area<7e6,'A large reservoir, rather than a small pond');
assert(Math.max(...LAKE_OUTLINE.map(p=>p[1]))-Math.min(...LAKE_OUTLINE.map(p=>p[1]))>4500);
assert(REGION_LANDMARKS.school.z< -1000&&REGION_LANDMARKS.lake.x>500,'School north, lake east/south of the village');
for(const id of ['s1','dk86','dk91','zachodnia','local-home'])assert(REGION_ROADS.some(r=>r.id===id));
assert(INTERCHANGE_RAMPS.length>=4);
const main=REGION_ROADS.filter(r=>r.divided);assert.equal(main.length,2);
for(const r of REGION_ROADS){assert(r.points.length>=2);for(const p of r.points)assert(p.every(Number.isFinite));}
assert(HOME_LANDMARK.x+REGION_BOUNDS.maxX< -440,'Mapped region leaves the runways and airfield fence clear');
assert(inNeighborhood(HOME_LANDMARK.x+REGION_LANDMARKS.school.x,HOME_LANDMARK.z+REGION_LANDMARKS.school.z));
for(const night of [false,true]){
 const scene=new T.Group(),region=addLocalRegion(scene,{night});scene.updateMatrixWorld(true);
 const school=region.root.userData.school;assert(school.userData.features.includes('three-storey-white-building'));assert(school.userData.features.includes('multisport-court'));
 const bounds=new T.Box3().setFromObject(school),size=bounds.getSize(new T.Vector3());assert(size.y>=11&&size.y<=14&&size.x>70&&size.z>60);const court=school.localToWorld(new T.Vector3(-60,.3,-3)),ray=new T.Raycaster(new T.Vector3(court.x,80,court.z),new T.Vector3(0,-1,0));assert.equal(ray.intersectObject(region.root,true)[0]?.object.material.color.getHexString(),'cd9c57','Sport court remains above grass and surrounding terrain');
 let water;region.root.traverse(o=>{if(o.name==='Pogoria IV')water=o;});assert(water?.isMesh&&water.geometry.attributes.position.count>100);
 const before=water.material.normalMap.offset.x;region.update(1);assert(water.material.normalMap.offset.x>before,'Animated water in day and night');
 let disposed=false;water.geometry.addEventListener('dispose',()=>disposed=true);disposeScenery(region.root);assert(disposed);
}
for(const page of ['dist/index.html','dist/career.html']){const html=fs.readFileSync(page,'utf8');for(const label of ['Jezioro Pogoria IV','Szkoła','Drogi i węzeł'])assert(html.includes(label));}
const app=fs.readFileSync('dist/app.js','utf8');assert(app.includes('region:8,lake:11,school:12,junction:13'));assert(app.includes('inspectionView!==inspectionState'),'Quality and shadows update when changing landmark cameras');
console.log(`PASS: ${(area/1e6).toFixed(2)} km² elongated lake, northern school with sports court, DK86/S1/DK91, interchange ramps, finite geometry, animated water, cleanup, clear airfield and landmark navigation`);
