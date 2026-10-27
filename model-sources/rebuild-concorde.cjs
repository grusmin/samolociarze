// FlightGear GPLv2 sources and attribution are preserved in concorde/.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const source=path.join(__dirname,'concorde');
execFileSync(process.execPath,[path.join(source,'convert-concorde.cjs'),'--body-only'],{stdio:'inherit'});
for(const name of ['conc.gltf','conc.bin','conc-airfrance.png','conc-default.png'])fs.copyFileSync(path.join(source,'converted-body',name),path.join(__dirname,'../dist/models',name));
console.log('Concorde rebuilt from original AC3D source and Air France/default textures.');
