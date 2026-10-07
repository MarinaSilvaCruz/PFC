// Testes de integração: precisam de um Postgres de teste em TEST_DATABASE_URL (o banco é apagado!).
const test = require('node:test');
const assert = require('node:assert/strict');

const URL_TESTE = process.env.TEST_DATABASE_URL;
const pular = !URL_TESTE && 'defina TEST_DATABASE_URL para rodar os testes de API';

let base;
let pool;
let servidor;
let ultimoCodigo;

test.before(async () => {
  if (pular) return;
  process.env.ADMIN_TOKEN = 'adm';
  process.env.PUBLIC_URL = 'https://rally.test';
  const email = require('../src/email');
  email.enviarCodigo = async (_e, c) => { ultimoCodigo = c; };
  const { criarPool, migrar } = require('../src/db');
  const { criarApp } = require('../src/app');
  const { semearLocais } = require('../src/seed');
  pool = criarPool(URL_TESTE);
  await pool.query('DROP TABLE IF EXISTS carimbos, codigos, sessoes, participantes, locais CASCADE');
  await migrar(pool);
  await semearLocais(pool);
  servidor = criarApp(pool).listen(0);
  base = `http://127.0.0.1:${servidor.address().port}`;
});

test.after(async () => {
  servidor?.close();
  await pool?.end();
});

function cliente() {
  let cookie = '';
  return async (caminho, { method = 'GET', body, headers = {} } = {}) => {
    const r = await fetch(base + caminho, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = r.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    const tipo = r.headers.get('content-type') || '';
    return { status: r.status, dados: tipo.includes('json') ? await r.json() : await r.text() };
  };
}

const LIBERDADE = { lat: -23.5555, lng: -46.6355, precisao: 10 };

test('cadastro, código, check-in e admin', { skip: pular }, async () => {
  const c = cliente();

  const publicos = await c('/api/locais');
  assert.equal(publicos.dados.locais.length, 8);
  for (const campo of ['lat', 'lng', 'token', 'raio_m', 'id']) assert.ok(!(campo in publicos.dados.locais[0]), `${campo} não pode vazar`);

  assert.equal((await c('/api/checkin', { method: 'POST', body: { slug: 'liberdade', token: 'x', ...LIBERDADE } })).status, 401);

  const dadosCadastro = { email: 'fa@ex.com', telefone: '11912345678', cidade: 'São Paulo', estado: 'SP', consentimento: true };
  assert.equal((await c('/api/auth/cadastro', { method: 'POST', body: dadosCadastro })).status, 200);
  assert.equal((await c('/api/auth/verificar', { method: 'POST', body: { email: 'fa@ex.com', codigo: ultimoCodigo === '000000' ? '111111' : '000000' } })).dados.erro, 'invalido');
  const v = await c('/api/auth/verificar', { method: 'POST', body: { email: 'fa@ex.com', codigo: ultimoCodigo } });
  assert.equal(v.status, 200);
  assert.equal((await c('/api/me')).dados.participante.email, 'fa@ex.com');
  // código já usado não serve de novo
  assert.equal((await cliente()('/api/auth/verificar', { method: 'POST', body: { email: 'fa@ex.com', codigo: ultimoCodigo } })).status, 400);
  // e-mail verificado não pode ser recadastrado
  assert.equal((await cliente()('/api/auth/cadastro', { method: 'POST', body: dadosCadastro })).dados.erro, 'existe');

  const { rows } = await pool.query("SELECT slug, token FROM locais WHERE slug IN ('liberdade', 'morumbi') ORDER BY slug");
  const [lib, mor] = rows;

  let r = await c('/api/checkin', { method: 'POST', body: { slug: 'liberdade', token: mor.token, ...LIBERDADE } });
  assert.equal(r.dados.erro, 'qr_outro_local');
  r = await c('/api/checkin', { method: 'POST', body: { slug: 'liberdade', token: lib.token, lat: -23.6, lng: -46.72, precisao: 10 } });
  assert.equal(r.dados.erro, 'longe');
  r = await c('/api/checkin', { method: 'POST', body: { slug: 'liberdade', token: lib.token, ...LIBERDADE } });
  assert.equal(r.status, 200);
  r = await c('/api/checkin', { method: 'POST', body: { slug: 'liberdade', token: lib.token, ...LIBERDADE } });
  assert.equal(r.dados.erro, 'ja_carimbado');
  assert.ok((await c('/api/locais')).dados.locais.find((l) => l.slug === 'liberdade').coletado_em);

  // login em outro aparelho mantém o progresso
  const outro = cliente();
  assert.equal((await outro('/api/auth/entrar', { method: 'POST', body: { email: 'FA@ex.com' } })).status, 200);
  await outro('/api/auth/verificar', { method: 'POST', body: { email: 'fa@ex.com', codigo: ultimoCodigo } });
  assert.ok((await outro('/api/locais')).dados.locais.find((l) => l.slug === 'liberdade').coletado_em);
  await outro('/api/auth/sair', { method: 'POST' });
  assert.equal((await outro('/api/me')).dados.participante, null);

  assert.equal((await c('/api/admin/participantes')).status, 401);
  const adm = { headers: { Authorization: 'Bearer adm' } };
  const csv = await c('/api/admin/participantes.csv', adm);
  assert.match(csv.dados, /fa@ex\.com;.*;1\/8;/);
  const locais = await c('/api/admin/locais', adm);
  assert.equal(locais.dados.locais[0].url_qr, `https://rally.test/l/liberdade?t=${lib.token}`);
  assert.equal((await c(`/api/admin/locais/${locais.dados.locais[0].id}`, { method: 'DELETE', ...adm })).status, 409);
});

test('escritas da API exigem JSON', { skip: pular }, async () => {
  const r = await fetch(`${base}/api/auth/entrar`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'email=a@b.com' });
  assert.equal(r.status, 415);
});
