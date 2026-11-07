import {REGION_ORIGIN} from './region-layout.js';
import * as T from './three.module.js';
import {GAME_VERSION} from './catalog.js';
import {surface} from './scenery.js';
import {geometryBatch as batch,sceneMaterial as material} from './scene-batch.js';
import {addLocalRegion,REGION_BOUNDS} from './local-region.js';

// Fictional placement in game metres. No address, map coordinates or source
// photographs are shipped. Dimensions are estimated from the supplied views.
export const HOME_LANDMARK=Object.freeze({...REGION_ORIGIN,label:'Dom Samolociarzy'});
export function inNeighborhood(x,z,margin=0){x-=HOME_LANDMARK.x;z-=HOME_LANDMARK.z;return x>REGION_BOUNDS.minX-margin&&x<REGION_BOUNDS.maxX+margin&&z>REGION_BOUNDS.minZ-margin&&z<REGION_BOUNDS.maxZ+margin;}

function stoneTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');c.fillStyle='#9a9484';c.fillRect(0,0,512,512);
 let seed=182;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 for(let y=0;y<512;y+=10){let x=-100*random();while(x<512){const w=32+random()*75,v=169+Math.floor(random()*45);c.fillStyle=`rgb(${v+8},${v+4},${v-9})`;c.fillRect(x+1,y+1,w-1,8);c.fillStyle='#ffffff28';c.fillRect(x+1,y+1,w-2,1);x+=w;}}
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=4;return texture;
}

export function createHome({night=false}={}){
 const root=new T.Group();root.name='samolociarze-home';const {add,box,beam,face,finish}=batch(root);
 const white=material('#ece8dd',.86),grey=material('#666763'),tile=material('#3e464b',.7),seam=material('#283338'),trim=material('#d1d0c4'),frame=material('#242e30',.4,.35),paving=material('#a1a5a2'),grass=material('#6f8853'),wood=material('#8c8069');
 const stone=material('#ffffff');stone.map=stoneTexture();stone.bumpMap=stone.map;stone.bumpScale=.025;
 const glass=new T.MeshPhysicalMaterial({color:'#a6b9c1',roughness:.045,metalness:.6,transparent:true,opacity:.82,clearcoat:1,clearcoatRoughness:.03,envMapIntensity:1.8,side:T.DoubleSide});glass.emissive.set(night?'#b09261':'#000000');glass.emissiveIntensity=night?.2:0;
 if(typeof window!=='undefined'){
  let live=true;stone.addEventListener('dispose',()=>live=false);const loader=new T.TextureLoader();const stoneUrl=new URL('./textures/home-stone.png',import.meta.url);stoneUrl.searchParams.set('v',GAME_VERSION);
  loader.load(stoneUrl.href,t=>{if(!live){t.dispose();return;}t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;const old=stone.map;stone.map=stone.bumpMap=t;stone.bumpScale=.035;stone.needsUpdate=true;old.dispose();});
  const envUrl=new URL('./textures/home-reflections.png',import.meta.url);envUrl.searchParams.set('v',GAME_VERSION);loader.load(envUrl.href,t=>{if(!live){t.dispose();return;}t.colorSpace=T.SRGBColorSpace;t.mapping=T.EquirectangularReflectionMapping;glass.envMap=t;glass.needsUpdate=true;});
 }
 const lawn=surface('grass');lawn.repeat.set(10,14);grass.map=lawn;
 const pavement=surface('concrete');pavement.repeat.set(9,12);paving.map=pavement;
 const renderTexture=surface('asphalt');renderTexture.repeat.set(15,10);white.bumpMap=renderTexture;white.bumpScale=.012;
 const garage=material('#666c6b',.53,.15),lamp=material('#ede4cc');lamp.emissive.set('#ffd78d');lamp.emissiveIntensity=night?2:.12;
 // The front faces +Z: low garage wing on the left, tall glazed gable on the right.
 box(35,.08,48,grass,0,.03,-7);box(27,.22,18,paving,-1,.11,-4);
 box(16.4,3.7,9.1,white,-5.8,2.05,-5.4);box(8.1,.2,16.2,paving,6.7,.2,-5.6);
 box(.28,4.2,16.2,white,2.78,2.3,-5.6);
 box(.28,.38,16.2,white,10.62,.4,-5.6);box(.28,1.05,16.2,white,10.62,3.88,-5.6);
 for(const [z,d] of [[-1.5,8.2],[-9.36,1.25],[-13.12,1.25]])box(.28,2.95,d,white,10.62,1.92,z);
 for(const x of [3.15,10.25])box(1.05,3.05,.25,white,x,1.9,-13.6);box(8.1,.9,.25,white,6.7,3.95,-13.6);
 const interior=material('#796c59'),curtain=material('#d6d0bd'),floor=material('#9b8c72');
 box(7.8,.08,15.9,floor,6.7,.36,-5.6);box(7.8,.18,15.9,interior,6.7,4.1,-5.6);
 box(3.4,.65,1.05,interior,5.4,.8,-1.4);box(3.4,.75,.23,interior,5.4,1.2,-1.87);box(1.5,.09,.65,wood,7,.65,-.3);
 for(const x of [7.35,10.45])for(let i=0;i<8;i++)box(.05,3.4,.11,curtain,x+(i-4)*.035,2.05,2.18);
 box(.15,2.8,2.9,curtain,10.4,1.95,-7.2);
 // Garage, recessed entrance and the deep white horizontal canopy.
 box(2.6,3.1,.55,grey,-10.3,1.8,.2);box(2,3.1,.55,grey,-1,1.8,.2);box(13.2,.35,.55,grey,-5,3.18,.2);box(7,2.65,.13,garage,-5.5,1.67,.52);
 for(let y=.45;y<2.95;y+=.45)box(6.93,.018,.025,seam,-5.5,y,.6);
 box(3.2,2.6,.1,trim,-11.85,1.65,-.78);for(let y=.55;y<2.8;y+=.45)box(3.15,.018,.02,grey,-11.85,y,-.71);
 box(1.65,2.82,.17,frame,.7,1.58,-.24);box(1.35,2.6,.12,garage,.7,1.6,-.12);box(.04,.3,.09,trim,1.12,1.45,-.1);box(.45,2.4,.1,glass,1.65,1.6,-.18);
 box(17.8,.9,2.5,white,-5.8,3.75,1.05);for(const x of [-9.3,-1.25])box(.65,3.3,1,grey,x,1.8,1.15);
 for(const x of [-11.8,-2.3,.9])box(.22,.12,.1,lamp,x,3.23,2.32);
 // Stone gable, including the asymmetric floor-to-ridge glass panel.
 face([[2.65,.22,2.52],[10.75,.22,2.52],[10.75,4.25,2.52],[6.7,8.25,2.52],[2.65,4.25,2.52]],stone,[[[7.1,.32],[10.65,.32],[10.65,4.13],[7.1,7.64]]]);
 face([[7.2,.32,2.57],[10.65,.32,2.57],[10.65,4.13,2.57],[7.2,7.54,2.57]],glass);
 for(const x of [7.15,10.7])box(.12,x===7.15?7.3:3.95,.1,frame,x,x===7.15?3.95:2.24,2.67);
 beam([7.15,7.67,2.67],[10.72,4.12,2.67],.065,frame);box(3.6,.13,.14,frame,8.92,2.82,2.68);box(3.6,.13,.14,frame,8.92,.32,2.68);
 box(2.5,1.95,.12,frame,4.2,1.88,2.62);box(2.33,1.79,.08,glass,4.2,1.88,2.7);
 for(let i=0;i<19;i++)box(2.43,.027,.2,frame,4.2,1.02+i*.096,2.85,-.3);
 for(const x of [2.48,10.95])box(.4,4.18,.52,white,x,2.3,2.73);
 beam([2.37,4.23,2.71],[6.7,8.52,2.71],.23,white);beam([6.7,8.52,2.71],[11.03,4.23,2.71],.23,white);
 function windowSide(x,z,w,h){box(.13,h,w,frame,x,h/2+.35,z);box(.15,h-.13,w-.13,glass,x+.03,h/2+.35,z);for(let i=0;i<22;i++)box(.18,.025,w-.1,frame,x+.12,.5+i*(h-.2)/22,z);}
 windowSide(10.81,-7.2,3,2.8);windowSide(10.81,-11.2,2.35,2.8);
 // Back glazing and the garden terrace, confirmed by the family.
 box(7.8,.2,5.3,paving,6.7,.2,-16.35);box(6.1,2.95,.15,frame,6.7,1.88,-13.78);box(5.9,2.78,.17,glass,6.7,1.88,-13.85);
 for(const x of [4.7,6.7,8.7])box(.09,2.9,.2,frame,x,1.88,-13.96);
 box(1.7,.12,1,wood,6.7,.95,-17.1);box(1.2,.45,.6,white,10.1,.54,-17.8);box(1,.65,.45,grass,10.1,1.08,-17.8);for(const x of [6.05,7.35])for(const z of [-17.45,-16.75])box(.07,.7,.07,frame,x,.55,z);
 for(const x of [5.15,8.25]){box(.55,.12,.6,wood,x,.63,-17.1);box(.12,.7,.6,wood,x-.22,1,-17.1);}
 // True pitched roof geometry with tile courses, joints, ridge caps and gutters.
 function roof(cx,cz,w,d,eave,rise,axis){
  const convert=(x,y,z)=>axis==='x'?[cx+z,y,cz+x]:[cx+x,y,cz+z];
  for(const side of [-1,1]){
   const points=[convert(side*w/2,eave,-d/2),convert(0,eave+rise,-d/2),convert(0,eave+rise,d/2),convert(side*w/2,eave,d/2)];
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([...points[0],...points[1],...points[2],...points[0],...points[2],...points[3]],3));g.computeVertexNormals();
   // Roof planes use both sides because the two slopes have opposite winding.
   const m=tile;m.side=T.DoubleSide;add(g,m,0,0,0);
   for(let row=0;row<=22;row++){const t=row/22;beam(convert(side*w/2*(1-t),eave+rise*t+.035,-d/2),convert(side*w/2*(1-t),eave+rise*t+.035,d/2),.026,seam);}
   for(let z=-d/2;z<=d/2;z+=.42)beam(convert(side*w/2,eave+.035,z),convert(0,eave+rise+.035,z),.009,seam);
   beam(convert(side*w/2,eave-.06,-d/2),convert(side*w/2,eave-.06,d/2),.065,frame);
  }
  for(const end of [-1,1]){if(axis==='z'&&end===1)continue;const points=[convert(-w/2,eave,end*d/2),convert(w/2,eave,end*d/2),convert(0,eave+rise,end*d/2)];if(end===1)points.reverse();const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));g.computeVertexNormals();white.side=T.DoubleSide;add(g,white,0,0,0);}
  beam(convert(0,eave+rise+.07,-d/2),convert(0,eave+rise+.07,d/2),.085,tile);
 }
 roof(6.7,-5.6,8.9,17.1,4.32,4.1,'z');roof(-5.8,-5.8,9.6,16.8,3.9,2.25,'x');
 for(const x of [-14.1,11.1]){box(.1,3.8,.1,frame,x,2,-13.5);for(const y of [1.2,2.7])box(.14,.08,.14,frame,x,y,-13.5);}
 for(const z of [-13.8,2.85]){beam([2.35,4.3,z],[6.7,8.62,z],.065,seam);beam([6.7,8.62,z],[11.05,4.3,z],.065,seam);}
 box(.8,.025,1.2,frame,1.1,.28,1.8);box(.45,.07,.32,frame,-14.1,.26,2.2);
 // Paving and a slatted sliding gate. No identifying house number or plaque.
 box(15,.12,12,paving,-5.5,.12,8);box(15,.1,6,paving,-5.5,.1,17);box(2,.1,14,paving,2.5,.11,7);box(2,.1,17,paving,12,.1,-5.4);
 for(let z=2.2;z<14;z+=.55)box(14.9,.006,.014,grey,-5.5,.186,z);
 for(const x of [-13.2,0,2.2])box(.18,1.65,.18,frame,x,.9,14.2);
 for(let i=0;i<8;i++){box(12.8,.12,.1,frame,-6.6,.32+i*.18,14.2);box(1.9,.12,.1,frame,1.1,.32+i*.18,14.2);}
 function fenceLine(a,b){const length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(length/2.4);for(let i=0;i<=n;i++){const t=i/n;box(.07,1.45,.07,frame,a[0]+(b[0]-a[0])*t,.78,a[1]+(b[1]-a[1])*t);}for(const y of [.28,.85,1.42])beam([a[0],y,a[1]],[b[0],y,b[1]],.016,frame);for(let i=0;i<length/.22;i++){const t=i*.22/length;beam([a[0]+(b[0]-a[0])*t,.22,a[1]+(b[1]-a[1])*t],[a[0]+(b[0]-a[0])*t,1.45,a[1]+(b[1]-a[1])*t],.009,frame);}}
 for(const [a,b] of [[[-17,14],[-13.3,14]],[[2.3,14],[17,14]],[[-17,14],[-17,-31]],[[17,14],[17,-31]],[[-17,-31],[17,-31]]])fenceLine(a,b);
 finish();root.userData.features=['white-render','stone-gable','tall-asymmetric-glazing','external-blinds','two-garage-doors','recessed-entrance','cross-gabled-tile-roofs','gutters','slatted-gate','panel-fence','paved-drive','rear-glazing','garden-terrace'];
 return root;
}

export function addNeighborhood(parent,{night=false}={}){
 const root=new T.Group();root.name='home-neighborhood';root.position.set(HOME_LANDMARK.x,0,HOME_LANDMARK.z);parent.add(root);
 const home=createHome({night});root.add(home);const region=addLocalRegion(root,{night});root.userData.house=home;root.userData.features=region.root.userData.features;root.userData.region=region;return root;
}
