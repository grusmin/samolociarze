import {PLANES,DIFFICULTY,WEATHER,clamp,makePlan} from './catalog.js';
import {landingAssistInput} from './landing-assist.js';
import {RUNWAY_X,trafficState} from './traffic.js';
import {APRON_SPAWN,serviceStand,TAXI_LAYOUT,departureRunway,airportGroundAllowed} from './ground.js';
const wrap=n=>Math.atan2(Math.sin(n),Math.cos(n));
const hypot=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const STAGES={toService:'Dojazd do załadunku',boarding:'Załadunek',prep:'Przygotowanie',taxi:'Kołowanie do pasa',hold:'Punkt oczekiwania',lineup:'Zajęcie pasa',takeoff:'Start',climb:'Wznoszenie',cruise:'Na trasie',approach:'Podejście',rollout:'Hamowanie',taxiin:'Kołowanie do rozładunku',unloading:'Rozładunek',complete:'Misja zakończona',failed:'Koniec lotu'};
export const FAILURE_TYPES={left:'Awaria lewego silnika',right:'Awaria prawego silnika',bird:'Ptak w silniku',panel:'Awaria panelu sterowania',gear:'Zacięte podwozie'};
export class Flight{
 constructor(plan){
  this.plan=makePlan(plan);this.id='flight-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);this.spec=PLANES[this.plan.plane];this.rules=DIFFICULTY[this.plan.difficulty];
  Object.assign(this,{x:220,y:7,z:1250,yaw:Math.PI/2,pitch:0,roll:0,velocity:0,throttle:0,fuel:100,flaps:0,gear:true,engines:false,airborne:false,stage:'boarding',elapsed:0,wp:0,cleared:false,landingClearance:false,serviceProgress:0,serviceActive:false,autotaxi:false,taxiIndex:0,brake:false,finished:false,won:false,crashed:false,landingAssist:false,landingAssistPhase:'intercept',landingDirection:1,landingScore:null,landingSink:0,handledFailures:0,damagedEngine:false,diverted:false,arrivedAirport:plan.to,failure:null,comfort:100,verticalSpeed:0,navDistance:0,autoFailureTriggered:false});
  this.runwayIndex=0;this.runwayX=0;this.reservedUntil=0;this.departureReservedUntil=0;this.targetZ=-this.plan.distance;this.windX=this.rules.wind*WEATHER[plan.weather].wind;this.windZ=-this.rules.wind*.35;this.events=[];
  this.taxiLayoutVersion=TAXI_LAYOUT.version;this.airTime=0;
  this.waypoints=[{x:0,y:420,z:-3500},{x:700,y:850,z:-this.plan.distance*.45},{x:-400,y:550,z:this.targetZ+6500},{x:0,y:145,z:this.targetZ+2500}];
  Object.assign(this,APRON_SPAWN,{stage:'toService',yaw:this.plan.job==='cargo'?0:Math.PI});this.arrivedAirport=this.plan.to;
  this.serviceRoute();this.message('Witaj, Samolociarze 01. Uruchom silniki [E] i podjedź do '+this.serviceZone.name+'. Zatrzymaj się w oznaczonym polu; możesz użyć asysty kołowania.');
  if(this.plan.mode==='free'){
   Object.assign(this,{x:this.departureRunway.start.x,y:7,z:this.departureRunway.start.z,yaw:0,pitch:0,roll:0,velocity:0,throttle:0,gear:true,flaps:1,engines:true,airborne:false,stage:'takeoff',wp:4,cleared:true,serviceActive:false,serviceProgress:0,taxiPath:[]});this.departureReservedUntil=180;
   this.events=[];this.message('Po prostu leć! Jesteś na początku pasa '+this.departureRunway.number+'. Silniki pracują, klapy 1, zgoda na start jest wydana. Dodaj moc do 100%, potem S / ↓ przy '+Math.round(this.spec.rotate*1.944)+' kt. Po locie T wybiera lotnisko do lądowania.');
  }
 }
 get failed(){return !!this.failure?.active;}
 get engineFault(){return this.failed&&['left','right','bird'].includes(this.failure.type);}
 get failureSide(){return this.failure?.type==='right'?-1:1;}
 get traffic(){return trafficState(this.arrivedAirport,this.elapsed,this.runwayIndex,this.landingClearance&&this.elapsed<this.reservedUntil);}
 get serviceZone(){return serviceStand(this.plan.job,['taxiin','unloading','complete'].includes(this.stage)?this.targetZ:0);}
 get serviceDistance(){return hypot(this,this.serviceZone);}
 get atServiceZone(){return !this.airborne&&this.serviceDistance<=this.serviceZone.radius;}
 get canService(){return ['boarding','unloading'].includes(this.stage)&&this.atServiceZone&&this.velocity<.5&&this.throttle<=.05;}
 get serviceDuration(){return this.plan.job==='cargo'?2:this.stage==='boarding'?20:7;}
 get departureRunway(){return departureRunway(this.plan.from);}
 get nearestAirport(){return Math.hypot(this.x,this.z)<=Math.hypot(this.x,this.z+this.plan.distance)?{code:this.plan.from,z:0}:{code:this.plan.to,z:-this.plan.distance};}
 get target(){if(this.plan.mode==='free'&&this.airborne&&this.stage!=='approach')return {x:0,y:7,z:this.nearestAirport.z};if(['toService','boarding','prep','unloading'].includes(this.stage))return this.serviceZone;if(['taxi','hold','lineup','taxiin'].includes(this.stage))return {...(this.taxiPath[this.taxiIndex]||this.taxiPath.at(-1)),y:7};if(this.wp<4&&this.plan.mode!=='free'&&!this.diverted)return this.waypoints[this.wp];return {x:this.runwayX,y:7,z:this.targetZ+(this.plan.mode==='free'?(this.z>=this.targetZ?1000:-1000):this.diverted&&this.targetZ===0?-1000:1000)};}
 serviceRoute(){const stand=this.serviceZone;this.taxiIndex=0;this.taxiPath=[{x:220,z:stand.z},{x:stand.x,z:stand.z}];}
 departureRoute(){this.taxiIndex=0;const exit=this.x<100?[{x:this.x,z:1250},{x:TAXI_LAYOUT.x,z:1250}]:[{x:TAXI_LAYOUT.x,z:this.z}];this.taxiPath=[...exit,{x:TAXI_LAYOUT.x,z:TAXI_LAYOUT.rearZ},{...this.departureRunway.hold}];this.taxiLayoutVersion=TAXI_LAYOUT.version;}
 lineupRoute(){this.taxiIndex=0;this.taxiPath=[{x:0,z:TAXI_LAYOUT.rearZ},{...this.departureRunway.start}];}
 arrivalRoute(){const stand=this.serviceZone,exitZ=clamp(this.z-this.targetZ,-950,1200)+this.targetZ;this.taxiIndex=0;this.taxiPath=[{x:160,z:exitZ},{x:160,z:stand.z},{x:stand.x,z:stand.z}];}
 message(text){this.events.push(text);}
 action(name,value){
  if(this.finished)return;
  if(name==='throttle')this.throttle=clamp(Number(value)||0,0,1);
  if(name==='service'){
   if(['toService','boarding','unloading'].includes(this.stage)){if(!this.canService)return this.message(!this.atServiceZone?'Obsługa: najpierw podjedź do '+this.serviceZone.name+'.':this.stage==='toService'||this.velocity>=.5?'Obsługa: zatrzymaj samolot hamulcem [H].':'Obsługa: zmniejsz moc do 0%, aby rozpocząć załadunek.');this.serviceActive=true;this.autotaxi=false;this.message(this.stage==='boarding'?'Obsługa naziemna: rozpoczynamy załadunek.':'Obsługa naziemna: rozpoczynamy rozładunek.');}
   else if(['taxi','lineup','taxiin'].includes(this.stage)){this.autotaxi=!this.autotaxi;this.message(this.autotaxi?'Asysta kołowania włączona. Silniki muszą pracować. Możesz ją wyłączyć przyciskiem.':'Asysta kołowania wyłączona.');}
  }
  if(name==='assist'&&['toService','boarding','taxi','lineup','taxiin'].includes(this.stage)){if(this.stage==='boarding'){this.stage='toService';this.serviceRoute();}this.autotaxi=!this.autotaxi;this.message(this.autotaxi?'Asysta kołowania włączona. Silniki muszą pracować. Hamulec [H] zatrzymuje samolot.':'Asysta kołowania wyłączona.');}
  if(name==='engine'){
   if(this.serviceActive)return this.message('Zaczekaj na zakończenie obsługi naziemnej.');
   if(!this.engines&&this.fuel>0){this.engines=true;this.throttle=.08;this.message('Silniki pracują. Wieża [T] potwierdzi dalsze instrukcje.');}
  }
  if(name==='tower')this.radio();
  if(name==='landingAssist'){if(!this.airborne)return this.message('Asysta lądowania jest dostępna po starcie.');if(this.stage!=='approach'||!this.landingClearance)return this.message('Najpierw poproś wieżę [T] o zgodę na lądowanie.');this.landingAssist=!this.landingAssist;this.landingDirection=this.plan.mode==='free'||this.diverted?(this.z>=this.targetZ?1:-1):1;this.landingAssistPhase='intercept';const along=(this.z-this.targetZ)*this.landingDirection;if(along>0&&along<5300&&Math.abs(this.x-this.runwayX)<180&&Math.abs(Math.atan2(Math.sin((this.landingDirection===1?0:Math.PI)-this.yaw),Math.cos((this.landingDirection===1?0:Math.PI)-this.yaw)))<.35)this.landingAssistPhase='final';this.message(this.landingAssist?'Asysta lądowania włączona: ustawiamy kurs, moc, podwozie i klapy. Strzałki lub WASD oddają Ci sterowanie.':'Asysta lądowania wyłączona.');}
  if(name==='gear'){
   if(!this.airborne)return this.message('Podwozie chowamy dopiero po starcie.');
   if(this.failed&&this.failure.type==='gear')return this.message('Podwozie zacięte. Użyj procedury awaryjnego wysunięcia.');
   this.gear=!this.gear;
  }
  if(name==='flaps'){
   if(this.velocity>105)return this.message('Za duża prędkość na klapy. Zwolnij poniżej 200 kt.');
   this.flaps=(this.flaps+1)%3;
  }
  if(name==='failure')this.triggerFailure(value);
  if(name==='repair')this.repair();
  if(name==='runway'&&this.airborne){this.runwayIndex=1-this.runwayIndex;this.runwayX=RUNWAY_X[this.runwayIndex];this.landingClearance=false;this.reservedUntil=0;this.message('Wybrany pas '+(this.runwayIndex===0?'prawy':'lewy')+'. Sprawdź mapę i ponownie poproś wieżę [T] o zgodę.');}
  if(name==='divert'&&this.airborne){
   this.diverted=true;this.wp=4;this.targetZ=Math.abs(this.z)<Math.abs(this.z+this.plan.distance)?0:-this.plan.distance;this.arrivedAirport=this.targetZ===0?this.plan.from:this.plan.to;this.stage='approach';this.landingClearance=false;this.message('MAYDAY przyjęty. Leć do najbliższego lotniska oznaczonego na mapie. Poproś [T] o priorytet do lądowania.');
  }
 }
 radio(){
  if(this.plan.mode==='free'&&this.stage==='takeoff')return this.message('Wieża: zgoda na start z pasa '+this.departureRunway.number+'. Klapy 1, moc 100%. Po starcie schowaj podwozie [G].');
  if(this.plan.mode==='free'&&this.airborne&&this.stage!=='approach'){const airport=this.nearestAirport;this.targetZ=airport.z;this.arrivedAirport=airport.code;this.stage='approach';this.landingClearance=false;}
  if(['toService','boarding'].includes(this.stage))return this.message('Wieża: podjedź do '+this.serviceZone.name+', zatrzymaj się i załaduj samolot.');
  if(!this.engines&&!this.airborne)return this.message('Wieża: najpierw załadunek i silniki.');
  if(this.stage==='prep'){this.stage='taxi';this.departureRoute();this.message('Wieża: do startu pas '+this.departureRunway.label+'. Trasa A prowadzi do niego bez przekraczania drugiego pasa. Kołuj za tyłem pasa do znaku STOP; stąd wykorzystasz pełną długość rozbiegu. Nie wjeżdżaj na pas bez zgody [T].');return;}
  if(this.stage==='hold'){if(hypot(this,this.departureRunway.hold)>20)return this.message('Wieża: zatrzymaj się przy znaku STOP przed wjazdem na pas '+this.departureRunway.number+'.');const traffic=trafficState(this.plan.from,this.elapsed,this.departureRunway.index);if(traffic.busy)return this.message('Wieża: pas '+this.departureRunway.number+' zajęty, ląduje inny samolot. Czekaj przy STOP około '+traffic.wait+' s i zgłoś się ponownie [T].');this.departureReservedUntil=this.elapsed+180;this.stage='lineup';this.cleared=true;this.lineupRoute();this.message('Wieża: pas '+this.departureRunway.number+' wolny. Zgoda na zajęcie pasa i start. Podjedź od tyłu do niebieskiej strzałki i ustaw nos wzdłuż białej linii. Rozbieg: '+(this.departureRunway.available/1000).toFixed(1)+' km.');return;}
  if(this.stage==='taxi')return this.message('Wieża: pas '+this.departureRunway.label+'. Trasa A biegnie za końcem pasa. Zatrzymaj się przy pomarańczowym STOP i poproś o zgodę [T].');
  if(this.stage==='lineup')return this.message('Wieża: zgoda na pas '+this.departureRunway.number+' jest wydana. Podjedź do niebieskiej strzałki na początku pasa i ustaw nos prosto. Możesz włączyć asystę.');
  if(this.stage==='approach'||this.plan.mode==='free'&&this.airborne){
   const dist=Math.hypot(this.x-this.runwayX,this.z-this.targetZ);if(dist>11000&&!this.diverted)return this.message('Wieża: jesteś jeszcze za daleko. Zgłoś się bliżej lotniska.');
   if(this.traffic.busy&&!this.diverted)return this.message('Wieża: BRAK ZGODY, pas zajęty przez inny samolot. Oczekuj około '+this.traffic.wait+' s albo wybierz drugi pas [R] i zgłoś się ponownie.');
   this.landingClearance=true;this.reservedUntil=this.elapsed+120;this.message(`Wieża: ${this.diverted?'priorytet awaryjny, ':''}zgoda na lądowanie na ${this.runwayIndex===0?'prawym':'lewym'} pasie. Podwozie i klapy 2. Cel: ${Math.round((this.spec.stall+15)*1.944)} kt. Wiatr boczny ${Math.round(this.windX)} m/s.`);return;
  }
  if(this.stage==='rollout'||this.stage==='taxiin')return this.message('Wieża: opuść pas w prawo, kołuj do '+serviceStand(this.plan.job).name+'.');
  this.message(`Kontrola: punkt ${Math.min(4,this.wp+1)}/4, wysokość ${this.target.y} m. Wiatr boczny ${Math.round(this.windX)} m/s.`);
 }
 triggerFailure(type){
  if(!this.airborne)return this.message('Awarię treningową włącz dopiero po starcie.');if(this.failed)return;
  type=FAILURE_TYPES[type]?type:['left','right','bird','panel','gear'][Math.floor(Math.random()*5)];
  this.failure={type,active:true,time:0};if(type==='gear')this.gear=false;
  this.message(FAILURE_TYPES[type]+'. '+(type==='panel'?'Stery reagują słabiej. Włącz zasilanie zapasowe.':type==='gear'?'Zwolnij poniżej 190 kt i użyj awaryjnego wysunięcia.':'Silnik dymi, samolot ściąga na jego stronę. Zmniejsz moc poniżej 35%, potem zabezpiecz silnik.'));
 }
 repair(){
  if(!this.failed)return;
  const type=this.failure.type;
  if(['left','right','bird'].includes(type)&&this.throttle>.35)return this.message('Procedura: najpierw zmniejsz moc do 35% lub mniej, następnie zabezpiecz silnik.');
  if(type==='gear'&&this.velocity>98)return this.message('Zwolnij poniżej 190 kt, aby awaryjnie wysunąć podwozie.');
  if(type==='gear')this.gear=true;
  if(['left','right','bird'].includes(type))this.damagedEngine=true;
  this.failure.active=false;this.handledFailures++;this.message(this.damagedEngine?'Silnik zabezpieczony. Dym zanika. Pozostałe silniki pracują, dostępna moc ograniczona. Możesz poprosić o lądowanie awaryjne.':'Procedura zakończona. System wrócił do działania.');
 }
 finish(won,message,crashed=false){if(this.finished)return;this.finished=true;this.won=won;this.crashed=!won&&crashed;if(this.crashed){this.impactSpeed=this.velocity;this.velocity=0;this.engines=false;this.airborne=false;}this.resultMessage=message;this.stage=won?'complete':'failed';this.throttle=0;this.message(message);}
 groundAllowed(){return [0,-this.plan.distance].some(z=>airportGroundAllowed(this.x,this.z-z));}
 update(dt,input={}){
  if(this.finished)return;input=landingAssistInput(this,input);dt=clamp(dt,0,.05);this.elapsed+=dt;if(this.airborne)this.airTime+=dt;
  this.throttle=clamp(this.throttle+(input.power||0)*dt*.25,0,1);this.brake=!!input.brake;
  if(this.serviceActive){if(!this.canService){this.serviceActive=false;this.serviceProgress=0;this.message('Obsługa przerwana. Zatrzymaj się w oznaczonym polu i ustaw moc na 0%.');}else{this.velocity=0;this.serviceProgress+=dt/this.serviceDuration;if(this.serviceProgress>=1){this.serviceActive=false;this.serviceProgress=0;if(this.stage==='boarding'){this.stage='prep';this.message('Załadunek zakończony. Skontaktuj się z wieżą [T] przed kołowaniem do pasa.');}else if(this.stage==='unloading')this.finish(true,'Rozładunek zakończony. Kontrakt wykonany!');}return;}}
  if(['unloading','prep'].includes(this.stage)){this.velocity=0;return;}
  const onTaxi=['toService','boarding','taxi','lineup','taxiin','hold'].includes(this.stage),onRollout=this.stage==='rollout';
  const factor=this.engineFault?.64:this.damagedEngine?.78:1;
  const max=onTaxi?24:this.spec.cruise*(this.gear&&this.airborne?.9:1)*(1-this.flaps*.06);
  const target=this.engines?this.throttle*max*factor:0;
  this.velocity+=(target-this.velocity)*dt*(this.airborne?.14:.12);
  if(this.brake)this.velocity=Math.max(0,this.velocity-dt*(this.airborne?4:WEATHER[this.plan.weather].rain?12:17));
  if(this.stage==='hold'){this.velocity=0;this.throttle=0;return;}
  if(this.engines&&this.plan.mode==='career')this.fuel=Math.max(0,this.fuel-dt*(.012+this.throttle*.035));if(!this.fuel){this.engines=false;this.message('Brak paliwa. Szybuj do najbliższego lotniska.');}
  const authority=this.failed?(this.failure.type==='panel'?.35:.55):1,steer=input.steer||0,elev=input.elev||0;
  if(onTaxi&&this.autotaxi&&this.engines){
   if(this.brake){this.velocity=0;this.throttle=0;return;}
   const point=this.taxiPath[this.taxiIndex];if(point){const dist=hypot(this,point),desired=Math.atan2(this.x-point.x,this.z-point.z);this.yaw+=clamp(wrap(desired-this.yaw),-dt*.7,dt*.7);this.velocity=Math.min(8,Math.max(3,dist));this.throttle=.2;if(dist<5)this.taxiIndex++;}
   if(this.taxiIndex>=this.taxiPath.length){this.autotaxi=false;this.velocity=0;this.throttle=0;if(this.stage==='taxi'){this.stage='hold';this.yaw=Math.PI/2;this.message('STOP przed pasem '+this.departureRunway.number+'. Poproś wieżę [T] o zgodę na zajęcie pasa i start.');}else if(this.stage==='lineup'){this.stage='takeoff';this.yaw=0;this.message('Ustawiony na początku pasa '+this.departureRunway.number+'. Moc 100%, klapy 1 [F], unieś nos przy '+Math.round(this.spec.rotate*1.944)+' kt.');}else{this.stage=this.stage==='toService'?'boarding':'unloading';this.message('Stanowisko osiągnięte. Moc 0%. Rozpocznij '+(this.stage==='boarding'?'załadunek.':'rozładunek.'));}return;}
  }else this.yaw+=steer*dt*(this.airborne?(this.landingAssist?.26:.15):.65)*authority*clamp(this.velocity/(this.airborne?35:5),0,1);
  if(this.engineFault)this.yaw+=dt*this.failureSide*(.011+Math.sin(this.elapsed*1.9)*.004);
  const turbulence=WEATHER[this.plan.weather].rain?Math.sin(this.elapsed*3.3)*.035:Math.sin(this.elapsed*1.4)*.006;
  const rollTarget=this.airborne?steer*.32+(this.engineFault?.09*this.failureSide:0)+turbulence:0;this.roll+=(rollTarget-this.roll)*(1-Math.exp(-dt*3));if(this.landingAssist&&this.y<35)this.roll*=Math.exp(-dt*8);
  this.pitch=clamp(this.pitch+elev*dt*.16*authority,-.22,.28);if(!this.airborne&&this.velocity<this.spec.rotate)this.pitch=0;
  let climb=this.velocity*Math.sin(this.pitch);const stall=this.spec.stall-this.flaps*3;
  if(this.airborne&&this.velocity<stall+7)climb-=Math.min(18,(stall+7-this.velocity)*.7);
  if(this.rules.assist&&this.stage==='approach'&&this.landingClearance&&this.gear&&this.y<30&&Math.abs(this.x)<40){climb=Math.max(climb,-3);this.pitch=Math.max(this.pitch,-.04);}
  if(this.stage==='takeoff'&&climb>2&&this.velocity>this.spec.rotate){this.airborne=true;this.stage=this.plan.mode==='free'?'cruise':'climb';this.message('Wieża: udanego lotu! Schowaj podwozie [G], schowaj klapy [F], leć trasą GPS.');}
  const wind=this.airborne?this.windX*(1+Math.sin(this.elapsed*.37)*.15):0;
  this.x+=(-Math.sin(this.yaw)*this.velocity+wind)*dt;this.z+=(-Math.cos(this.yaw)*this.velocity+(this.airborne?this.windZ:0))*dt;
  if(this.airborne)this.y+=climb*dt;this.verticalSpeed=climb;
  if(this.stage==='taxi'&&!this.autotaxi&&hypot(this,this.departureRunway.hold)<15&&this.velocity<2){this.stage='hold';this.velocity=0;this.throttle=0;this.message('STOP przed pasem '+this.departureRunway.number+'. Poproś wieżę [T] o zgodę.');}
  if(this.stage==='lineup'&&!this.autotaxi&&this.cleared&&hypot(this,this.departureRunway.start)<20&&Math.abs(wrap(this.yaw))<.045&&this.velocity<3){this.stage='takeoff';this.velocity=0;this.throttle=0;this.message('Początek pasa '+this.departureRunway.number+'. Moc 100%, klapy 1 [F]. Zgoda na start jest wydana.');}
  if(this.failed)this.failure.time+=dt;
  if(this.airborne&&this.plan.difficulty==='expert'&&this.plan.mode==='career'&&this.airTime>170&&!this.autoFailureTriggered){this.autoFailureTriggered=true;this.triggerFailure('bird');}
  if(this.airborne&&this.y<=7){
   this.y=7;const onRunway=Math.abs(this.x-this.runwayX)<43&&Math.abs(this.z-this.targetZ)<1530,alignment=this.diverted||this.plan.mode==='free'?Math.abs(Math.cos(this.yaw))>.95:Math.cos(this.yaw)>.95;
   const ready=(this.wp>=4||this.plan.mode==='free'||this.diverted)&&this.landingClearance;
   if(onRunway&&ready&&this.gear&&this.velocity>stall-2&&this.velocity<this.spec.stall+34&&climb>-this.rules.sink&&Math.abs(this.roll)<this.rules.roll&&alignment){
    this.airborne=false;this.stage='rollout';this.throttle=0;this.pitch=0;this.landingSink=Math.abs(climb);this.landingScore=Math.round(clamp(100-this.landingSink*9-Math.abs(this.x-this.runwayX)*.5-Math.abs(this.roll)*75-(100-this.comfort)*.2,10,100));this.message(`Przyziemienie ${this.landingSink.toFixed(1)} m/s. Hamuj [H]. Ocena: ${this.landingScore}/100.`);
   }else{this.finish(false,!onRunway?'Przyziemienie poza pasem. Sprawdź mapę i wróć na podejście.':!this.gear?'Podwozie nie było wysunięte.':!ready?'Brak zgody lub nieukończona trasa. Poproś wieżę o lądowanie.':!alignment?'Samolot był ustawiony bokiem do pasa.':Math.abs(this.roll)>=this.rules.roll?'Wyrównaj skrzydła tuż przed przyziemieniem.':climb<=-this.rules.sink?'Za twarde przyziemienie. Wyrównaj lot bliżej pasa i zmniejsz opadanie.':'Nieprawidłowa prędkość lądowania. Podejdź z klapami 2 i mocą około 40–50%.',!onRunway||!this.gear||!alignment||Math.abs(this.roll)>=this.rules.roll||climb<=-this.rules.sink||this.velocity<=stall-2||this.velocity>=this.spec.stall+34);return;}
  }
  if(!this.airborne&&this.velocity>15&&!this.groundAllowed()){this.finish(false,'Samolot opuścił pas lub drogę kołowania. Na ziemi jedź wolniej.',true);return;}
  if(onRollout&&this.velocity<2){if(this.plan.mode==='free')return this.finish(true,'Udane lądowanie! Możesz od razu rozpocząć kolejny swobodny lot.');this.stage='taxiin';this.arrivalRoute();this.message('Samolot zatrzymany. Kołuj do '+this.serviceZone.name+'; możesz włączyć asystę naziemną.');}
  if(this.stage==='toService'&&!this.autotaxi&&this.atServiceZone&&this.velocity<.5){this.stage='boarding';this.throttle=0;this.message('Jesteś przy stanowisku. Rozpocznij załadunek.');}
  if(this.stage==='boarding'&&!this.atServiceZone){this.stage='toService';this.serviceRoute();}
  if(this.stage==='taxiin'&&!this.autotaxi&&this.atServiceZone&&this.velocity<.5){this.stage='unloading';this.velocity=0;this.throttle=0;this.message('Na stanowisku. Rozpocznij rozładunek.');}
  if(this.airborne&&this.wp<4&&this.plan.mode!=='free'&&!this.diverted){const point=this.waypoints[this.wp];if(Math.hypot(this.x-point.x,this.y-point.y,this.z-point.z)<this.rules.ring){this.wp++;this.stage=this.wp>=4?'approach':'cruise';this.message(this.wp>=4?'Ostatni punkt zaliczony. Poproś wieżę [T] o zgodę. Podwozie, klapy 2 i łagodne zniżanie.':`Punkt zaliczony! Następny ${this.wp+1}/4: ${this.waypoints[this.wp].y} m.`);}}
  this.comfort=clamp(this.comfort-Math.max(0,Math.abs(climb)-20)*dt*.02-Math.max(0,Math.abs(this.roll)-.28)*dt*.2,0,100);
  if(this.y>4000){this.y=4000;this.pitch=Math.min(0,this.pitch);}
  if(this.plan.mode==='career'&&(Math.abs(this.x)>22000||this.z>14000||this.z< -this.plan.distance-16000))this.finish(false,'Opuściłeś obszar tej misji. Mapa pokazuje trasę i dwa lotniska.');
  this.navDistance=Math.hypot(this.target.x-this.x,this.target.z-this.z);
 }
 snapshot(){const state={};for(const key of ['id','x','y','z','yaw','pitch','roll','velocity','throttle','fuel','flaps','gear','engines','airborne','stage','elapsed','airTime','wp','cleared','landingClearance','serviceProgress','serviceActive','autotaxi','taxiIndex','taxiPath','taxiLayoutVersion','landingScore','landingSink','handledFailures','damagedEngine','diverted','arrivedAirport','failure','comfort','targetZ','autoFailureTriggered','runwayIndex','runwayX','reservedUntil','departureReservedUntil','landingAssist','landingAssistPhase','landingDirection'])state[key]=this[key];return {plan:this.plan,state};}
 static restore(saved){const f=new Flight(saved.plan),s=saved.state;if(!s||!STAGES[s.stage]||['complete','failed'].includes(s.stage)||!['x','y','z','yaw','pitch','roll','velocity','elapsed'].every(k=>Number.isFinite(s[k])))throw Error('Nieprawidłowy zapis lotu.');if(Math.abs(s.x)>22000||s.y<7||s.y>4000||Math.abs(s.z)>70000||s.velocity<0||s.velocity>300)throw Error('Nieprawidłowa pozycja samolotu.');for(const key of Object.keys(f.snapshot().state))if(s[key]!==undefined)f[key]=s[key];
  // Older saves may park cargo at the passenger terminal. Keep their position,
  // but guide them to the new cargo stand before allowing service.
  if(['toService','boarding'].includes(f.stage)&&!f.atServiceZone){f.stage='toService';f.serviceActive=false;f.serviceProgress=0;f.serviceRoute();}
  if(['taxiin','unloading'].includes(f.stage)&&!f.atServiceZone){f.stage='taxiin';f.serviceActive=false;f.serviceProgress=0;f.arrivalRoute();}
  if(s.taxiLayoutVersion!==TAXI_LAYOUT.version&&['taxi','hold'].includes(f.stage)){f.stage='taxi';f.cleared=false;f.departureReservedUntil=0;f.departureRoute();}
  if(f.plan.mode==='free'&&['toService','boarding','prep','taxi','hold','lineup','takeoff','taxiin','unloading'].includes(f.stage)&&!f.airborne)return new Flight(f.plan);
  f.events=[];return f;}
}
