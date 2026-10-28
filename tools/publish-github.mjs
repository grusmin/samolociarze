import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {PLANES} from '../dist/catalog.js';

const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const owner='grusmin', repository='samolociarze';
const remote=`https://github.com/${owner}/${repository}.git`;
const apiRoot=`/repos/${owner}/${repository}`;
const expectedSite=`https://${owner}.github.io/${repository}/`;
const statusFile=path.join(root,'.publikacja','status.json');
const gitExe=process.env.SAMOLOCIARZE_GIT_EXE||'git';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const digest=buffer=>createHash('sha256').update(buffer).digest('hex');
function publishedMatches(name,remoteBytes){const local=fs.readFileSync(path.join(root,'dist',name));const normal=bytes=>/\.(html|js|css|gltf|json|xml|txt|md)$/i.test(name)?Buffer.from(bytes.toString('utf8').replace(/\r\n/g,'\n')):bytes;return digest(normal(remoteBytes))===digest(normal(local));}
let token='',basic='',gitEnvironment={...process.env},status={repository:remote,folder:root};

function redact(text){return String(text).replaceAll(token||'\0','[TOKEN]').replaceAll(basic||'\0','[AUTH]');}
function progress(stage,message,extra={}){
 status={...status,...extra,stage,message,updatedAt:new Date().toISOString()};
 fs.mkdirSync(path.dirname(statusFile),{recursive:true});
 fs.writeFileSync(statusFile,JSON.stringify(status,null,2));
 console.log(message);
}
function git(args,{allowFailure=false}={}){
 const result=spawnSync(gitExe,['-c',`safe.directory=${root.replaceAll('\\','/')}`,'-c','http.sslBackend=openssl','-c','credential.helper=','-c','core.askPass=','-C',root,...args],{encoding:'utf8',env:gitEnvironment,windowsHide:true,maxBuffer:16*1024*1024});
 if(result.error)throw Error(redact(result.error.message));
 if(result.status!==0&&!allowFailure)throw Error(redact(result.stderr||result.stdout||`Git: ${args[0]} (${result.status})`));
 return {ok:result.status===0,text:result.stdout.trim(),error:result.stderr.trim()};
}
async function api(endpoint,{method='GET',data,allow404=false}={}){
 const response=await fetch(`https://api.github.com${endpoint}`,{method,redirect:'error',signal:AbortSignal.timeout(60000),headers:{Accept:'application/vnd.github+json','User-Agent':'Samolociarze-publisher','X-GitHub-Api-Version':'2022-11-28',Authorization:`Bearer ${token}`,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});
 const text=await response.text();
 let body={};try{body=text?JSON.parse(text):{};}catch{throw Error(`GitHub API: nieoczekiwana odpowiedź (${response.status}).`);}
 if(allow404&&response.status===404)return null;
 if(!response.ok){
  const permissions=response.headers.get('x-accepted-github-permissions');
  throw Error(`GitHub ${method} ${endpoint}: ${response.status} — ${redact(body.message||response.statusText)}${permissions?`\nWymagane uprawnienia: ${permissions}`:''}`);
 }
 return body;
}
function checkFiles(){
 const dist=path.join(root,'dist');
 for(const name of ['index.html','career.html','app.js','three.module.js','models/CREDITS.md','models/GPL-2.0.txt'])if(!fs.existsSync(path.join(dist,name)))throw Error(`Brak pliku gry: ${name}`);
 if(digest(fs.readFileSync(path.join(dist,'index.html')))!==digest(fs.readFileSync(path.join(dist,'career.html'))))throw Error('index.html i career.html różnią się. Ujednolić strony przed publikacją.');
 const modelFiles=fs.readdirSync(path.join(dist,'models')).filter(name=>name.endsWith('.gltf'));
 if(Object.keys(PLANES).some(type=>!modelFiles.includes(type+'.gltf')))throw Error('Brak modelu samolotu z katalogu.');
 for(const name of modelFiles){
  const file=path.join(dist,'models',name),model=JSON.parse(fs.readFileSync(file,'utf8'));
  for(const resource of [...(model.buffers||[]),...(model.images||[])]){
   if(!resource.uri||resource.uri.startsWith('data:'))continue;
   const asset=path.resolve(path.dirname(file),decodeURIComponent(resource.uri));
   if(!asset.startsWith(dist+path.sep)||!fs.existsSync(asset))throw Error(`Brak zasobu modelu ${name}: ${resource.uri}`);
  }
 }
 const packageInfo=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 for(const command of packageInfo.scripts.test.split('&&').map(value=>value.trim())){
  const match=/^node (check-[\w-]+\.(?:mjs|cjs))$/.exec(command);
  if(!match)throw Error('Nieobsługiwane polecenie testu: '+command);
  const result=spawnSync(process.execPath,[match[1]],{cwd:root,encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024});
  if(result.error||result.status!==0)throw Error(`Test ${match[1]} nie przeszedł:\n${result.error?.message||result.stdout+'\n'+result.stderr}`);
  console.log('OK: '+match[1]);
 }
 console.log('OK: komplet '+Object.keys(PLANES).length+' modeli, ich zasoby i wszystkie testy gry.');
}
function refreshManifest(){
 const names=git(['ls-files','-co','--exclude-standard','-z']).text.split('\0').filter(Boolean);
 const files={};
 for(const name of [...new Set(names)].sort()){
  if(name==='SUMY-SHA256.json')continue;
  const file=path.join(root,name);
  if(fs.existsSync(file)&&fs.statSync(file).isFile())files[name]=digest(fs.readFileSync(file));
 }
 const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
 fs.writeFileSync(path.join(root,'SUMY-SHA256.json'),JSON.stringify({version,created:new Date().toISOString(),repository:remote,files},null,2)+'\n');
}
async function publish(){
 let input='';for await(const chunk of process.stdin)input+=chunk;
 const credentials=JSON.parse(input);input='';
 token=String(credentials.token||'').trim();
 const login=String(credentials.login||'').trim();
 credentials.token='';
 if(!token||!login)throw Error('Brak loginu lub tokena.');
 progress('checking','Sprawdzam grę przed publikacją.');
 checkFiles();
 progress('authenticating','Sprawdzam uprawnienia do repozytorium.');
 const user=await api('/user');
 if(user.login.toLowerCase()!==login.toLowerCase())throw Error(`Ten token należy do konta ${user.login}, a wpisany login to ${login}.`);
 const repo=await api(apiRoot);
 if(!repo.permissions?.push)throw Error('Konto nie ma uprawnień do wysyłania zmian do tego repozytorium.');
 if(repo.private)throw Error('Repozytorium jest prywatne. Ta konfiguracja darmowego GitHub Pages wymaga publicznego repozytorium. Skrypt nie zmienia widoczności automatycznie.');
 basic=Buffer.from(`${login}:${token}`).toString('base64');
 for(const key of Object.keys(gitEnvironment))if(/^GIT_TRACE/.test(key)||['GIT_CURL_VERBOSE','GIT_CONFIG_PARAMETERS','GIT_CONFIG','GIT_ASKPASS'].includes(key))delete gitEnvironment[key];
 Object.assign(gitEnvironment,{GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'Never',GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'http.https://github.com/.extraheader',GIT_CONFIG_VALUE_0:`Authorization: Basic ${basic}`});

 progress('preparing_git','Przygotowuję lokalne repozytorium Git.');
 if(!fs.existsSync(path.join(root,'.git')))git(['init','-b','main']);
 git(['config','user.name',user.login]);
 git(['config','user.email',`${user.id}+${user.login}@users.noreply.github.com`]);
 git(['config','http.sslBackend','openssl']);
 const existingRemote=git(['remote','get-url','origin'],{allowFailure:true});
 if(!existingRemote.ok)git(['remote','add','origin',remote]);
 else if(existingRemote.text.replace(/\/$/,'')!==remote)throw Error('Repozytorium origin wskazuje inny adres. Skrypt nie zmienia go automatycznie.');
 if(git(['branch','--show-current']).text!=='main')throw Error('Przełącz repozytorium na gałąź main przed publikacją.');
 const localHead=git(['rev-parse','--verify','HEAD'],{allowFailure:true});
 const remoteRefs=git(['ls-remote','--heads','origin']);
 if(remoteRefs.text&&!localHead.ok)throw Error('Zdalne repozytorium zawiera już commity. Przerwano, aby nie nadpisać jego historii.');
 if(remoteRefs.text){
  git(['fetch','origin','main']);
  if(!git(['merge-base','--is-ancestor','origin/main','HEAD'],{allowFailure:true}).ok)throw Error('Na GitHub są nowsze zmiany. Najpierw połącz je lokalnie; skrypt nie używa force push.');
 }
 refreshManifest();
 git(['add','--all']);
 const changed=git(['diff','--cached','--quiet'],{allowFailure:true});
 if(!localHead.ok||!changed.ok)git(['commit','-m','Publikacja Samolociarze na GitHub Pages']);
 const commit=git(['rev-parse','HEAD']).text;
 progress('pushing','Wysyłam grę i modele do repozytorium. To może potrwać kilka minut.',{commit});
 git(['push','--set-upstream','origin','main']);
 if(git(['ls-remote','origin','refs/heads/main']).text.split(/\s+/)[0]!==commit)throw Error('Nie udało się potwierdzić wysłanego commita.');

 progress('configuring_pages','Gra jest na GitHub. Włączam GitHub Pages z GitHub Actions.');
 const currentPages=await api(`${apiRoot}/pages`,{allow404:true});
 if(!currentPages)await api(`${apiRoot}/pages`,{method:'POST',data:{build_type:'workflow'}});
 else if(currentPages.build_type!=='workflow')await api(`${apiRoot}/pages`,{method:'PUT',data:{build_type:'workflow'}});

 let workflow=null;
 for(let attempt=0;attempt<12&&!workflow;attempt++){
  workflow=await api(`${apiRoot}/actions/workflows/pages.yml`,{allow404:true});
  if(!workflow)await sleep(5000);
 }
 if(!workflow)throw Error('GitHub nie zarejestrował pliku .github/workflows/pages.yml. Sprawdź zakładkę Actions.');
 if(workflow.state==='disabled_manually')await api(`${apiRoot}/actions/workflows/pages.yml/enable`,{method:'PUT'});
 const dispatchTime=Date.now()-5000;
 await api(`${apiRoot}/actions/workflows/pages.yml/dispatches`,{method:'POST',data:{ref:'main'}});
 progress('deploying','GitHub publikuje grę. Czekam na zakończenie Actions.');
 let deploymentRun=null;
 for(let attempt=0;attempt<90;attempt++){
  const runs=await api(`${apiRoot}/actions/workflows/pages.yml/runs?event=workflow_dispatch&head_sha=${commit}&per_page=10`);
  deploymentRun=runs.workflow_runs?.find(run=>run.head_sha===commit&&Date.parse(run.created_at)>=dispatchTime)||null;
  if(deploymentRun){
   if(status.workflowUrl!==deploymentRun.html_url)progress('deploying','Trwa publikacja: '+deploymentRun.html_url,{workflowUrl:deploymentRun.html_url});
   if(deploymentRun.status==='completed')break;
  }
  await sleep(8000);
 }
 if(!deploymentRun||deploymentRun.status!=='completed')throw Error('Publikacja nadal trwa. Sprawdź Actions w repozytorium; kod został wysłany.');
 if(deploymentRun.conclusion!=='success')throw Error(`Publikacja zakończyła się wynikiem ${deploymentRun.conclusion}. Szczegóły: ${deploymentRun.html_url}`);
 const pages=await api(`${apiRoot}/pages`);
 const site=pages.html_url||expectedSite;
 if(new URL(site).hostname!==`${owner}.github.io`)throw Error('GitHub zwrócił nieoczekiwany adres strony: '+site);
 progress('verifying','Publikacja zakończona. Sprawdzam stronę i pliki modeli.',{siteUrl:site});
 let ready=false;
 for(let attempt=0;attempt<24;attempt++){
  try{
   const response=await fetch(new URL(`?v=${commit}`,site),{signal:AbortSignal.timeout(20000)});
   if(response.ok&&publishedMatches('index.html',Buffer.from(await response.arrayBuffer()))){ready=true;break;}
  }catch{}
  await sleep(5000);
 }
 if(!ready)throw Error('Actions zakończyły się poprawnie, ale strona nie zwróciła jeszcze aktualnego index.html. Odczekaj kilka minut.');
 for(const name of ['app.js','career.css','three.module.js','models/a380.gltf','models/a380.bin','models/b747.gltf','models/b747.bin','models/an225.gltf','models/an225.bin','models/conc.gltf','models/conc.bin','airport-fence.js','crash-effect.js','airport-buildings.js','lakes.js','landing-assist.js']){
  const url=new URL(name,site);url.searchParams.set('v',commit);
  const response=await fetch(url,{signal:AbortSignal.timeout(60000)});
  if(!response.ok||!publishedMatches(name,Buffer.from(await response.arrayBuffer())))throw Error(`Nie udało się zweryfikować opublikowanego pliku: ${name}`);
 }
 const finalPages=await api(`${apiRoot}/pages`);
 progress('complete','GOTOWE! Gra działa pod adresem: '+site,{siteUrl:site,commit,workflowUrl:deploymentRun.html_url,pagesStatus:finalPages.status,verifiedFiles:17,completedAt:new Date().toISOString()});
 console.log('Postępy kariery przeniesiesz przez Ustawienia → Kopia postępów / Wczytaj postępy.');
}

try{
 if(process.argv.includes('--check'))checkFiles();
 else await publish();
}catch(error){
 const message=redact(error.message||error);
 if(process.argv.includes('--check'))console.error(message);
 else{try{progress('failed','BŁĄD: '+message);}catch{console.error(message);}}
 process.exitCode=1;
}finally{
 token='';basic='';
 delete gitEnvironment.GIT_CONFIG_VALUE_0;
}
