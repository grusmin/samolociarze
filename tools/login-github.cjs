const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {createInterface}=require('node:readline/promises');
const root=path.resolve(__dirname,'..');

function password(prompt){
 return new Promise((resolve,reject)=>{
  if(!process.stdin.isTTY)return reject(Error('Uruchom plik OPUBLIKUJ-GITHUB.cmd dwuklikiem w Eksploratorze Windows.'));
  process.stdout.write(prompt);
  process.stdin.setEncoding('utf8');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  let value='',escape=false;
  function cleanup(){process.stdin.removeListener('data',onData);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');}
  function onData(chunk){
   for(const character of chunk){
    if(character==='\u0003'){cleanup();reject(Error('Anulowano logowanie.'));return;}
    if(character==='\r'||character==='\n'){cleanup();resolve(value);value='';return;}
    if(character==='\u001b'){escape=true;continue;}
    if(escape){if(/[A-Za-z~]/.test(character))escape=false;continue;}
    if(character==='\b'||character==='\u007f'){
     if(value.length){value=value.slice(0,-1);process.stdout.write('\b \b');}
    }else if(/[\x20-\x7e]/.test(character)){
     value+=character;process.stdout.write('*');
    }
   }
  }
  process.stdin.on('data',onData);
 });
}

(async()=>{
 if(/^CodexSandbox/i.test(process.env.USERNAME||''))throw Error('Uruchom OPUBLIKUJ-GITHUB.cmd ze swojego konta Windows w Eksploratorze. Konto techniczne Codex nie moze zapisac metadanych Git.');
 let gitExe='git';
 if(spawnSync(gitExe,['--version'],{windowsHide:true,stdio:'ignore'}).status!==0){
  gitExe=path.join(process.env.USERPROFILE||'','.cache','codex-runtimes','codex-primary-runtime','dependencies','native','git','cmd','git.exe');
  if(!fs.existsSync(gitExe))throw Error('Nie znaleziono Git. Zainstaluj Git for Windows.');
 }
 fs.mkdirSync(path.join(root,'.publikacja'),{recursive:true});
 fs.writeFileSync(path.join(root,'.publikacja/status.json'),JSON.stringify({stage:'waiting_credentials',message:'Otwarto okno logowania; oczekiwanie na login i PAT.',updatedAt:new Date().toISOString()},null,2));
 console.log('\nSAMOLOCIARZE - publikacja na GitHub Pages');
 console.log('Repozytorium: https://github.com/grusmin/samolociarze');
 console.log('Token jest uzywany tylko w pamieci. Uprawnienia: PUBLIKACJA.md.\n');
 const readline=createInterface({input:process.stdin,output:process.stdout});
 const login=(await readline.question('Login GitHub [grusmin]: ')).trim()||'grusmin';
 readline.close();
 let token=(await password('PAT GitHub (ukryty): ')).trim();
 if(!token)throw Error('Nie wpisano tokena.');
 const result=spawnSync(process.execPath,[path.join(__dirname,'publish-github.mjs')],{cwd:root,input:JSON.stringify({login,token}),encoding:'utf8',stdio:['pipe','inherit','inherit'],env:{...process.env,SAMOLOCIARZE_GIT_EXE:gitExe},windowsHide:true});
 token='';
 if(result.error)throw result.error;
 process.exitCode=result.status??1;
})().catch(error=>{console.error('BLAD: '+error.message);process.exitCode=1;});
