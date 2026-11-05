select
 (select count(*)::int from participantes) as participantes,
 (select count(*)::int from planos) as planos_gerados,
 (select count(*)::int from participantes where consentimento_lgpd) as aceites_lgpd,
 (select count(*)::int from avaliacoes) as avaliacoes,
 (select round(avg(nota),2)::float from avaliacoes) as media_nota,
 (select round(100.0*count(*) filter (where nota>=4)/nullif(count(*),0),1)::float from avaliacoes) as pct_notas_4_5;
