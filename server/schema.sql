create table if not exists participantes(
 id serial primary key, nome text not null, usuario text not null unique, senha_hash text not null,
 consentimento_lgpd boolean not null check (consentimento_lgpd), consentimento_lgpd_em timestamptz not null,
 autoriza_imagem boolean not null default false, autoriza_imagem_em timestamptz, criado_em timestamptz not null default now());
create table if not exists respostas(
 id serial primary key, participante_id int not null references participantes(id) on delete cascade,
 objetivo text not null, nivel text not null, dias text[] not null, turnos text[] not null, restricao text not null,
 criado_em timestamptz not null default now());
create table if not exists planos(
 id serial primary key, participante_id int not null unique references participantes(id) on delete cascade,
 resposta_id int not null references respostas(id) on delete cascade, conteudo jsonb not null,
 criado_em timestamptz not null default now());
create table if not exists avaliacoes(
 id serial primary key, plano_id int not null unique references planos(id) on delete cascade,
 nota int not null check (nota between 1 and 5), satisfacao jsonb, comentario text, foto text,
 criado_em timestamptz not null default now());
