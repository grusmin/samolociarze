import assert from 'node:assert/strict';
import {bindFlightControls} from './dist/controls.js';

class Button extends EventTarget{
 constructor(key){super();this.dataset=key?{key}:{};this.attributes={};this.captured=new Set();this.pressed=false;this.classList={toggle:(_,value)=>this.pressed=value};}
 setAttribute(key,value){this.attributes[key]=value;}
 setPointerCapture(id){this.captured.add(id);}
 hasPointerCapture(id){return this.captured.has(id);}
 releasePointerCapture(id){this.captured.delete(id);this.fire('lostpointercapture',id);}
 fire(type,id,button=0){const event=new Event(type,{cancelable:true});Object.assign(event,{pointerId:id,button});this.dispatchEvent(event);return event;}
}
const power=new Button('Equal'),up=new Button('ArrowDown'),left=new Button('ArrowLeft'),brake=new Button();
let enabled=true,engaged=0;
const input=bindFlightControls({root:{querySelectorAll:()=>[power,up,left,brake]},enabled:()=>enabled,onEngage:()=>engaged++});
assert(power.fire('pointerdown',1).defaultPrevented);
up.fire('pointerdown',2);left.fire('pointerdown',3);brake.fire('pointerdown',4);
for(const code of ['Equal','ArrowDown','ArrowLeft','Brake'])assert(input.has(code),'Simultaneous hold: '+code);
assert.equal(engaged,4);assert(brake.pressed);assert.equal(brake.attributes['aria-pressed'],'true');
up.fire('pointerup',2);assert(!input.has('ArrowDown'));assert(input.has('Equal'));assert(input.has('Brake'));
power.fire('pointerdown',5);power.fire('pointerup',1);assert(input.has('Equal'),'Another finger on the same button still holds power');
power.fire('lostpointercapture',5);assert(!input.has('Equal'));assert(!power.pressed);
left.fire('pointercancel',3);assert(!input.has('ArrowLeft'));assert(input.has('Brake'));
input.clear();assert(!input.has('Brake'));assert(!brake.pressed);assert.equal(brake.captured.size,0);
enabled=false;power.fire('pointerdown',6);assert(!input.has('Equal'),'Paused/menu input is ignored');
enabled=true;power.fire('pointerdown',7,2);assert(!input.has('Equal'),'Right mouse button does not hold a control');
power.fire('pointerdown',8);input.clear();power.fire('pointerup',8);assert(!input.has('Equal'),'Late releases after pause cannot leave a stuck key');
assert(power.fire('contextmenu',9).defaultPrevented);
console.log('PASS: multi-touch power/pitch/turn/brake, independent releases, duplicate fingers, cancellation, lost capture, pause reset and held feedback');
