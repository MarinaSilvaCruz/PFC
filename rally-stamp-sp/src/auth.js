const crypto = require('node:crypto');

const SESSAO_DIAS = 60;
const CODIGO_MINUTOS = 10;
const CODIGO_MAX_TENTATIVAS = 5;
const COOKIE = 'rally_sessao';

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function hashCodigo(email, codigo) {
  const segredo = process.env.CODE_SECRET || 'dev-secret';
  return crypto.createHmac('sha256', segredo).update(`${email}:${codigo}`).digest('hex');
}

function gerarCodigo() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

async function criarCodigo(pool, email) {
  const codigo = gerarCodigo();
  // Um código novo invalida os anteriores deste e-mail.
  await pool.query('UPDATE codigos SET usado_em = now() WHERE email = $1 AND usado_em IS NULL', [email]);
  await pool.query(
    `INSERT INTO codigos (email, codigo_hash, expira_em) VALUES ($1, $2, now() + make_interval(mins => $3))`,
    [email, hashCodigo(email, codigo), CODIGO_MINUTOS],
  );
  return codigo;
}

/** Retorna 'ok' | 'invalido' | 'expirado' | 'tentativas'. */
async function conferirCodigo(pool, email, codigo) {
  const { rows } = await pool.query(
    `SELECT id, codigo_hash, tentativas, expira_em < now() AS expirado
       FROM codigos WHERE email = $1 AND usado_em IS NULL
      ORDER BY criado_em DESC LIMIT 1`,
    [email],
  );
  const c = rows[0];
  if (!c || c.expirado) return 'expirado';
  if (c.tentativas >= CODIGO_MAX_TENTATIVAS) return 'tentativas';
  const esperado = Buffer.from(c.codigo_hash, 'hex');
  const recebido = Buffer.from(hashCodigo(email, String(codigo)), 'hex');
  if (!crypto.timingSafeEqual(esperado, recebido)) {
    await pool.query('UPDATE codigos SET tentativas = tentativas + 1 WHERE id = $1', [c.id]);
    return c.tentativas + 1 >= CODIGO_MAX_TENTATIVAS ? 'tentativas' : 'invalido';
  }
  await pool.query('UPDATE codigos SET usado_em = now() WHERE id = $1', [c.id]);
  return 'ok';
}

async function criarSessao(pool, res, participanteId) {
  const token = crypto.randomBytes(32).toString('base64url');
  await pool.query(
    `INSERT INTO sessoes (token_hash, participante_id, expira_em) VALUES ($1, $2, now() + make_interval(days => $3))`,
    [sha256(token), participanteId, SESSAO_DIAS],
  );
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSAO_DIAS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

async function encerrarSessao(pool, req, res) {
  const token = req.cookies?.[COOKIE];
  if (token) await pool.query('DELETE FROM sessoes WHERE token_hash = $1', [sha256(token)]);
  res.clearCookie(COOKIE, { path: '/' });
}

/** Middleware: preenche req.participante quando há sessão válida. */
function carregarSessao(pool) {
  return async (req, _res, next) => {
    req.participante = null;
    const token = req.cookies?.[COOKIE];
    if (!token) return next();
    try {
      const { rows } = await pool.query(
        `SELECT p.id, p.email, p.nome, p.telefone, p.cidade, p.estado, p.instagram
           FROM sessoes s JOIN participantes p ON p.id = s.participante_id
          WHERE s.token_hash = $1 AND s.expira_em > now()`,
        [sha256(token)],
      );
      req.participante = rows[0] || null;
      next();
    } catch (err) {
      next(err);
    }
  };
}

function exigirLogin(req, res, next) {
  if (!req.participante) return res.status(401).json({ erro: 'login', mensagem: 'Faça login para continuar.' });
  next();
}

module.exports = { criarCodigo, conferirCodigo, criarSessao, encerrarSessao, carregarSessao, exigirLogin, COOKIE };
