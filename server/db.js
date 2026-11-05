require('dotenv').config();
const {Pool}=require('pg'),fs=require('fs'),path=require('path');
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.PGSSL==='true'?{rejectUnauthorized:false}:false});
const init=()=>pool.query(fs.readFileSync(path.join(__dirname,'schema.sql'),'utf8'));
module.exports={pool,init};
