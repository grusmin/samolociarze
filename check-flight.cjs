const fs=require('fs');
const source=fs.readFileSync('dist/game.js','utf8').replace("'./three.module.js'","'./dist/three.module.js'").replace("'./scenery.js'","'./dist/scenery.js'").replace("'./airliner.js'","'./dist/airliner.js'").replace("'./flightdeck.js'","'./dist/flightdeck.js'").replace("'./reflections.js'","'./dist/reflections.js'").replace("'./fleet.js'","'./dist/fleet.js'").replace("'./smoke.js'","'./dist/smoke.js'").replace("await loadFleet();", "/* Geometry assets tested separately; physics uses the procedural fixture. */").replace("const built=fleetAircraft(type);","const built=buildAirliner(type);").replace("new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'})","({setPixelRatio(){},setSize(){},shadowMap:{},render(){}})");
const pre=`
const elements=new Map();
function elem(id){if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:'',value:id==='airport'?'WAW':'LHR',classList:{add(){},remove(){},toggle(){}},style:{},firstElementChild:{style:{}},addEventListener(){}});return elements.get(id)}
globalThis.document={getElementById:elem,querySelectorAll(){return []},addEventListener(){},body:{classList:{add(){},remove(){},toggle(){}}},createElement(){return {width:0,height:0,getContext(){return new Proxy({createRadialGradient(){return {addColorStop(){}}},createLinearGradient(){return {addColorStop(){}}}},{get(t,k){return t[k]||(()=>{})}})}}}};
globalThis.window={addEventListener(){}};globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=()=>{};globalThis.innerWidth=1280;globalThis.innerHeight=800;globalThis.devicePixelRatio=1;globalThis.localStorage={getItem(){return '0'},setItem(){}};
`;
const tests=`
function assert(b,msg){if(!b)throw Error(msg)}
start();engine();for(let i=0;i<100;i++)update(.05);assert(velocity===0,'Taxi requires tower clearance');radio();throttle=1;keys.add('ArrowDown');for(let i=0;i<800&&!airborne;i++)update(.05);keys.clear();assert(airborne,'Takeoff works');
const heldPitch=pitch;const beforeClimb=aircraft.position.y;for(let i=0;i<40;i++)update(.05);assert(Math.abs(pitch-heldPitch)<1e-10,'Pitch holds after releasing climb');assert(aircraft.position.y>beforeClimb,'Climb continues after release');keys.add(controlKey('KeyW'));update(.05);keys.clear();assert(pitch<heldPitch,'W still lowers the nose');console.log('PASS: pitch holds after release, climb continues, W lowers nose');
emergency();assert(failed,'Failure starts');const normalYaw=yaw;const normalPitch=pitch;keys.add('ArrowDown');update(.05);keys.clear();assert(yaw>normalYaw,'Failure pulls aircraft left');assert(Math.abs(pitch-normalPitch-.05*.16*.55)<1e-10,'Failure reduces elevator authority');for(let i=0;i<15;i++)update(.05);assert(smoke.engineCount>0,'Failed engine emits smoke');repair();assert(!failed,'Failure repair works');for(let i=0;i<80;i++)update(.05);assert(smoke.engineCount===0,'Engine smoke fades after repair');console.log('PASS: failure drift, reduced control authority, engine smoke and repair fade');
for(let i=0;i<16000&&!finished;i++){
 if(wp<4){const p=waypoints[wp],d=p.clone().sub(aircraft.position);yaw=Math.atan2(-d.x,-d.z);pitch=clamp(Math.atan2(d.y,Math.hypot(d.x,d.z)),-.18,.25);throttle=.68;}
 else if(stage!==4){if(!cleared)radio();gear=true;const p=new THREE.Vector3(0,6.5,-17700),d=p.clone().sub(aircraft.position);yaw=aircraft.position.z< -17500?0:Math.atan2(-d.x,-d.z);pitch=aircraft.position.z< -17500?-.04:clamp(Math.atan2(d.y,Math.hypot(d.x,d.z)),-.12,.05);throttle=.4;}
 else braking=true;
 update(.05);
}
console.log({wp,stage,velocity,yaw,pitch,roll,pos:aircraft.position,cleared,gear});assert(finished,'Mission ends');assert(stored===1,'Successful landing recorded: '+$('modalText').textContent);console.log('PASS: clearance, takeoff, 4 waypoints, failure/repair, landing, braking, completion');
start();engine();radio();velocity=40;braking=true;update(.1);assert(smoke.liveCount>0,'Ground braking emits smoke');braking=false;velocity=0;throttle=0;for(let i=0;i<60;i++)update(.05);assert(smoke.liveCount===0,'Brake smoke fades');console.log('PASS: ground braking smoke and decay');start();engine();radio();throttle=1;for(let i=0;i<2000&&!finished;i++)update(.05);assert(finished&&stored===1,'Runway overrun fails without awarding win');console.log('PASS: runway overrun and reset');
createAircraft('b747');let meshCount=0;aircraft.traverse(o=>{if(o.isMesh)meshCount++});assert(meshCount>100,'747 model builds');console.log('PASS: 747 geometry');
`;
fs.writeFileSync('flight-test.mjs',pre+source+tests);
import('./flight-test.mjs').then(()=>fs.unlinkSync('flight-test.mjs')).catch(e=>{console.error(e);process.exitCode=1});

