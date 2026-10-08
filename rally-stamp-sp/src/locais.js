const crypto = require('node:crypto');
const { texto, numero } = require('./validacao');

/** Tipos de local: lojas parceiras e fan projects (ações feitas por fãs). */
const TIPOS = ['loja', 'fan_project'];

const gerarToken = () => crypto.randomBytes(12).toString('base64url');

const urlDoQr = (local) => `${(process.env.PUBLIC_URL || '').replace(/\/$/, '')}/l/${encodeURIComponent(local.slug)}?t=${encodeURIComponent(local.token)}`;

/** Valida os campos de um local vindos do admin ou do arquivo de seed. */
function validarLocal(b = {}) {
  const erros = {};
  const slug = texto(b.slug, 100).toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) erros.slug = 'Use letras minúsculas, números e hífens.';
  const nome = texto(b.nome, 120);
  if (!nome) erros.nome = 'Obrigatório.';
  const lat = numero(Number(b.lat), -90, 90);
  const lng = numero(Number(b.lng), -180, 180);
  if (lat === null) erros.lat = 'Latitude inválida.';
  if (lng === null) erros.lng = 'Longitude inválida.';
  const raio = b.raio_m === undefined || b.raio_m === '' ? 150 : numero(Number(b.raio_m), 10, 5000);
  if (raio === null) erros.raio_m = 'Entre 10 e 5000 m.';
  const ordem = numero(Number(b.ordem ?? 0), -1e6, 1e6);
  const tipo = b.tipo === undefined || b.tipo === '' ? 'loja' : b.tipo;
  if (!TIPOS.includes(tipo)) erros.tipo = 'Escolha loja ou fan project.';
  if (Object.keys(erros).length) return { erros };
  return {
    dados: {
      slug,
      nome,
      bairro: texto(b.bairro, 120),
      endereco: texto(b.endereco, 300),
      descricao: texto(b.descricao, 1000),
      foto_qr_url: texto(b.foto_qr_url, 500),
      lat,
      lng,
      raio_m: Math.round(raio),
      ordem: Math.round(ordem ?? 0),
      tipo,
      horario: texto(b.horario, 200),
      ativo: b.ativo === undefined ? true : Boolean(b.ativo),
    },
  };
}

module.exports = { TIPOS, gerarToken, urlDoQr, validarLocal };
