const SEM=['segunda','terca','quarta','quinta','sexta','sabado','domingo'];
const AVISO='Plano inicial sugerido, não substitui avaliação física presencial';
const NIVEL={iniciante:{max:3,n:4,s:2,d:'60 s',min:10},intermediario:{max:4,n:5,s:3,d:'45 s',min:15},avancado:{max:5,n:6,s:3,d:'40 s',min:20}};
const REPS={emagrecimento:'15 repetições',massa:'8 a 12 repetições',condicionamento:'12 a 15 repetições',saude:'10 a 12 repetições'};
const ORDEM={
 emagrecimento:['cardio','pernas','empurrar','puxar','core','cardio'],
 massa:['pernas','empurrar','puxar','pernas','core','empurrar'],
 condicionamento:['cardio','pernas','core','empurrar','puxar','cardio'],
 saude:['pernas','empurrar','puxar','core','cardio','core']};
// [nome, ...marcas]: marca = restrição que EXCLUI o exercício, ou tipo (tempo/cardio)
const X={
 pernas:[['Agachamento livre','joelho'],['Agachamento na cadeira'],['Elevação de quadril (ponte)'],['Passada alternada','joelho'],['Elevação de panturrilha'],['Afundo estático','joelho']],
 empurrar:[['Flexão inclinada (mãos no banco)'],['Flexão com joelhos no chão'],['Desenvolvimento com garrafas de água','ombro'],['Tríceps no banco','ombro'],['Flexão de braço','ombro']],
 puxar:[['Remada curvada com mochila','lombar'],['Remada com elástico ou toalha'],['Superman alternado','lombar'],['Rosca com garrafas de água'],['Remada unilateral apoiada no banco']],
 core:[['Prancha','tempo'],['Prancha com joelhos no chão','tempo'],['Abdominal curto'],['Bird-dog'],['Elevação de pernas deitado','lombar']],
 cardio:[['Caminhada rápida','cardio'],['Marcha elevando os joelhos','cardio'],['Polichinelo','cardio','joelho'],['Corrida leve','cardio','joelho'],['Pedalada (bicicleta)','cardio']]};

function gerarPlano({objetivo,nivel,dias,turnos,restricao}){
 const r=String(restricao||'nenhuma').split(':')[0];
 const leve=r==='cardiaca'||r==='outra';
 const N=NIVEL[nivel]||NIVEL.iniciante;
 const ord=[...dias].sort((a,b)=>SEM.indexOf(a)-SEM.indexOf(b));
 const qtd=Math.min(ord.length,leve?Math.min(3,N.max):N.max);
 const sel=Array.from({length:qtd},(_,i)=>ord[Math.floor(i*ord.length/qtd)]);
 const sessoes=sel.map((dia,s)=>{
  const turno=turnos[s%turnos.length];
  if(leve)return{dia,turno,foco:'Atividade leve',aquecimento:'3 min de marcha leve no lugar',
   exercicios:[{nome:'Caminhada em ritmo confortável',prescricao:'15 a 20 min'},{nome:'Mobilidade de ombros e quadril',prescricao:'2 x 10 movimentos'},{nome:'Respiração profunda sentado',prescricao:'2 min'}],
   alongamento:'5 min de alongamento suave'};
  const ordem=ORDEM[objetivo]||ORDEM.saude,usados=new Set(),exercicios=[];
  for(let i=0;i<N.n;i++){
   const pool=X[ordem[i%ordem.length]].filter(e=>!e.includes(r));
   let k=(s+i)%pool.length,g=0;
   while(usados.has(pool[k][0])&&g++<pool.length)k=(k+1)%pool.length;
   const e=pool[k];usados.add(e[0]);
   const prescricao=e.includes('cardio')?`${N.min} min em ritmo moderado`
    :e.includes('tempo')?`${N.s} x 20 a 40 s, descanso ${N.d}`
    :`${N.s} x ${REPS[objetivo]||REPS.saude}, descanso ${N.d}`;
   exercicios.push({nome:e[0],prescricao});
  }
  return{dia,turno,foco:`Treino ${String.fromCharCode(65+s)}`,aquecimento:'5 min de caminhada leve e mobilidade das articulações',exercicios,alongamento:'5 min de alongamento dos músculos trabalhados'};
 });
 return{aviso:AVISO,aviso_extra:leve?'Como você informou uma condição de saúde, converse com um profissional de saúde antes de começar.':null,resumo:{objetivo,nivel,restricao:r},sessoes};
}
module.exports={gerarPlano,SEM,AVISO};
