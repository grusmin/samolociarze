// Run `npm install` in this directory once, then `node rebuild-models.cjs`.
const fs=require('fs'),path=require('path'),pipeline=require('gltf-pipeline');
const out=path.join(__dirname,'../dist/models');
(async()=>{
 for(const [name,source] of [['a380','a380.glb'],['b747','b744.glb'],['an225','an225.gltf']]){
  const input=fs.readFileSync(path.join(__dirname,source));
  const gltf=source.endsWith('.glb')?(await pipeline.glbToGltf(input)).gltf:JSON.parse(input);
  const result=await pipeline.processGltf(gltf,{separate:true,name,resourceDirectory:__dirname});
  for(const m of result.gltf.materials){m.pbrMetallicRoughness.metallicFactor=.08;m.pbrMetallicRoughness.roughnessFactor=.43;}
  if(name!=='an225'){result.gltf.images[0].uri=name==='a380'?'emirates.png':'klm.png';result.gltf.images[0].mimeType='image/png';}
  fs.writeFileSync(path.join(out,name+'.gltf'),JSON.stringify(result.gltf));
  for(const [file,buffer] of Object.entries(result.separateResources))fs.writeFileSync(path.join(out,file),buffer);
  console.log('Converted '+name);
 }
})().catch(error=>{console.error(error);process.exitCode=1});
