const { criarPool, migrar } = require('./db');
const { criarApp } = require('./app');
const { semearLocais } = require('./seed');

function conferirConfiguracao() {
  if (process.env.NODE_ENV !== 'production') return;
  const faltando = ['DATABASE_URL', 'CODE_SECRET', 'ADMIN_TOKEN', 'PUBLIC_URL'].filter((v) => !process.env[v]);
  if (faltando.length) throw new Error(`Variáveis obrigatórias em produção não definidas: ${faltando.join(', ')}`);
}

(async () => {
  conferirConfiguracao();
  const pool = criarPool();
  await migrar(pool);

  // SINCRONIZAR_LOCAIS=true faz de data/locais.json a fonte da verdade a cada deploy:
  // atualiza os locais pelo slug (mantendo o token dos QRs) e desativa os que saíram do arquivo.
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM locais');
  if (process.env.SINCRONIZAR_LOCAIS === 'true') {
    console.log(`${await semearLocais(pool, undefined, { desativarAusentes: true })} locais sincronizados de data/locais.json.`);
  } else if (rows[0].n === 0) {
    console.log(`Banco sem locais: ${await semearLocais(pool)} locais importados de data/locais.json.`);
  }
  if (!process.env.RESEND_API_KEY) console.warn('RESEND_API_KEY ausente: os códigos de login serão impressos no log.');

  const port = Number(process.env.PORT || 3000);
  const servidor = criarApp(pool).listen(port, () => console.log(`Unofficial Stamp Rally em http://localhost:${port}`));

  // A hospedagem manda SIGTERM a cada deploy: termina as requisições em andamento antes de sair.
  process.on('SIGTERM', () => {
    servidor.close(() => pool.end().finally(() => process.exit(0)));
    setTimeout(() => process.exit(0), 10000).unref();
  });
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
