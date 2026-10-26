import * as T from './three.module.js';

// A fixed particle pool and one draw call keep smoke inexpensive on phones.
export function createSmoke(scene,{capacity=192,random=Math.random}={}){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
 const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,1,32,32,31);
 gradient.addColorStop(0,'rgba(255,255,255,.8)');gradient.addColorStop(.35,'rgba(255,255,255,.48)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
 const texture=new T.CanvasTexture(canvas),geometry=new T.BufferGeometry();
 const positions=new Float32Array(capacity*3),colors=new Float32Array(capacity*3),sizes=new Float32Array(capacity),alphas=new Float32Array(capacity);
 geometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('smokeColor',new T.BufferAttribute(colors,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('smokeSize',new T.BufferAttribute(sizes,1).setUsage(T.DynamicDrawUsage));geometry.setAttribute('smokeAlpha',new T.BufferAttribute(alphas,1).setUsage(T.DynamicDrawUsage));
 const material=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{cloud:{value:texture},viewportHeight:{value:innerHeight*Math.min(devicePixelRatio,1.6)}},vertexShader:`attribute vec3 smokeColor;attribute float smokeSize;attribute float smokeAlpha;uniform float viewportHeight;varying vec3 vColor;varying float vAlpha;void main(){vColor=smokeColor;vAlpha=smokeAlpha;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(smokeSize*projectionMatrix[1][1]*viewportHeight*.5/max(1.0,-mv.z),1.0,220.0);}`,fragmentShader:`uniform sampler2D cloud;varying vec3 vColor;varying float vAlpha;void main(){float alpha=texture2D(cloud,gl_PointCoord).a*vAlpha;if(alpha<.003)discard;gl_FragColor=vec4(vColor,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const points=new T.Points(geometry,material);points.frustumCulled=false;points.renderOrder=4;scene.add(points);
 const pool=Array.from({length:capacity},()=>({position:new T.Vector3(),velocity:new T.Vector3(),life:0,maxLife:1,size:1,engine:false,color:new T.Color()}));
 let cursor=0,brakeTime=0,engineTime=0;
 function emit(origin,aircraft,engine){
  const p=pool[cursor++%capacity];p.position.fromArray(origin).applyEuler(aircraft.rotation).add(aircraft.position);p.engine=engine;p.maxLife=engine?2.2:2.1;p.life=p.maxLife;p.size=engine?2.8:1.4;
  p.velocity.set((random()-.5)*2,engine?2:1.1,(random()-.5)*2+(engine?6:0)).applyEuler(aircraft.rotation);p.color.set(engine?'#3e4248':'#c4c8cc');
 }
 function update(dt,{aircraft,failed=false,airborne=false,brake=false,gear=true,speed=0,active=true,engineSide=1}){
  if(active&&brake&&!airborne&&gear&&speed>8){brakeTime+=dt;while(brakeTime>=.045){for(const wheel of aircraft.userData.brakeWheels||[[-4,-6.65,4],[4,-6.65,4]])emit(wheel,aircraft,false);brakeTime-=.045;}}else brakeTime=0;
  if(active&&failed&&airborne){engineTime+=dt;while(engineTime>=.012){const origin=[...(aircraft.userData.engineSmoke||[-15,-1,2])];origin[0]*=engineSide;emit(origin,aircraft,true);engineTime-=.012;}}else engineTime=0;
  for(let i=0;i<capacity;i++){const p=pool[i];p.life=Math.max(0,p.life-dt);alphas[i]=p.life>0?(p.engine?.7:.5)*p.life/p.maxLife:0;if(!p.life)continue;const age=p.maxLife-p.life;p.position.addScaledVector(p.velocity,dt);p.position.toArray(positions,i*3);p.color.toArray(colors,i*3);sizes[i]=p.size+age*(p.engine?5:2.8);}
  material.uniforms.viewportHeight.value=innerHeight*Math.min(devicePixelRatio,1.6);for(const a of Object.values(geometry.attributes))a.needsUpdate=true;
 }
 function clear(){for(const p of pool)p.life=0;alphas.fill(0);geometry.attributes.smokeAlpha.needsUpdate=true;brakeTime=engineTime=0;}
 return {update,clear,get liveCount(){return pool.filter(p=>p.life>0).length;},get engineCount(){return pool.filter(p=>p.life>0&&p.engine).length;}};
}
