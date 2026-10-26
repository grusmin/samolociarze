// Run npm install in model-sources, then node rebuild-fleet.cjs.
// Sources: Flightradar24 / FlightGear, GNU GPL v2; see README.md and LICENSE.
const fs=require('fs'),path=require('path'),pipeline=require('gltf-pipeline');
const out=path.join(__dirname,'../dist/models');
const ids=['b738','a320','a359','b772','b788','b763','a343','beluga'];
(async()=>{
  for(const id of ids){
    const source=fs.readFileSync(path.join(__dirname,id+'.glb'));
    const first=await pipeline.glbToGltf(source);
    const result=await pipeline.processGltf(first.gltf,{separate:true,name:id,resourceDirectory:__dirname});
    const names=new Map(Object.keys(result.separateResources).map(name=>[name,id+'__'+path.basename(name)]));
    for(const type of ['buffers','images'])for(const item of result.gltf[type]||[])if(names.has(item.uri))item.uri=names.get(item.uri);
    for(const [name,buffer]of Object.entries(result.separateResources))fs.writeFileSync(path.join(out,names.get(name)),buffer);
    fs.writeFileSync(path.join(out,id+'.gltf'),JSON.stringify(result.gltf));
    console.log('Converted '+id);
  }
})().catch(e=>{console.error(e);process.exitCode=1});
