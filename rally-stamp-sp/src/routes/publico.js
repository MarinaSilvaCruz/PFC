const crypto = require('node:crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('../auth');
const email = require('../email');
const { dentroDoRaio } = require('../geo');
const { normalizarEmail, validarCadastro, numero, texto } = require('../validacao');

const limite = (windowMin, max) =>
  rateLimit({
    windowMs: windowMin * 60 * 1000,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { erro: 'limite', mensagem: 'Muitas tentativas. Espere alguns minutos e tente de novo.' },
  });

const iguais = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

function rotasPublicas(pool) {
  const r = express.Router();
  const limiteCodigo = limite(15, 8);
  const limiteVerificar = limite(15, 20);
  const limiteCheckin = limite(5, 30);

  r.get('/me', (req, res) => res.json({ participante: req.participante }));

  r.get('/locais', async (req, res) => {
    const { rows } = await pool.query(
      `SELECT l.slug, l.nome, l.bairro, l.endereco, l.descricao, l.foto_qr_url, l.ordem, l.tipo, l.horario, c.criado_em AS coletado_em
         FROM locais l
         LEFT JOIN carimbos c ON c.local_id = l.id AND c.participante_id = $1
        WHERE l.ativo
        ORDER BY l.ordem, l.id`,
      [req.participante?.id ?? null],
    );
    res.json({ locais: rows });
  });

  async function enviar(res, destino) {
    const codigo = await auth.criarCodigo(pool, destino);
    await email.enviarCodigo(destino, codigo);
    res.json({ ok: true, email: destino });
  }

  r.post('/auth/cadastro', limiteCodigo, async (req, res) => {
    const { dados, erros } = validarCadastro(req.body);
    if (erros) return res.status(400).json({ erro: 'validacao', erros, mensagem: 'Confira os campos destacados.' });

    const { rows } = await pool.query('SELECT id, email_verificado_em FROM participantes WHERE email = $1', [dados.email]);
    if (rows[0]?.email_verificado_em) {
      return res.status(409).json({ erro: 'existe', mensagem: 'Este e-mail já tem conta. Use “Já tenho conta” para entrar.' });
    }
    // Conta ainda não verificada: os dados são atualizados com o envio mais recente.
    await pool.query(
      `INSERT INTO participantes (email, nome, telefone, cidade, estado, instagram, consentimento_em)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       ON CONFLICT (email) DO UPDATE SET nome = $2, telefone = $3, cidade = $4, estado = $5, instagram = $6, consentimento_em = now()`,
      [dados.email, dados.nome, dados.telefone, dados.cidade, dados.estado, dados.instagram],
    );
    await enviar(res, dados.email);
  });

  r.post('/auth/entrar', limiteCodigo, async (req, res) => {
    const email = normalizarEmail(req.body?.email);
    if (!email) return res.status(400).json({ erro: 'validacao', erros: { email: 'Informe um e-mail válido.' }, mensagem: 'Informe um e-mail válido.' });
    const { rowCount } = await pool.query('SELECT 1 FROM participantes WHERE email = $1', [email]);
    if (!rowCount) {
      return res.status(404).json({ erro: 'nao_encontrado', mensagem: 'Não encontramos uma conta com este e-mail. Que tal criar uma?' });
    }
    await enviar(res, email);
  });

  r.post('/auth/verificar', limiteVerificar, async (req, res) => {
    const email = normalizarEmail(req.body?.email);
    const codigo = texto(req.body?.codigo, 6);
    if (!email || !/^\d{6}$/.test(codigo)) {
      return res.status(400).json({ erro: 'validacao', mensagem: 'Digite os 6 números do código.' });
    }
    const resultado = await auth.conferirCodigo(pool, email, codigo);
    const mensagens = {
      invalido: 'Código incorreto. Confira e tente de novo.',
      expirado: 'Este código expirou. Peça um novo.',
      tentativas: 'Muitas tentativas com este código. Peça um novo.',
    };
    if (resultado !== 'ok') return res.status(400).json({ erro: resultado, mensagem: mensagens[resultado] });

    const { rows } = await pool.query(
      `UPDATE participantes SET email_verificado_em = COALESCE(email_verificado_em, now())
        WHERE email = $1 RETURNING id, email, nome`,
      [email],
    );
    if (!rows[0]) return res.status(404).json({ erro: 'nao_encontrado', mensagem: 'Conta não encontrada.' });
    await auth.criarSessao(pool, res, rows[0].id);
    res.json({ participante: rows[0] });
  });

  r.post('/auth/sair', async (req, res) => {
    await auth.encerrarSessao(pool, req, res);
    res.json({ ok: true });
  });

  r.post('/checkin', limiteCheckin, auth.exigirLogin, async (req, res) => {
    const slug = texto(req.body?.slug, 100);
    const token = texto(req.body?.token, 200);
    const lat = numero(req.body?.lat, -90, 90);
    const lng = numero(req.body?.lng, -180, 180);
    const precisao = numero(req.body?.precisao, 0, 100000);
    if (!slug || !token || lat === null || lng === null) {
      return res.status(400).json({ erro: 'validacao', mensagem: 'Não conseguimos ler o QR ou a sua localização. Tente de novo.' });
    }

    const { rows } = await pool.query('SELECT id, lat, lng, raio_m, token FROM locais WHERE slug = $1 AND ativo', [slug]);
    const local = rows[0];
    if (!local) return res.status(404).json({ erro: 'local', mensagem: 'Local não encontrado.' });

    if (!iguais(token, local.token)) {
      return res.status(400).json({ erro: 'qr_outro_local', mensagem: 'Este QR não é deste ponto.' });
    }

    const ja = await pool.query('SELECT criado_em FROM carimbos WHERE participante_id = $1 AND local_id = $2', [req.participante.id, local.id]);
    if (ja.rowCount) {
      return res.status(409).json({ erro: 'ja_carimbado', mensagem: 'Você já carimbou aqui.', coletado_em: ja.rows[0].criado_em });
    }

    const tolerancia = Number(process.env.GPS_TOLERANCIA_MAX_M ?? 50);
    const { ok, distancia } = dentroDoRaio({ lat, lng, precisao }, local, tolerancia);
    if (!ok) {
      return res.status(400).json({ erro: 'longe', mensagem: 'Parece que você ainda não está no local.', distancia_m: Math.round(distancia) });
    }

    const ins = await pool.query(
      `INSERT INTO carimbos (participante_id, local_id, lat, lng, precisao) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING RETURNING criado_em`,
      [req.participante.id, local.id, lat, lng, precisao],
    );
    if (!ins.rowCount) return res.status(409).json({ erro: 'ja_carimbado', mensagem: 'Você já carimbou aqui.' });
    res.json({ ok: true, slug, coletado_em: ins.rows[0].criado_em });
  });

  return r;
}

module.exports = { rotasPublicas };
