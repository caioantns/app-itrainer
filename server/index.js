require('dotenv').config();
const express=require('express'),cors=require('cors'),bcrypt=require('bcryptjs'),jwt=require('jsonwebtoken'),QR=require('qrcode'),fs=require('fs'),path=require('path');
const {pool,init}=require('./db'),{gerarPlano,SEM}=require('./plano');
const SECRET=process.env.JWT_SECRET||'dev-secret';
const OBJ=['emagrecimento','massa','condicionamento','saude'],NIV=['iniciante','intermediario','avancado'],TUR=['manha','tarde','noite'],RES=['nenhuma','joelho','lombar','ombro','cardiaca','outra'];
const app=express();app.use(cors());app.use(express.json({limit:'4mb'}));
const h=fn=>(req,res)=>fn(req,res).catch(e=>{console.error(e);res.status(500).json({erro:'Erro interno. Tente novamente.'})});
const bad=(res,erro,c=400)=>res.status(c).json({erro});
const token=p=>jwt.sign({id:p.id},SECRET,{expiresIn:'2d'});
const auth=(req,res,next)=>{try{req.uid=jwt.verify((req.headers.authorization||'').replace('Bearer ',''),SECRET).id;next()}catch{bad(res,'Sessão expirada. Entre novamente.',401)}};
const sub=(a,set)=>Array.isArray(a)&&a.length>0&&a.every(x=>set.includes(x));

app.post('/api/cadastro',h(async(req,res)=>{
 const {nome,usuario,senha,lgpd,imagem}=req.body||{};
 if(lgpd!==true)return bad(res,'É necessário aceitar o termo de consentimento (LGPD).');
 if(typeof nome!=='string'||nome.trim().length<2)return bad(res,'Informe seu nome.');
 if(typeof usuario!=='string'||usuario.trim().length<3)return bad(res,'Informe um e-mail ou usuário (mínimo 3 caracteres).');
 if(typeof senha!=='string'||senha.length<6)return bad(res,'A senha precisa ter pelo menos 6 caracteres.');
 try{
  const {rows:[p]}=await pool.query(`insert into participantes(nome,usuario,senha_hash,consentimento_lgpd,consentimento_lgpd_em,autoriza_imagem,autoriza_imagem_em)
   values($1,$2,$3,true,now(),$4,case when $4 then now() end) returning id,nome,autoriza_imagem`,[nome.trim(),usuario.trim().toLowerCase(),await bcrypt.hash(senha,10),imagem===true]);
  res.status(201).json({token:token(p),nome:p.nome});
 }catch(e){if(e.code==='23505')return bad(res,'Esse e-mail/usuário já está cadastrado. Entre com sua senha.',409);throw e}
}));
app.post('/api/login',h(async(req,res)=>{
 const {usuario,senha}=req.body||{};
 const {rows:[p]}=await pool.query('select * from participantes where usuario=$1',[String(usuario||'').trim().toLowerCase()]);
 if(!p||!(await bcrypt.compare(String(senha||''),p.senha_hash)))return bad(res,'Usuário ou senha incorretos.',401);
 res.json({token:token(p),nome:p.nome});
}));
app.post('/api/respostas',auth,h(async(req,res)=>{
 const {objetivo,nivel,dias,turnos,restricao,restricao_texto}=req.body||{};
 if(!OBJ.includes(objetivo)||!NIV.includes(nivel)||!sub(dias,SEM)||!sub(turnos,TUR)||!RES.includes(restricao))return bad(res,'Respostas inválidas. Revise o questionário.');
 const rest=restricao==='outra'?'outra:'+String(restricao_texto||'').slice(0,80):restricao;
 const plano=gerarPlano({objetivo,nivel,dias,turnos,restricao:rest});
 await pool.query('delete from planos where participante_id=$1',[req.uid]);
 const {rows:[r]}=await pool.query('insert into respostas(participante_id,objetivo,nivel,dias,turnos,restricao) values($1,$2,$3,$4,$5,$6) returning id',[req.uid,objetivo,nivel,dias,turnos,rest]);
 await pool.query('insert into planos(participante_id,resposta_id,conteudo) values($1,$2,$3)',[req.uid,r.id,plano]);
 res.status(201).json({plano});
}));
app.get('/api/plano',auth,h(async(req,res)=>{
 const {rows:[p]}=await pool.query(`select p.nome,p.autoriza_imagem,pl.conteudo as plano,exists(select 1 from avaliacoes a where a.plano_id=pl.id) as avaliado
  from participantes p left join planos pl on pl.participante_id=p.id where p.id=$1`,[req.uid]);
 if(!p)return bad(res,'Sessão expirada. Entre novamente.',401);
 res.json(p);
}));
app.post('/api/avaliacao',auth,h(async(req,res)=>{
 const {nota,satisfacao,comentario,foto}=req.body||{};
 if(!Number.isInteger(nota)||nota<1||nota>5)return bad(res,'A nota deve ser de 1 a 5.');
 const {rows:[p]}=await pool.query('select pl.id,pa.autoriza_imagem from planos pl join participantes pa on pa.id=pl.participante_id where pl.participante_id=$1',[req.uid]);
 if(!p)return bad(res,'Gere seu plano antes de avaliar.',404);
 if(foto&&(!p.autoriza_imagem||typeof foto!=='string'||foto.length>3e6||!foto.startsWith('data:image/')))return bad(res,'Foto não permitida ou grande demais.');
 try{await pool.query('insert into avaliacoes(plano_id,nota,satisfacao,comentario,foto) values($1,$2,$3,$4,$5)',[p.id,nota,satisfacao||null,String(comentario||'').slice(0,500)||null,foto||null]);}
 catch(e){if(e.code==='23505')return bad(res,'Você já avaliou este plano.',409);throw e}
 res.status(201).json({ok:true});
}));
app.get('/api/metricas',h(async(req,res)=>{
 if(!process.env.ADMIN_KEY)return bad(res,'ADMIN_KEY não configurada.',503);
 if((req.headers['x-admin-key']||req.query.chave)!==process.env.ADMIN_KEY)return bad(res,'Acesso negado.',403);
 const {rows:[m]}=await pool.query(fs.readFileSync(path.join(__dirname,'metricas.sql'),'utf8'));
 res.json({...m,metas:{participantes:m.participantes>=6,planos:m.planos_gerados>=6,notas_4_5:(m.pct_notas_4_5||0)>=80}});
}));
app.get('/qr',h(async(req,res)=>{
 const url=process.env.PUBLIC_URL||`${req.headers['x-forwarded-proto']||req.protocol}://${req.get('host')}`;
 res.send(`<meta name=viewport content="width=device-width,initial-scale=1"><body style="font-family:sans-serif;text-align:center;padding:24px"><h1>iTrainer</h1><p>Escaneie para receber seu plano de treino grátis</p><img width=320 src="${await QR.toDataURL(url,{margin:2,width:640})}"><p>${url}</p>`);
}));
app.get('/relatorio',h(async(req,res)=>{
 if(!process.env.ADMIN_KEY)return bad(res,'ADMIN_KEY não configurada.',503);
 if(req.query.chave!==process.env.ADMIN_KEY)return bad(res,'Acesso negado.',403);
 const {rows:[m]}=await pool.query(fs.readFileSync(path.join(__dirname,'metricas.sql'),'utf8'));
 const {rows}=await pool.query(`select p.nome,p.criado_em,p.autoriza_imagem,r.objetivo,r.nivel,a.nota,a.comentario
  from participantes p left join planos pl on pl.participante_id=p.id left join respostas r on r.id=pl.resposta_id
  left join avaliacoes a on a.plano_id=pl.id order by p.criado_em`);
 const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const dt=d=>new Date(d).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'});
 const meta=b=>b?'<b style="color:#0a7a3d">✔ meta atingida</b>':'<b style="color:#b42318">✘ meta não atingida</b>';
 const pct=m.pct_notas_4_5??0;
 res.send(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Relatório iTrainer</title>
<style>body{font:15px/1.4 system-ui,sans-serif;margin:24px;color:#111}h1{margin:0}.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin:16px 0}
.c{border:1px solid #bbb;border-radius:8px;padding:10px}.c span{display:block;font-size:28px;font-weight:800}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:6px 8px;text-align:left}th{background:#eee}
@media print{body{margin:8mm}}</style>
<h1>iTrainer – Relatório da ação</h1><p>Práticas Extensionistas Integradoras VI · Universidade de Vassouras, Campus Maricá<br>Gerado em ${dt(new Date())}</p>
<div class=g>
<div class=c>Participantes<span>${m.participantes}</span>${meta(m.participantes>=6)} (mín. 6)</div>
<div class=c>Planos gerados<span>${m.planos_gerados}</span>${meta(m.planos_gerados>=6)} (mín. 6)</div>
<div class=c>Notas 4 ou 5<span>${pct}%</span>${meta(pct>=80)} (mín. 80%)</div>
<div class=c>Aceites LGPD<span>${m.aceites_lgpd}</span></div>
<div class=c>Avaliações recebidas<span>${m.avaliacoes}</span></div>
<div class=c>Nota média<span>${m.media_nota??'—'}</span></div></div>
<table><tr><th>#</th><th>Nome</th><th>Data e hora</th><th>LGPD</th><th>Imagem</th><th>Objetivo</th><th>Nível</th><th>Nota</th><th>Comentário</th></tr>
${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${e(r.nome)}</td><td>${dt(r.criado_em)}</td><td>Sim</td><td>${r.autoriza_imagem?'Autorizou':'Não'}</td><td>${e(r.objetivo)}</td><td>${e(r.nivel)}</td><td>${e(r.nota??'—')}</td><td>${e(r.comentario)}</td></tr>`).join('')}</table>`);
}));
const dist=path.join(__dirname,'..','client','dist');
app.use(express.static(dist));
app.get(/^\/(?!api).*/,(req,res)=>res.sendFile(path.join(dist,'index.html')));
module.exports=app;
if(require.main===module){init().then(()=>app.listen(process.env.PORT||3000,()=>console.log('iTrainer no ar'))).catch(e=>{console.error(e);process.exit(1)})}
