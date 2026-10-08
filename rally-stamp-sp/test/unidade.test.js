const test = require('node:test');
const assert = require('node:assert/strict');
const { distanciaM, dentroDoRaio } = require('../src/geo');
const { validarCadastro } = require('../src/validacao');
const { celula } = require('../src/routes/admin');

test('Haversine: Praça da Sé → MASP ≈ 3,0 km', () => {
  const d = distanciaM(-23.5503, -46.6339, -23.5614, -46.6559);
  assert.ok(d > 2500 && d < 2700, `distância ${d}`);
});

test('dentroDoRaio aplica folga limitada pela precisão do GPS', () => {
  const local = { lat: -23.5555, lng: -46.6355, raio_m: 150 };
  const a180m = { lat: -23.5555 + 180 / 111320, lng: -46.6355 };
  assert.equal(dentroDoRaio({ ...a180m, precisao: 0 }, local).ok, false);
  assert.equal(dentroDoRaio({ ...a180m, precisao: 40 }, local).ok, true);
  assert.equal(dentroDoRaio({ ...a180m, precisao: 5000 }, local, 20).ok, false);
});

test('validarCadastro normaliza e exige os campos', () => {
  const ok = validarCadastro({ email: ' Ana@Ex.com ', telefone: '(11) 91234-5678', cidade: 'SP', estado: 'sp', instagram: '@ana.b', consentimento: true });
  assert.deepEqual(ok.dados, { email: 'ana@ex.com', nome: null, telefone: '11912345678', cidade: 'SP', estado: 'SP', instagram: 'ana.b' });
  const ruim = validarCadastro({ email: 'x', telefone: '123', estado: 'XX', consentimento: 'sim' });
  assert.deepEqual(Object.keys(ruim.erros).sort(), ['cidade', 'consentimento', 'email', 'estado', 'telefone']);
});

test('CSV neutraliza fórmulas e escapa separadores', () => {
  assert.equal(celula('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`);
  assert.equal(celula('a;b'), '"a;b"');
  assert.equal(celula(null), '');
});
