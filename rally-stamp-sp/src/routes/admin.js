const crypto = require('node:crypto');
const express = require('express');
const QRCode = require('qrcode');
const rateLimit = require('express-rate-limit');
const { gerarToken, urlDoQr, validarLocal } = require('../locais');

function exigirAdmin(req, res, next) {
  const esperado = process.env.ADMIN_TOKEN;
  if (!esperado) return res.status(503).json({ mensagem: 'Admin desativado: defina ADMIN_TOKEN.' });
  const recebido = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const h = (s) => crypto.createHash('sha256').update(s).digest();
  if (!recebido || !crypto.timingSafeEqual(h(recebido), h(esperado))) {
    return res.status(401).json({ mensagem: 'Token inválido.' });
  }
  next();
}

/** Evita que planilhas interpretem um campo como fórmula. */
function celula(v) {
  if (v === null || v === undefined) return '';
  let s = v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function rotasAdmin(pool) {
  const r = express.Router();
  r.use(rateLimit({ windowMs: 5 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
  r.use(exigirAdmin);

  async function participantesComCarimbos() {
    const [locais, participantes, carimbos] = await Promise.all([
      pool.query('SELECT id, slug, nome FROM locais ORDER BY ordem, id'),
      pool.query('SELECT * FROM participantes ORDER BY criado_em'),
      pool.query('SELECT participante_id, local_id, criado_em FROM carimbos ORDER BY criado_em'),
    ]);
    const porParticipante = new Map();
    for (const c of carimbos.rows) {
      if (!porParticipante.has(c.participante_id)) porParticipante.set(c.participante_id, []);
      porParticipante.get(c.participante_id).push(c);
    }
    return {
      locais: locais.rows,
      participantes: participantes.rows.map((p) => ({ ...p, carimbos: porParticipante.get(p.id) || [] })),
    };
  }

  r.get('/participantes', async (_req, res) => res.json(await participantesComCarimbos()));

  r.get('/participantes.csv', async (_req, res) => {
    const { locais, participantes } = await participantesComCarimbos();
    const cab = ['id', 'email', 'nome', 'telefone', 'cidade', 'estado', 'instagram', 'email_verificado_em', 'consentimento_em', 'criado_em', 'carimbos', ...locais.map((l) => l.slug)];
    const linhas = participantes.map((p) => {
      const quando = new Map(p.carimbos.map((c) => [c.local_id, c.criado_em]));
      return [p.id, p.email, p.nome, p.telefone, p.cidade, p.estado, p.instagram, p.email_verificado_em, p.consentimento_em, p.criado_em, `${p.carimbos.length}/${locais.length}`, ...locais.map((l) => quando.get(l.id))];
    });
    const csv = [cab, ...linhas].map((l) => l.map(celula).join(';')).join('\r\n');
    const data = new Date().toISOString().slice(0, 10);
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="participantes-${data}.csv"`);
    res.send(`﻿${csv}`);
  });

  r.get('/locais', async (_req, res) => {
    const { rows } = await pool.query(
      `SELECT l.*, (SELECT count(*)::int FROM carimbos c WHERE c.local_id = l.id) AS total_carimbos
         FROM locais l ORDER BY ordem, id`,
    );
    res.json({ locais: rows.map((l) => ({ ...l, url_qr: urlDoQr(l) })) });
  });

  const respostaErro = (res, erros) => res.status(400).json({ erros, mensagem: 'Confira os campos.' });
  const conflito = (err, res) => {
    if (err.code === '23505') return res.status(409).json({ erros: { slug: 'Já existe um local com este slug.' }, mensagem: 'Slug repetido.' });
    throw err;
  };

  r.post('/locais', async (req, res) => {
    const { dados: d, erros } = validarLocal(req.body);
    if (erros) return respostaErro(res, erros);
    try {
      const { rows } = await pool.query(
        `INSERT INTO locais (slug, nome, bairro, endereco, descricao, foto_qr_url, lat, lng, raio_m, ordem, ativo, tipo, horario, token)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
        [d.slug, d.nome, d.bairro, d.endereco, d.descricao, d.foto_qr_url, d.lat, d.lng, d.raio_m, d.ordem, d.ativo, d.tipo, d.horario, gerarToken()],
      );
      res.status(201).json({ local: rows[0] });
    } catch (err) {
      conflito(err, res);
    }
  });

  r.put('/locais/:id', async (req, res) => {
    const { dados: d, erros } = validarLocal(req.body);
    if (erros) return respostaErro(res, erros);
    try {
      const { rows } = await pool.query(
        `UPDATE locais SET slug=$1, nome=$2, bairro=$3, endereco=$4, descricao=$5, foto_qr_url=$6, lat=$7, lng=$8, raio_m=$9, ordem=$10, ativo=$11, tipo=$12, horario=$13
          WHERE id = $14 RETURNING *`,
        [d.slug, d.nome, d.bairro, d.endereco, d.descricao, d.foto_qr_url, d.lat, d.lng, d.raio_m, d.ordem, d.ativo, d.tipo, d.horario, Number(req.params.id)],
      );
      if (!rows[0]) return res.status(404).json({ mensagem: 'Local não encontrado.' });
      res.json({ local: rows[0] });
    } catch (err) {
      conflito(err, res);
    }
  });

  r.post('/locais/:id/novo-token', async (req, res) => {
    const { rows } = await pool.query('UPDATE locais SET token = $1 WHERE id = $2 RETURNING *', [gerarToken(), Number(req.params.id)]);
    if (!rows[0]) return res.status(404).json({ mensagem: 'Local não encontrado.' });
    res.json({ local: rows[0] });
  });

  r.delete('/locais/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM carimbos WHERE local_id = $1', [id]);
    if (rows[0].n > 0) {
      return res.status(409).json({ mensagem: `Este local já tem ${rows[0].n} carimbo(s). Desative-o em vez de excluir.` });
    }
    await pool.query('DELETE FROM locais WHERE id = $1', [id]);
    res.json({ ok: true });
  });

  r.get('/locais/:id/qr.png', async (req, res) => {
    const { rows } = await pool.query('SELECT slug, token FROM locais WHERE id = $1', [Number(req.params.id)]);
    if (!rows[0]) return res.status(404).json({ mensagem: 'Local não encontrado.' });
    const png = await QRCode.toBuffer(urlDoQr(rows[0]), { width: 1024, margin: 2, errorCorrectionLevel: 'M' });
    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', `attachment; filename="qr-${rows[0].slug}.png"`);
    res.send(png);
  });

  return r;
}

module.exports = { rotasAdmin, celula };
