const request=require('supertest'),app=require('../index'),{gerarPlano}=require('../plano'),{init,pool}=require('../db');
const base={objetivo:'emagrecimento',nivel:'iniciante',dias:['segunda','terca','quarta','quinta','sexta'],turnos:['noite'],restricao:'nenhuma'};
describe('gerarPlano',()=>{
 test('aviso sempre presente e iniciante tem no máximo 3 sessões',()=>{const p=gerarPlano(base);expect(p.aviso).toMatch(/não substitui avaliação física presencial/);expect(p.sessoes.length).toBe(3)});
 test('restrição de joelho remove exercícios de impacto',()=>{const s=JSON.stringify(gerarPlano({...base,nivel:'avancado',restricao:'joelho'}));expect(s).not.toMatch(/Agachamento livre|Passada|Polichinelo|Corrida|Afundo/)});
 test('restrição cardíaca gera plano leve com recomendação',()=>{const p=gerarPlano({...base,restricao:'cardiaca'});expect(p.aviso_extra).toBeTruthy();expect(p.sessoes[0].foco).toBe('Atividade leve')});
});
(process.env.DATABASE_URL?describe:describe.skip)('API',()=>{
 const u='teste_'+Date.now();let tk;
 beforeAll(()=>init());
 afterAll(async()=>{await pool.query("delete from participantes where usuario like 'teste_%'");await pool.end()});
 test('cadastro sem consentimento LGPD é recusado',async()=>{const r=await request(app).post('/api/cadastro').send({nome:'Ana',usuario:u,senha:'123456',lgpd:false});expect(r.status).toBe(400)});
 test('cadastro, login, plano e avaliação',async()=>{
  let r=await request(app).post('/api/cadastro').send({nome:'Ana',usuario:u,senha:'123456',lgpd:true,imagem:false});expect(r.status).toBe(201);
  r=await request(app).post('/api/login').send({usuario:u,senha:'123456'});expect(r.status).toBe(200);tk='Bearer '+r.body.token;
  r=await request(app).post('/api/respostas').set('Authorization',tk).send(base);expect(r.status).toBe(201);
  r=await request(app).get('/api/plano').set('Authorization',tk);expect(r.body.plano.sessoes.length).toBe(3);
  r=await request(app).post('/api/avaliacao').set('Authorization',tk).send({nota:6});expect(r.status).toBe(400);
  r=await request(app).post('/api/avaliacao').set('Authorization',tk).send({nota:5});expect(r.status).toBe(201);
 });
 test('login com senha errada falha',async()=>{const r=await request(app).post('/api/login').send({usuario:u,senha:'errada'});expect(r.status).toBe(401)});
});
