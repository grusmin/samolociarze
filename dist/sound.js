export function createSound(){
 let ctx,osc,gain,wind,enabled=true;
 function unlock(){try{if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();gain=ctx.createGain();gain.gain.value=0;gain.connect(ctx.destination);osc=ctx.createOscillator();osc.type='sawtooth';osc.frequency.value=45;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=250;osc.connect(filter);filter.connect(gain);osc.start();}if(ctx.state==='suspended')ctx.resume();}catch{}}
 function update(f,paused){if(!ctx)return;const power=enabled&&f?.engines&&!paused?.012+f.throttle*.025:0;gain.gain.setTargetAtTime(power,ctx.currentTime,.15);osc.frequency.setTargetAtTime(32+(f?.throttle||0)*42+(f?.velocity||0)*.08,ctx.currentTime,.1);}
 function beep(){if(!ctx||!enabled)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=780;g.gain.setValueAtTime(.035,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.12);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.13);}
 return {unlock,update,beep,set enabled(value){enabled=!!value;}};
}
