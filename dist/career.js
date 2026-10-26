import {PLANES,AIRPORTS,clamp} from './catalog.js';
export const SAVE_KEY='samolociarzeCareerV1';
export const CHEAT_BACKUP_KEY='samolociarzeBeforeCheatsV1';
export const CHEAT_CODES={
 SAMOLOCIARZE:{label:'Wszystkie poziomy i samoloty',xp:8750,planes:true},
 POZIOMY:{label:'Wszystkie poziomy — ranga Dowódca floty',xp:8750},
 HANGAR:{label:'Wszystkie samoloty',planes:true},
 MONETY:{label:'Co najmniej 100 000 monet',credits:100000}
};
export function hasCheatBackup(storage){try{return !!storage.getItem(CHEAT_BACKUP_KEY);}catch{return false;}}
export function applyCheat(storage,profile,input){
 const code=String(input||'').trim().toUpperCase();
 if(!Object.hasOwn(CHEAT_CODES,code))throw Error(code?'Nie znam tego kodu. Sprawdź listę poniżej.':'Najpierw wpisz kod.');
 const effect=CHEAT_CODES[code],before=JSON.stringify(profile),next=JSON.parse(before);
 if(effect.xp)next.xp=Math.max(next.xp,effect.xp);
 if(effect.planes)next.owned=Object.keys(PLANES);
 if(effect.credits)next.credits=Math.max(next.credits,effect.credits);
 try{if(!hasCheatBackup(storage))storage.setItem(CHEAT_BACKUP_KEY,before);storage.setItem(SAVE_KEY,JSON.stringify(next));}
 catch{throw Error('Nie udało się zapisać kodu i kopii postępów. Sprawdź zapis w przeglądarce.');}
 Object.assign(profile,next);return effect.label+'. Kod włączony!';
}
export function restoreCheatBackup(storage){
 let restored;
 try{const raw=storage.getItem(CHEAT_BACKUP_KEY);if(!raw)throw Error();const original=JSON.parse(raw);restored=sanitizeProfile(original);if(original.current?.plan&&original.current?.state)restored.current=original.current;}
 catch{throw Error('Brak poprawnej kopii postępów sprzed kodów.');}
 try{storage.setItem(SAVE_KEY,JSON.stringify(restored));}catch{throw Error('Nie udało się przywrócić zapisu.');}
 try{storage.removeItem(CHEAT_BACKUP_KEY);}catch{}
 return restored;
}
export function freshProfile(legacy=0){return {version:1,credits:6000+Math.min(legacy,20)*500,xp:Math.min(legacy,20)*100,flights:legacy,owned:['a380','b747','an225'],history:[],visited:[],badges:[],settings:{sound:true,rings:true,quality:'auto'},current:null};}
export function levelFor(xp){return 1+Math.floor(Math.sqrt(Math.max(0,xp)/350));}
export function rankFor(xp){return ['Kadet','Drugi pilot','Pierwszy oficer','Kapitan','Starszy kapitan','Dowódca floty'][Math.min(5,levelFor(xp)-1)];}
export function sanitizeProfile(data){
 if(!data||data.version!==1||!Array.isArray(data.owned))throw Error('To nie jest poprawny zapis Samolociarzy.');
 const p=freshProfile();for(const k of ['credits','xp','flights']){if(!Number.isFinite(data[k])||data[k]<0)throw Error('Zapis ma nieprawidłowe postępy.');p[k]=Math.floor(clamp(data[k],0,10000000));}
 p.owned=[...new Set([...p.owned,...data.owned.filter(id=>PLANES[id])])];p.visited=[...new Set((data.visited||[]).filter(id=>AIRPORTS[id]))];
 p.history=(Array.isArray(data.history)?data.history:[]).filter(h=>h&&typeof h.id==='string'&&AIRPORTS[h.from]&&AIRPORTS[h.to]&&PLANES[h.plane]&&Number.isFinite(h.score)).slice(0,40).map(h=>({id:h.id.slice(0,80),from:h.from,to:h.to,plane:h.plane,score:clamp(h.score,0,100),reward:clamp(Number(h.reward)||0,0,50000),weather:String(h.weather||'sun').slice(0,20),job:h.job==='cargo'?'cargo':'passengers',date:String(h.date||'').slice(0,30)}));
 p.badges=(data.badges||[]).filter(id=>['first','smooth','cargo','night','rain','explorer','veteran','engine'].includes(id));
 p.settings={sound:data.settings?.sound!==false,rings:data.settings?.rings!==false,quality:['auto','low','high'].includes(data.settings?.quality)?data.settings.quality:'auto'};
 return p;
}
export function readProfile(storage){try{const raw=storage.getItem(SAVE_KEY);if(raw){const original=JSON.parse(raw),p=sanitizeProfile(original);if(original.current?.plan&&original.current?.state)p.current=original.current;return p;}}catch{}let legacy=0;try{legacy=Math.max(0,parseInt(storage.getItem('samolociarzeFlights')||'0',10)||0);}catch{}return freshProfile(legacy);}
export function saveProfile(storage,p){try{storage.setItem(SAVE_KEY,JSON.stringify(p));return true;}catch{return false;}}
export function saveCurrentFlight(profile,flight){if(!flight||flight.finished||flight.plan.mode!=='career')return false;profile.current=flight.snapshot();return true;}
export function purchase(p,id){const plane=PLANES[id];if(!plane)throw Error('Nie ma takiego samolotu.');if(p.owned.includes(id))return false;if(levelFor(p.xp)<plane.level)throw Error(`Najpierw zdobądź poziom ${plane.level}.`);if(p.credits<plane.price)throw Error('Potrzebujesz więcej monet z ukończonych lotów.');p.credits-=plane.price;p.owned.push(id);return true;}
export const BADGES={first:'Pierwszy kontrakt',smooth:'Miękkie lądowanie',cargo:'Mistrz transportu',night:'Nocny pilot',rain:'Pilot każdej pogody',explorer:'Odkrywca lotnisk',veteran:'10 udanych lotów',engine:'Spokojnie podczas awarii'};
export function completeContract(p,flight){
 if(!flight.finished||!flight.won||flight.plan.mode!=='career')return null;
 if(p.history.some(h=>h.id===flight.id))return null;
 const score=flight.landingScore??50,reward=Math.round(flight.plan.reward*(.6+score/125)*(flight.diverted?.65:1)),xp=Math.round(120+score*2+(flight.handledFailures?70:0));
 p.credits+=reward;p.xp+=xp;p.flights++;p.visited=[...new Set([...p.visited,flight.plan.from,flight.arrivedAirport])];
 p.history.unshift({id:flight.id,from:flight.plan.from,to:flight.arrivedAirport,plane:flight.plan.plane,job:flight.plan.job,score,reward,weather:flight.plan.weather,date:new Date().toISOString()});p.history=p.history.slice(0,40);
 const earned=['first'];if(score>=90)earned.push('smooth');if(flight.plan.job==='cargo')earned.push('cargo');if(flight.plan.weather==='night')earned.push('night');if(flight.plan.weather==='rain')earned.push('rain');if(p.visited.length>=5)earned.push('explorer');if(p.flights>=10)earned.push('veteran');if(flight.handledFailures)earned.push('engine');
 const badges=earned.filter(id=>!p.badges.includes(id));p.badges=[...new Set([...p.badges,...earned])];p.current=null;return {reward,xp,score,badges};
}
