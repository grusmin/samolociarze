// AC3D exterior -> glTF 2.0, retaining GPLv2 source attribution.
// Input from FGMEMBERS/Concorde; see SOURCES.json and concorde-COPYING.txt.
const fs=require('node:fs'),path=require('node:path');
const lines=fs.readFileSync(path.join(__dirname,'concorde.ac'),'utf8').split(/\r?\n/);
const bodyOnly=process.argv.includes('--body-only');
const sourceScale=[25.56/24.642246,1,61.66/61.769096];
let cursor=1;
const materials=[];
function values(line){return line.trim().split(/\s+/).slice(1).map(Number);}
function quoted(line){return JSON.parse(line.slice(line.indexOf(' ')+1));}
while(lines[cursor]?.startsWith('MATERIAL ')){
 const line=lines[cursor++],name=/MATERIAL "([^"]+)"/.exec(line)[1];
 const rgb=/rgb ([\d.e+-]+) ([\d.e+-]+) ([\d.e+-]+)/.exec(line).slice(1).map(Number);
 const transparency=Number(/trans ([\d.e+-]+)/.exec(line)?.[1]||0);
 materials.push({name,rgb,transparency});
}
function parseObject(){
 while(!lines[cursor].trim())cursor++;
 if(!lines[cursor].startsWith('OBJECT '))throw Error('Expected OBJECT: '+cursor);
 const object={type:lines[cursor++].split(' ')[1],name:'',vertices:[],surfaces:[],children:[],loc:[0,0,0],rot:[1,0,0,0,1,0,0,0,1],repeat:[1,1],offset:[0,0]};
 while(cursor<lines.length){
  const line=lines[cursor++].trim();if(!line)continue;
  const key=line.split(' ')[0];
  if(key==='name')object.name=quoted(line);
  else if(key==='texture')object.texture=quoted(line);
  else if(key==='loc')object.loc=values(line);
  else if(key==='rot')object.rot=values(line);
  else if(key==='texrep')object.repeat=values(line);
  else if(key==='texoff')object.offset=values(line);
  else if(key==='data'){
   let left=Number(line.split(' ')[1]);while(left>0){const data=lines[cursor++];left-=Buffer.byteLength(data)+1;}
  }else if(key==='numvert'){
   const count=Number(line.split(' ')[1]);for(let i=0;i<count;i++)object.vertices.push(lines[cursor++].trim().split(/\s+/).map(Number));
  }else if(key==='numsurf'){
   const count=Number(line.split(' ')[1]);
   for(let i=0;i<count;i++){
    const surface={refs:[],flags:0,material:0};
    while(cursor<lines.length){
     const data=lines[cursor++].trim(),type=data.split(' ')[0];
     if(type==='SURF')surface.flags=Number(data.split(' ')[1]);
     else if(type==='mat')surface.material=Number(data.split(' ')[1]);
     else if(type==='refs'){
      const refs=Number(data.split(' ')[1]);for(let r=0;r<refs;r++)surface.refs.push(lines[cursor++].trim().split(/\s+/).map(Number));break;
     }else throw Error('Unexpected surface entry '+data+' at '+cursor);
    }
    object.surfaces.push(surface);
   }
  }else if(key==='kids'){
   const count=Number(line.split(' ')[1]);
   for(let i=0;i<count;i++){
    while(cursor<lines.length&&!lines[cursor].trim())cursor++;
    // The upstream world's kids value is 104, but it contains 103 objects.
    // FlightGear tolerates this final stale count; preserve every actual child.
    if(cursor>=lines.length&&object.type==='world')break;
    object.children.push(parseObject());
   }
   break;
  }
 }
 return object;
}
const world=parseObject();
const omitted=/^(Cockpit|HullInside|MainPanel|Pillar|fx|(?:Inner|Outer)Flame\d+|Reheat\d+)$|closed$/i;
const gear=/^(?:Fhub|Fram|Fstrut|Fwheels|[LR](?:Actuating|Main|main|piston)|Tail(?:strut|ram|wheels|door)|O[FLR]|Littledoor|Wheel$)/;
const gltf={asset:{version:'2.0',generator:'Samolociarze AC3D exterior converter',copyright:'FGMEMBERS/Concorde / FlightGear contributors; GPLv2; Air France livery from the same source repository.'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:[],textures:[],images:[],samplers:[{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}],buffers:[],bufferViews:[],accessors:[]};
const bufferParts=[],imageIndex=new Map(),materialIndex=new Map();
let byteOffset=0,totalTriangles=0;
const objectReport=[];
function append(array,type,count,componentType,min,max){
 const typed=componentType===5126?new Float32Array(array):new Uint32Array(array),buffer=Buffer.from(typed.buffer);
 const padding=(4-byteOffset%4)%4;if(padding){bufferParts.push(Buffer.alloc(padding));byteOffset+=padding;}
 const view=gltf.bufferViews.push({buffer:0,byteOffset,byteLength:buffer.length})-1;
 bufferParts.push(buffer);byteOffset+=buffer.length;
 return gltf.accessors.push({bufferView:view,componentType,count,type,...(min?{min,max}:{})})-1;
}
function getMaterial(source,texture,isWindow){
 const id=[source,texture,isWindow].join(':');if(materialIndex.has(id))return materialIndex.get(id);
 const base=materials[source]||materials[0];
 const m={name:base.name+(texture?':'+texture:''),doubleSided:true,pbrMetallicRoughness:{baseColorFactor:isWindow?[.14,.23,.3,1]:[...base.rgb,1],metallicFactor:isWindow?.3:.08,roughnessFactor:isWindow?.18:.45}};
 // The original window PNG contains transparency for the FG interior. An opaque
 // blue tinted material reads as cabin glass without drawing an empty interior.
 if(texture&&!isWindow){
  let textureId=imageIndex.get(texture);
  if(textureId===undefined){textureId=gltf.images.push({uri:texture})-1;gltf.textures.push({sampler:0,source:textureId});imageIndex.set(texture,textureId);}
  m.pbrMetallicRoughness.baseColorTexture={index:textureId};
 }
 const index=gltf.materials.push(m)-1;materialIndex.set(id,index);return index;
}
function transformPoint(p,o){
 const r=o.rot,[x,y,z]=p;return [r[0]*x+r[1]*y+r[2]*z+o.loc[0],r[3]*x+r[4]*y+r[5]*z+o.loc[1],r[6]*x+r[7]*y+r[8]*z+o.loc[2]];
}
function cross(a,b,c){const u=b.map((n,i)=>n-a[i]),v=c.map((n,i)=>n-a[i]);return [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];}
function unit(v){const length=Math.hypot(...v)||1;return v.map(n=>n/length);}
function visit(object,ancestors=[]){
 if(omitted.test(object.name)||bodyOnly&&gear.test(object.name))return;
 const chain=[object,...ancestors];
 // AC3D model: X length (nose negative), Y up, Z port. Game: X starboard,
 // Y up, Z aft. This 90-degree rotation preserves winding and real metre scale.
 const vertices=object.vertices.map(p=>{for(const item of chain)p=transformPoint(p,item);return [-p[2]*sourceScale[0],p[1],p[0]*sourceScale[2]];});
 const normalSums=vertices.map(()=>[0,0,0]),triangles=[];
 for(const surface of object.surfaces){
  if((surface.flags&15)!==0)continue;
  for(let i=1;i<surface.refs.length-1;i++){
   const refs=[surface.refs[0],surface.refs[i],surface.refs[i+1]];
   const normal=cross(...refs.map(ref=>vertices[ref[0]]));if(Math.hypot(...normal)<1e-10)continue;
   triangles.push({refs,normal,material:surface.material,smooth:!!(surface.flags&0x10)});
   if(surface.flags&0x10)for(const ref of refs)normal.forEach((n,axis)=>normalSums[ref[0]][axis]+=n);
  }
 }
 if(triangles.length){
  const byMaterial=new Map();
  for(const triangle of triangles){if(!byMaterial.has(triangle.material))byMaterial.set(triangle.material,[]);byMaterial.get(triangle.material).push(triangle);}
  const primitives=[];
  for(const [material,faces] of byMaterial){
   const positions=[],normals=[],uvs=[],indices=[],unique=new Map(),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
   for(const face of faces)for(const ref of face.refs){
    const p=vertices[ref[0]],normal=unit(face.smooth?normalSums[ref[0]]:face.normal);
    const key=[ref[0],ref[1],ref[2],face.smooth?'smooth':normal.join(',')].join(':');
    if(unique.has(key)){indices.push(unique.get(key));continue;}
    const vertexIndex=positions.length/3;unique.set(key,vertexIndex);indices.push(vertexIndex);
    positions.push(...p);normals.push(...normal);
    uvs.push(ref[1]*object.repeat[0]+object.offset[0],1-(ref[2]*object.repeat[1]+object.offset[1]));
    p.forEach((n,axis)=>{min[axis]=Math.min(min[axis],n);max[axis]=Math.max(max[axis],n);});
   }
   const count=positions.length/3;
   const airFranceObjects=['Hull','Upperrudder','Lowerrudder','Wing','Nose_0','Nose_1'];
   let texture=object.texture==='concorde.png'?(airFranceObjects.includes(object.name)?'conc-airfrance.png':'conc-default.png'):object.texture;
   const window=/window/.test(texture||'');
   primitives.push({attributes:{POSITION:append(positions,'VEC3',count,5126,min,max),NORMAL:append(normals,'VEC3',count,5126),TEXCOORD_0:append(uvs,'VEC2',count,5126)},indices:append(indices,'SCALAR',indices.length,5125),material:getMaterial(material,texture,window)});
  }
  const name=(gear.test(object.name)?'ConcordeGear-':'')+object.name;
  const node=gltf.nodes.push({name,mesh:gltf.meshes.push({name,primitives})-1})-1;
  gltf.scenes[0].nodes.push(node);totalTriangles+=triangles.length;
  const min=[0,1,2].map(axis=>Math.min(...vertices.map(p=>p[axis]))),max=[0,1,2].map(axis=>Math.max(...vertices.map(p=>p[axis])));
  objectReport.push({name,triangles:triangles.length,min,max,texture:object.texture});
 }
 for(const child of object.children)visit(child,[object,...ancestors]);
}
visit(world);
const buffer=Buffer.concat(bufferParts);gltf.buffers=[{uri:'conc.bin',byteLength:buffer.length}];
const out=path.join(__dirname,bodyOnly?'converted-body':'converted');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'conc.bin'),buffer);fs.writeFileSync(path.join(out,'conc.gltf'),JSON.stringify(gltf));
for(const [source,target] of [['concorde-airfrance.png','conc-airfrance.png'],['concorde-default.png','conc-default.png'],['concorde-cockpit-textures.png','concorde-cockpit-textures.png']])if(gltf.images.some(x=>x.uri===target))fs.copyFileSync(path.join(__dirname,source),path.join(out,target));
const report={bodyOnly,sourceScale,triangles:totalTriangles,meshes:gltf.meshes.length,materials:gltf.materials.length,bytes:buffer.length,images:gltf.images,objects:objectReport};fs.writeFileSync(path.join(__dirname,bodyOnly?'CONVERSION-REPORT-BODY.json':'CONVERSION-REPORT.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({triangles:totalTriangles,meshes:gltf.meshes.length,materials:gltf.materials.length,bytes:buffer.length,images:gltf.images}));
