const fs = require('node:fs');
const path = require('node:path');
const { gerarToken, validarLocal } = require('./locais');

const ARQUIVO = path.join(__dirname, '..', 'data', 'locais.json');

/**
 * Insere/atualiza os locais de data/locais.json (casando pelo slug).
 * O token do QR é preservado quando o local já existe, para não invalidar QRs impressos.
 */
async function semearLocais(pool, arquivo = ARQUIVO, { desativarAusentes = false } = {}) {
  const lista = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  for (const item of lista) {
    const { dados: d, erros } = validarLocal(item);
    if (erros) throw new Error(`Local inválido (${item.slug}): ${JSON.stringify(erros)}`);
    await pool.query(
      `INSERT INTO locais (slug, nome, bairro, endereco, descricao, foto_qr_url, lat, lng, raio_m, ordem, ativo, tipo, horario, token)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (slug) DO UPDATE SET nome=$2, bairro=$3, endereco=$4, descricao=$5, foto_qr_url=$6, lat=$7, lng=$8, raio_m=$9, ordem=$10, ativo=$11, tipo=$12, horario=$13`,
      [d.slug, d.nome, d.bairro, d.endereco, d.descricao, d.foto_qr_url, d.lat, d.lng, d.raio_m, d.ordem, d.ativo, d.tipo, d.horario, item.token || gerarToken()],
    );
  }
  if (desativarAusentes) {
    await pool.query('UPDATE locais SET ativo = FALSE WHERE NOT (slug = ANY($1))', [lista.map((l) => l.slug)]);
  }
  return lista.length;
}

module.exports = { semearLocais };

if (require.main === module) {
  const { criarPool, migrar } = require('./db');
  (async () => {
    const pool = criarPool();
    await migrar(pool);
    const n = await semearLocais(pool, process.argv[2] ? path.resolve(process.argv[2]) : ARQUIVO);
    console.log(`${n} locais importados.`);
    await pool.end();
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
