const test = require('node:test');
const assert = require('node:assert/strict');
const { validarCadastro } = require('../src/validacao');
const { celula } = require('../src/routes/admin');

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
