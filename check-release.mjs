import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {GAME_VERSION,PLANES} from './dist/catalog.js';
const version=JSON.parse(fs.readFileSync('package.json')).version;assert.equal(GAME_VERSION,version);
for(const name of ['index.html','career.html']){
 const html=fs.readFileSync('dist/'+name,'utf8'),map=JSON.parse(/<script type="importmap">([^<]+)<\/script>/.exec(html)?.[1]||'{}');
 assert(html.includes(`src="app.js?v=${version}"`));assert(html.includes(`href="career.css?v=${version}"`));
 for(const [key,value] of Object.entries(map.imports||{})){assert.equal(value,key+'?v='+version);assert(fs.existsSync(path.join('dist',key)));}
 for(const file of ['app.js','catalog.js','world.js','fleet.js','three.module.js','three.core.js','airport-buildings.js','lakes.js','landing-assist.js'])assert.equal(map.imports['./'+file],'./'+file+'?v='+version,'A release must not mix cached module versions');
}
assert.equal(fs.readFileSync('dist/index.html','utf8'),fs.readFileSync('dist/career.html','utf8'));
for(const type of Object.keys(PLANES)){const model=JSON.parse(fs.readFileSync(`dist/models/${type}.gltf`));for(const entry of [...(model.buffers||[]),...(model.images||[])])if(entry.uri&&!entry.uri.startsWith('data:'))assert(fs.existsSync(path.join('dist/models',entry.uri)),entry.uri);}
assert(fs.readFileSync('dist/fleet.js','utf8').includes("searchParams.set('v',GAME_VERSION)"));
console.log(`PASS: coherent ${version} browser imports and styles, matching entry pages and all ${Object.keys(PLANES).length} aircraft assets`);
