const express = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('../auth');
const email = require('../email');
const { normalizarEmail, validarCadastro, texto } = require('../validacao');

const limite = (windowMin, max) =>
  rateLimit({
    windowMs: windowMin * 60 * 1000,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { erro: 'limite', mensagem: 'Muitas tentativas. Espere alguns minutos e tente de novo.' },
  });

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
    try {
      await email.enviarCodigo(destino, codigo);
    } catch (err) {
      console.error(`Falha ao enviar o código para ${destino}:`, err.message);
      return res.status(502).json({
        erro: 'email',
        mensagem: 'Não conseguimos enviar o código para este e-mail agora. Confira se ele está certo e tente de novo em alguns minutos.',
      });
    }
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

  // Check-in pela palavra da pessoa: tocar em "Estou aqui" no local basta (sem QR e sem GPS).
  // Vale um carimbo por pessoa por local.
  r.post('/checkin', limiteCheckin, auth.exigirLogin, async (req, res) => {
    const slug = texto(req.body?.slug, 100);
    if (!slug) return res.status(400).json({ erro: 'validacao', mensagem: 'Escolha um local para carimbar.' });

    const { rows } = await pool.query('SELECT id FROM locais WHERE slug = $1 AND ativo', [slug]);
    const local = rows[0];
    if (!local) return res.status(404).json({ erro: 'local', mensagem: 'Local não encontrado.' });

    const ins = await pool.query(
      `INSERT INTO carimbos (participante_id, local_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING RETURNING criado_em`,
      [req.participante.id, local.id],
    );
    if (!ins.rowCount) {
      const ja = await pool.query('SELECT criado_em FROM carimbos WHERE participante_id = $1 AND local_id = $2', [req.participante.id, local.id]);
      return res.status(409).json({ erro: 'ja_carimbado', mensagem: 'Você já carimbou aqui.', coletado_em: ja.rows[0]?.criado_em });
    }
    res.json({ ok: true, slug, coletado_em: ins.rows[0].criado_em });
  });

  return r;
}

module.exports = { rotasPublicas };
