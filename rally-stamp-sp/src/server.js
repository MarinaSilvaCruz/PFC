const { criarPool, migrar } = require('./db');
const { criarApp } = require('./app');
const { semearLocais } = require('./seed');

(async () => {
  const pool = criarPool();
  await migrar(pool);
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM locais');
  if (rows[0].n === 0) console.log(`Banco sem locais: ${await semearLocais(pool)} locais importados de data/locais.json.`);
  if (!process.env.RESEND_API_KEY) console.warn('RESEND_API_KEY ausente: os códigos de login serão impressos no console.');

  const port = Number(process.env.PORT || 3000);
  criarApp(pool).listen(port, () => console.log(`Unofficial Stamp Rally em http://localhost:${port}`));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
