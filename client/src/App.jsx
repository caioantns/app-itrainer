import {useState,useEffect} from 'react';
const L={emagrecimento:'Emagrecer',massa:'Ganhar massa',condicionamento:'Melhorar o condicionamento',saude:'Cuidar da saúde em geral',iniciante:'Iniciante: estou começando',intermediario:'Intermediário: treino às vezes',avancado:'Avançado: já treino com regularidade',segunda:'Segunda',terca:'Terça',quarta:'Quarta',quinta:'Quinta',sexta:'Sexta',sabado:'Sábado',domingo:'Domingo',manha:'Manhã',tarde:'Tarde',noite:'Noite',nenhuma:'Nenhuma',joelho:'Joelho',lombar:'Coluna ou lombar',ombro:'Ombro',cardiaca:'Coração ou pressão',outra:'Outra'};
const PASSOS=[
 {k:'objetivo',t:'Qual é o seu objetivo?',o:['emagrecimento','massa','condicionamento','saude']},
 {k:'nivel',t:'Qual é o seu nível?',o:['iniciante','intermediario','avancado']},
 {k:'dias',t:'Em quais dias você pode treinar?',o:['segunda','terca','quarta','quinta','sexta','sabado','domingo'],multi:1},
 {k:'turnos',t:'Em quais turnos?',o:['manha','tarde','noite'],multi:1},
 {k:'restricao',t:'Você tem alguma restrição ou dor?',o:['nenhuma','joelho','lombar','ombro','cardiaca','outra']}];
const tk={get:()=>{try{return localStorage.getItem('t')}catch{return null}},set:v=>{try{v?localStorage.setItem('t',v):localStorage.removeItem('t')}catch{}}};
async function api(p,body){
 const t=tk.get();let r;
 try{r=await fetch('/api/'+p,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(t?{Authorization:'Bearer '+t}:{})},body:body?JSON.stringify(body):undefined})}
 catch{throw new Error('Sem conexão. Verifique a internet e tente de novo.')}
 const d=await r.json().catch(()=>({}));
 if(!r.ok){const e=new Error(d.erro||'Algo deu errado. Tente de novo.');e.status=r.status;throw e}
 return d;
}
const reduzir=f=>new Promise((ok,no)=>{const im=new Image();im.onload=()=>{const s=Math.min(1,900/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*s;c.height=im.height*s;c.getContext('2d').drawImage(im,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',.7))};im.onerror=no;im.src=URL.createObjectURL(f)});

export default function App(){
 const [tela,setTela]=useState('carregando'),[erro,setErro]=useState(''),[busy,setBusy]=useState(false);
 const [nome,setNome]=useState(''),[img,setImg]=useState(false),[plano,setPlano]=useState(null);
 const [f,setF]=useState({nome:'',usuario:'',senha:'',lgpd:false,imagem:false});
 const [passo,setPasso]=useState(0),[resp,setResp]=useState({dias:[],turnos:[]}),[outra,setOutra]=useState('');
 const [nota,setNota]=useState(0),[sat,setSat]=useState({}),[com,setCom]=useState(''),[foto,setFoto]=useState(null);
 const go=async fn=>{setErro('');setBusy(true);try{await fn()}catch(e){setErro(e.message)}setBusy(false)};
 const entrar=d=>{tk.set(d.token);return api('plano').then(p=>{setNome(p.nome);setImg(p.autoriza_imagem);setPlano(p.plano);setTela(p.avaliado?'fim':p.plano?'plano':'quiz')})};
 useEffect(()=>{if(!tk.get())return setTela('cadastro');entrar({token:tk.get()}).catch(()=>{tk.set(null);setTela('cadastro')})},[]);
 const set=(k,v)=>setF(x=>({...x,[k]:v}));
 const enviarQuiz=r=>go(async()=>{const d=await api('respostas',{...r,restricao_texto:outra});setPlano(d.plano);setTela('plano')});
 const escolher=(p,o)=>{
  if(p.multi){const a=resp[p.k];setResp({...resp,[p.k]:a.includes(o)?a.filter(x=>x!==o):[...a,o]});return}
  const r={...resp,[p.k]:o};setResp(r);
  if(p.k==='restricao'){if(o!=='outra')enviarQuiz(r)}else setPasso(passo+1);
 };
 const Err=()=>erro?<div className="err" role="alert">{erro}</div>:null;

 if(tela==='carregando')return<main><p>Carregando…</p></main>;
 if(tela==='cadastro')return<main><h1>Seu plano de treino grátis em 2 minutos</h1><p className="mut">Cadastro rápido, sem CPF.</p>
  <label htmlFor="n">Nome</label><input id="n" type="text" autoComplete="name" value={f.nome} onChange={e=>set('nome',e.target.value)}/>
  <label htmlFor="u">E-mail ou usuário</label><input id="u" type="text" autoCapitalize="none" autoComplete="username" inputMode="email" value={f.usuario} onChange={e=>set('usuario',e.target.value)}/>
  <label htmlFor="s">Senha (mínimo 6 caracteres)</label><input id="s" type="password" autoComplete="new-password" value={f.senha} onChange={e=>set('senha',e.target.value)}/>
  <label className="chk"><input type="checkbox" checked={f.lgpd} onChange={e=>set('lgpd',e.target.checked)}/><span>Aceito que o iTrainer use meu nome, usuário e respostas só para gerar meu plano e para avaliar esta ação de extensão universitária (LGPD). <b>Obrigatório.</b></span></label>
  <label className="chk"><input type="checkbox" checked={f.imagem} onChange={e=>set('imagem',e.target.checked)}/><span>Autorizo o uso da minha imagem no registro fotográfico da ação. <b>Opcional.</b></span></label>
  <Err/><button disabled={busy||!f.lgpd||!f.nome||!f.usuario||f.senha.length<6} onClick={()=>go(async()=>entrar(await api('cadastro',f)))}>{busy?'Criando…':'Criar meu cadastro'}</button>
  <button className="sec" onClick={()=>{setErro('');setTela('login')}}>Já tenho cadastro</button></main>;
 if(tela==='login')return<main><h1>Entrar</h1>
  <label htmlFor="u">E-mail ou usuário</label><input id="u" type="text" autoCapitalize="none" autoComplete="username" value={f.usuario} onChange={e=>set('usuario',e.target.value)}/>
  <label htmlFor="s">Senha</label><input id="s" type="password" autoComplete="current-password" value={f.senha} onChange={e=>set('senha',e.target.value)}/>
  <Err/><button disabled={busy} onClick={()=>go(async()=>entrar(await api('login',f)))}>{busy?'Entrando…':'Entrar'}</button>
  <button className="sec" onClick={()=>{setErro('');setTela('cadastro')}}>Criar cadastro</button></main>;
 if(tela==='quiz'){const p=PASSOS[passo],sel=resp[p.k];return<main>
  <div className="bar"><i style={{width:`${(passo+1)/PASSOS.length*100}%`}}/></div><p className="mut">Pergunta {passo+1} de {PASSOS.length}</p><h2>{p.t}</h2>
  {p.o.map(o=><button key={o} className={'op'+((p.multi?sel.includes(o):resp[p.k]===o)?' on':'')} onClick={()=>escolher(p,o)}>{L[o]}</button>)}
  {p.k==='restricao'&&resp.restricao==='outra'&&<><label htmlFor="o">Qual?</label><input id="o" type="text" maxLength={80} value={outra} onChange={e=>setOutra(e.target.value)}/></>}
  <Err/>
  {(p.multi||resp.restricao==='outra'&&p.k==='restricao')&&<button disabled={busy||(p.multi&&!sel.length)} onClick={()=>p.multi?setPasso(passo+1):enviarQuiz(resp)}>{p.k==='restricao'?(busy?'Montando seu plano…':'Gerar meu plano'):'Continuar'}</button>}
  {busy&&!p.multi&&<p className="mut">Montando seu plano…</p>}
  {passo>0&&<button className="sec" onClick={()=>setPasso(passo-1)}>Voltar</button>}</main>}
 if(tela==='plano'){const a=plano.aviso;return<main><h1>Seu plano, {nome.split(' ')[0]}</h1>
  <p className="mut">{L[plano.resumo.objetivo]} · {L[plano.resumo.nivel]} · {plano.sessoes.length} treino(s) por semana</p>
  <div className="aviso">{a}.</div>{plano.aviso_extra&&<div className="aviso">{plano.aviso_extra}</div>}
  {plano.sessoes.map((s,i)=><section className="sess" key={i}><span className="dia">{L[s.dia]} · {L[s.turno]}</span><h3>{s.foco}</h3>
   <p className="mut">Aquecimento: {s.aquecimento}</p><ul>{s.exercicios.map((e,j)=><li key={j}><b>{e.nome}</b><br/>{e.prescricao}</li>)}</ul><p className="mut">Final: {s.alongamento}</p></section>)}
  <div className="aviso">{a}.</div><button onClick={()=>setTela('avaliacao')}>Avaliar meu plano</button></main>}
 if(tela==='avaliacao'){const Q=(k,t)=><><label>{t}</label><div className="stars">{[['sim','Sim'],['medio','Mais ou menos'],['nao','Não']].map(([v,l])=><button key={v} style={{fontSize:15}} className={sat[k]===v?'on':''} onClick={()=>setSat({...sat,[k]:v})}>{l}</button>)}</div></>;
  return<main><h2>Como você avalia seu plano?</h2>
  <div className="stars" role="group" aria-label="Nota de 1 a 5">{[1,2,3,4,5].map(n=><button key={n} className={nota===n?'on':''} aria-label={`Nota ${n}`} onClick={()=>setNota(n)}>{n}</button>)}</div>
  <p className="mut">1 = ruim · 5 = excelente</p>
  {Q('facil','O app foi fácil de usar?')}{Q('seguiria','Você seguiria esse plano?')}
  <label htmlFor="c">Comentário (opcional)</label><textarea id="c" rows={3} maxLength={500} value={com} onChange={e=>setCom(e.target.value)}/>
  {img&&<><label htmlFor="f">Foto de registro (você autorizou)</label><input id="f" type="file" accept="image/*" capture="user" onChange={async e=>{const x=e.target.files[0];if(x)try{setFoto(await reduzir(x))}catch{setErro('Não foi possível ler a foto.')}}}/>{foto&&<p className="mut">Foto pronta.</p>}</>}
  <Err/><button disabled={busy||!nota} onClick={()=>go(async()=>{await api('avaliacao',{nota,satisfacao:sat,comentario:com,foto});setTela('fim')})}>{busy?'Enviando…':'Enviar avaliação'}</button></main>}
 return<main className="ok"><h1>Obrigado!</h1><p>Sua avaliação ajuda o projeto. Bom treino!</p><button className="sec" onClick={()=>setTela('plano')}>Rever meu plano</button></main>;
}
