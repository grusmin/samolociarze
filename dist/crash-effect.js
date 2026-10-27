import * as T from './three.module.js';

// Reused GPU buffers: the crash adds four draw calls and allocates no per-frame meshes.
export function createCrashEffect(scene,{capacity=160,random=Math.random}={}){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
 const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);
 gradient.addColorStop(0,'rgba(255,255,255,1)');gradient.addColorStop(.35,'rgba(255,255,255,.85)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
 const texture=new T.CanvasTexture(canvas),geometry=new T.BufferGeometry();
 const positions=new Float32Array(capacity*3),colors=new Float32Array(capacity*3),sizes=new Float32Array(capacity),alphas=new Float32Array(capacity);
 for(const [name,array,size] of [['position',positions,3],['cloudColor',colors,3],['cloudSize',sizes,1],['cloudAlpha',alphas,1]])geometry.setAttribute(name,new T.BufferAttribute(array,size));
 const material=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{cloud:{value:texture},viewportHeight:{value:1}},vertexShader:`attribute vec3 cloudColor;attribute float cloudSize;attribute float cloudAlpha;uniform float viewportHeight;varying vec3 vColor;varying float vAlpha;void main(){vColor=cloudColor;vAlpha=cloudAlpha;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(cloudSize*projectionMatrix[1][1]*viewportHeight*.5/max(1.,-mv.z),1.,240.);}`,fragmentShader:`uniform sampler2D cloud;varying vec3 vColor;varying float vAlpha;void main(){float a=texture2D(cloud,gl_PointCoord).a*vAlpha;if(a<.003)discard;gl_FragColor=vec4(vColor,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const points=new T.Points(geometry,material);points.frustumCulled=false;points.renderOrder=5;points.visible=false;scene.add(points);
 const flash=new T.Mesh(new T.SphereGeometry(1,16,10),new T.MeshBasicMaterial({color:'#ffd798',transparent:true,depthWrite:false}));flash.visible=false;scene.add(flash);
 const light=new T.PointLight('#ff9c42',0,180,2);scene.add(light);
 const fragments=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial({color:'#657078',metalness:.6,roughness:.55}),18);fragments.visible=false;fragments.frustumCulled=false;scene.add(fragments);
 const pool=Array.from({length:capacity},()=>({p:new T.Vector3(),v:new T.Vector3(),size:1,life:1,delay:0,smoke:false}));
 const debris=Array.from({length:18},()=>({p:new T.Vector3(),v:new T.Vector3(),spin:new T.Vector3(),r:new T.Euler(),s:new T.Vector3()}));
 const center=new T.Vector3(),dummy=new T.Object3D(),color=new T.Color();let active=false,age=0,radius=10;
 function trigger(aircraft){
  clear();active=true;center.copy(aircraft.position);center.y=Math.max(4,center.y);radius=Math.max(6,Math.min(15,(aircraft.userData.span||60)*.16));
  pool.forEach((p,i)=>{p.smoke=i>=capacity*.4;p.delay=p.smoke?random()*.75:0;p.life=p.smoke?4.5+random()*1.7:.65+random()*.7;p.size=p.smoke?radius*.55:radius*.45;p.p.copy(center).add(new T.Vector3((random()-.5)*radius,.5+random()*radius*.35,(random()-.5)*radius));p.v.set((random()-.5)*radius*(p.smoke?.5:2),p.smoke?7+random()*8:3+random()*15,(random()-.5)*radius*(p.smoke?.5:2));});
  debris.forEach(p=>{p.p.copy(center);p.v.set((random()-.5)*34,8+random()*19,(random()-.5)*34);p.spin.set(random()*4,random()*4,random()*4);p.r.set(random()*3,random()*3,random()*3);p.s.set(1+random()*2,.25+random()*.5,1+random()*3);});
  flash.position.copy(center);light.position.copy(center);points.visible=fragments.visible=flash.visible=true;update(0);
 }
 function update(dt){
  if(!active)return;dt=Math.min(.1,Math.max(0,dt));age+=dt;
  flash.visible=age<.45;flash.scale.setScalar(radius*(.3+age*3));flash.material.opacity=Math.max(0,1-age/.45);light.intensity=80*Math.exp(-age*5);
  for(let i=0;i<capacity;i++){
   const p=pool[i],t=age-p.delay,life=Math.max(0,1-t/p.life);alphas[i]=t<0?0:life*(p.smoke?.65:.95);
   if(t<0||life<=0)continue;p.p.addScaledVector(p.v,dt);p.p.y=Math.max(.7,p.p.y);p.p.toArray(positions,i*3);sizes[i]=p.size+t*(p.smoke?radius*.75:radius*2);
   if(p.smoke)color.setRGB(.17+life*.08,.18+life*.07,.19+life*.06);else color.setRGB(2.6,Math.max(.12,life*1.4),.025);color.toArray(colors,i*3);
  }
  debris.forEach((p,i)=>{p.v.y-=14*dt;p.p.addScaledVector(p.v,dt);if(p.p.y<.45){p.p.y=.45;p.v.multiplyScalar(.8);p.v.y=Math.abs(p.v.y)*.22;}p.r.x+=p.spin.x*dt;p.r.y+=p.spin.y*dt;p.r.z+=p.spin.z*dt;dummy.position.copy(p.p);dummy.rotation.copy(p.r);dummy.scale.copy(p.s);dummy.updateMatrix();fragments.setMatrixAt(i,dummy.matrix);});fragments.instanceMatrix.needsUpdate=true;
  material.uniforms.viewportHeight.value=(globalThis.innerHeight||720)*Math.min(globalThis.devicePixelRatio||1,1.6);for(const attribute of Object.values(geometry.attributes))attribute.needsUpdate=true;
  if(age>6.5){active=false;points.visible=fragments.visible=flash.visible=false;light.intensity=0;}
 }
 function clear(){active=false;age=0;alphas.fill(0);geometry.attributes.cloudAlpha.needsUpdate=true;points.visible=fragments.visible=flash.visible=false;light.intensity=0;}
 return {trigger,update,clear,get age(){return age;},get active(){return active;}};
}
