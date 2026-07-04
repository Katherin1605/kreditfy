import pg from 'pg';
import 'dotenv/config';

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_URL } = process.env;

// SSL solo para URLs externas (contienen dominio completo); URLs internas de Render no necesitan SSL
const needsSSL = DB_URL && DB_URL.includes('.render.com');

const pool = DB_URL
  ? new pg.Pool({ connectionString: DB_URL, ...(needsSSL && { ssl: { rejectUnauthorized: false } }), allowExitOnIdle: true })
  : new pg.Pool({ host: DB_HOST, user: DB_USER, password: DB_PASSWORD, database: DB_NAME, allowExitOnIdle: true });

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error al conectar la DB', err);
  } else {
    console.log('✅ DB conectada:', res.rows);
  }
});

export default pool;