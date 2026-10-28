const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const texto = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function normalizarEmail(v) {
  const email = texto(v, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

/** Valida o cadastro. Retorna { dados } ou { erros: { campo: mensagem } }. */
function validarCadastro(body = {}) {
  const erros = {};
  const email = normalizarEmail(body.email);
  if (!email) erros.email = 'Informe um e-mail válido.';

  const nome = texto(body.nome, 80) || null;

  const telefone = texto(body.telefone, 30).replace(/\D/g, '');
  if (telefone.length < 10 || telefone.length > 13) erros.telefone = 'Informe um telefone com DDD.';

  const cidade = texto(body.cidade, 80);
  if (!cidade) erros.cidade = 'Informe sua cidade.';

  const estado = texto(body.estado, 2).toUpperCase();
  if (!UFS.includes(estado)) erros.estado = 'Escolha o estado.';

  let instagram = texto(body.instagram, 40).replace(/^@+/, '') || null;
  if (instagram && !/^[A-Za-z0-9._]{1,30}$/.test(instagram)) erros.instagram = 'Instagram inválido.';

  if (body.consentimento !== true) erros.consentimento = 'É preciso aceitar o uso dos dados para participar.';

  if (Object.keys(erros).length) return { erros };
  return { dados: { email, nome, telefone, cidade, estado, instagram } };
}

function numero(v, min, max) {
  const n = typeof v === 'number' ? v : Number.NaN;
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

module.exports = { UFS, texto, normalizarEmail, validarCadastro, numero };
