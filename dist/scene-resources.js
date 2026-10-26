// Fleet clones share their GPU assets with the player's aircraft and hangar.
// Only scenery-owned resources are released when rebuilding an airport.
export function disposeScenery(root){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 function visit(o){
  if(o.userData?.sharedFleet)return;
  if(o.geometry)geometries.add(o.geometry);
  for(const m of o.material?Array.isArray(o.material)?o.material:[o.material]:[]){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}
  for(const child of o.children||[])visit(child);
 }
 visit(root);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
}
