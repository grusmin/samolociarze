// Keep touch pointers separate from the keyboard and from one another.
export function bindFlightControls({root=document,enabled=()=>true,onEngage=()=>{}}={}){
 const pointers=new Map();
 const buttons=[...root.querySelectorAll('[data-key], #brake')];
 function paint(button){
  const pressed=[...pointers.values()].some(hold=>hold.button===button);
  button.classList.toggle('pressed',pressed);
  button.setAttribute('aria-pressed',String(pressed));
 }
 function release(event){
  const hold=pointers.get(event.pointerId);
  if(!hold)return;
  pointers.delete(event.pointerId);paint(hold.button);
 }
 for(const button of buttons){
  button.setAttribute('aria-pressed','false');
  button.addEventListener('pointerdown',event=>{
   if(event.button!==0||!enabled())return;
   event.preventDefault();onEngage();
   button.setPointerCapture(event.pointerId);
   pointers.set(event.pointerId,{button,code:button.dataset.key||'Brake'});
   paint(button);
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,release);
  button.addEventListener('contextmenu',event=>event.preventDefault());
 }
 return {
  has:code=>[...pointers.values()].some(hold=>hold.code===code),
  clear(){
   const held=[...pointers.entries()];pointers.clear();
   for(const [id,{button}] of held){paint(button);if(button.hasPointerCapture(id))button.releasePointerCapture(id);}
  }
 };
}
