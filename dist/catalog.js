export const GAME_VERSION='1.0.8';
export const AIRPORTS={
 WAW:{name:'Warszawa Okęcie',city:'Warszawa',country:'Polska',lat:52.17,lon:20.97,biome:'fields',runway:'33',color:'#81966a'},
 LHR:{name:'Londyn Heathrow',city:'Londyn',country:'Wielka Brytania',lat:51.47,lon:-.45,biome:'river',runway:'27',color:'#75956f'},
 JFK:{name:'Nowy Jork JFK',city:'Nowy Jork',country:'USA',lat:40.64,lon:-73.78,biome:'coast',runway:'31',color:'#8c9775'},
 FRA:{name:'Frankfurt',city:'Frankfurt',country:'Niemcy',lat:50.04,lon:8.56,biome:'forest',runway:'25',color:'#6c8b60'},
 CDG:{name:'Paryż Charles de Gaulle',city:'Paryż',country:'Francja',lat:49.01,lon:2.55,biome:'river',runway:'26',color:'#89956d'},
 BCN:{name:'Barcelona El Prat',city:'Barcelona',country:'Hiszpania',lat:41.30,lon:2.08,biome:'coast',runway:'24',color:'#ab9f74'},
 LAX:{name:'Los Angeles LAX',city:'Los Angeles',country:'USA',lat:33.94,lon:-118.41,biome:'coast',runway:'25',color:'#b4a37b'},
 HND:{name:'Tokio Haneda',city:'Tokio',country:'Japonia',lat:35.55,lon:139.78,biome:'coast',runway:'34',color:'#7e9472'},
 PEK:{name:'Pekin Capital',city:'Pekin',country:'Chiny',lat:40.08,lon:116.60,biome:'mountains',runway:'36',color:'#9e9774'},
 ICN:{name:'Seul Incheon',city:'Seul',country:'Korea Południowa',lat:37.46,lon:126.44,biome:'coast',runway:'33',color:'#7f946f'},
 BOG:{name:'Bogota El Dorado',city:'Bogota',country:'Kolumbia',lat:4.70,lon:-74.15,biome:'mountains',runway:'14',color:'#6f8d5f'}
};
export const PLANES={
 a380:{name:'Airbus A380',livery:'Emirates',engines:4,span:79.8,length:72.7,range:15200,seats:525,cargo:80,rotate:72,stall:56,cruise:165,price:0,level:1},
 b747:{name:'Boeing 747-400',livery:'KLM',engines:4,span:65.4,length:70.9,range:13400,seats:416,cargo:112,rotate:70,stall:55,cruise:160,price:0,level:1},
 an225:{name:'Antonow An-225 Mrija',livery:'Malowanie historyczne',engines:6,span:87.9,length:82.2,range:15000,seats:0,cargo:250,rotate:74,stall:57,cruise:148,price:0,level:1},
 b738:{name:'Boeing 737-800',livery:'Ryanair',engines:2,span:35.69,length:39.4,range:5400,seats:189,cargo:20,rotate:62,stall:48,cruise:145,price:1800,level:1},
 a320:{name:'Airbus A320',livery:'Malowanie modelu FlightGear',engines:2,span:33.91,length:37.6,range:6100,seats:180,cargo:18,rotate:61,stall:47,cruise:145,price:2200,level:1},
 b763:{name:'Boeing 767-300',livery:'Malowanie modelu FlightGear',engines:2,span:46.31,length:54.9,range:11000,seats:269,cargo:54,rotate:66,stall:51,cruise:150,price:4200,level:2},
 beluga:{name:'Airbus Beluga ST',livery:'Transport ponadgabarytowy',engines:2,span:45.06,length:56.2,range:2800,seats:0,cargo:47,rotate:60,stall:46,cruise:130,price:5000,level:2},
 b788:{name:'Boeing 787-8',livery:'Malowanie modelu FlightGear',engines:2,span:59.6,length:56.7,range:13600,seats:242,cargo:50,rotate:65,stall:50,cruise:160,price:7000,level:3},
 a343:{name:'Airbus A340-300',livery:'Malowanie modelu FlightGear',engines:4,span:60.19,length:63.7,range:13000,seats:295,cargo:65,rotate:68,stall:52,cruise:155,price:8000,level:3},
 b772:{name:'Boeing 777-200',livery:'Malowanie modelu FlightGear',engines:2,span:60.72,length:63.7,range:9700,seats:305,cargo:75,rotate:68,stall:52,cruise:160,price:10000,level:4},
 conc:{name:'Concorde',livery:'Air France',engines:4,span:25.56,length:61.66,range:7250,seats:100,cargo:10,rotate:91,stall:72,cruise:260,price:9000,level:3},
 a359:{name:'Airbus A350-900',livery:'Malowanie modelu FlightGear',engines:2,span:64.75,length:66.8,range:15000,seats:325,cargo:75,rotate:67,stall:51,cruise:165,price:12000,level:4}
};
export const WEATHER={sun:{name:'Słoneczny dzień',icon:'☀',wind:1,fog:26000,night:false,rain:false},wind:{name:'Wiatr boczny',icon:'➜',wind:1.7,fog:24000,night:false,rain:false},rain:{name:'Deszcz i turbulencje',icon:'☂',wind:1.4,fog:11500,night:false,rain:true},sunset:{name:'Zachód słońca',icon:'◐',wind:.85,fog:22000,night:false,rain:false},night:{name:'Lot nocny',icon:'☾',wind:1.1,fog:17000,night:true,rain:false}};
export const DIFFICULTY={rookie:{name:'Trening',wind:1.5,sink:6.5,roll:.22,ring:360,multiplier:1,assist:true},captain:{name:'Kapitan',wind:6,sink:4,roll:.15,ring:300,multiplier:1.4,assist:false},expert:{name:'Ekspert',wind:10,sink:2.8,roll:.11,ring:250,multiplier:1.8,assist:false}};
export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function distanceKm(from,to){const a=AIRPORTS[from],b=AIRPORTS[to],r=Math.PI/180,dLat=(b.lat-a.lat)*r,dLon=(b.lon-a.lon)*r;return Math.round(6371*2*Math.asin(Math.sqrt(Math.sin(dLat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLon/2)**2)));}
export function makePlan({from='WAW',to='LHR',plane='a380',job='passengers',weather='wind',difficulty='captain',mode='career'}={}){
 if(mode==='free'&&AIRPORTS[from]){if(!AIRPORTS[to]||from===to)to=Object.keys(AIRPORTS).find(code=>code!==from);if(PLANES[plane])job=PLANES[plane].seats?'passengers':'cargo';}
 if(!AIRPORTS[from]||!AIRPORTS[to]||from===to)throw Error('Wybierz dwa różne lotniska.');
 if(!PLANES[plane]||!WEATHER[weather]||!DIFFICULTY[difficulty]||!['passengers','cargo'].includes(job)||!['career','free'].includes(mode))throw Error('Nieprawidłowy plan lotu.');
 const km=distanceKm(from,to),spec=PLANES[plane];if(job==='passengers'&&!spec.seats)throw Error('Ten samolot przewozi towary.');if(mode==='career'&&km>spec.range)throw Error('Trasa przekracza zasięg tego samolotu. Wybierz bliższe lotnisko.');
 const distance=clamp(18000+km*2.2,20000,37000),base=Math.round((650+km*.12+(job==='cargo'?200:spec.seats*.65))*DIFFICULTY[difficulty].multiplier);
 return {from,to,plane,job,weather,difficulty,mode,km,distance,reward:mode==='free'?0:base,minutes:Math.round(distance/(spec.cruise*.8)/60)+3,payload:mode==='free'?0:job==='cargo'?Math.round(spec.cargo*.8):Math.round(spec.seats*.86)};
}
