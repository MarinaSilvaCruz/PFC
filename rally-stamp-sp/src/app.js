const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { carregarSessao } = require('./auth');
const { rotasPublicas } = require('./routes/publico');
const { rotasAdmin } = require('./routes/admin');

const PUBLIC = path.join(__dirname, '..', 'public');

function criarApp(pool) {
  const app = express();
  app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", 'https://fonts.googleapis.com'],
          styleSrcAttr: ["'unsafe-inline'"],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          mediaSrc: ["'self'", 'blob:'],
          connectSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '20kb' }));

  // Só aceita JSON nas escritas da API: junto do cookie SameSite=Lax, barra envios de formulário de outros sites.
  app.use('/api', (req, res, next) => {
    const temCorpo = Number(req.get('content-length') || 0) > 0 || req.get('transfer-encoding');
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && temCorpo && !req.is('application/json')) {
      return res.status(415).json({ mensagem: 'Envie JSON.' });
    }
    next();
  });

  app.get('/healthz', (_req, res) => res.json({ ok: true }));
  app.use('/api/admin', rotasAdmin(pool));
  app.use('/api', carregarSessao(pool), rotasPublicas(pool));
  app.use('/api', (_req, res) => res.status(404).json({ mensagem: 'Rota não encontrada.' }));

  app.use('/vendor/jsQR.js', express.static(require.resolve('jsqr/dist/jsQR.js')));
  app.use(express.static(PUBLIC, { extensions: ['html'] }));
  // Link do QR (/l/<slug>?t=<token>) e qualquer outra rota abrem o app, que lê a URL.
  app.get(['/l/:slug', '/'], (_req, res) => res.sendFile(path.join(PUBLIC, 'index.html')));

  app.use((err, _req, res, _next) => {
    console.error(err);
    if (err.type === 'entity.parse.failed') return res.status(400).json({ mensagem: 'JSON inválido.' });
    res.status(500).json({ erro: 'interno', mensagem: 'Algo deu errado do nosso lado. Tente de novo em instantes.' });
  });
  return app;
}

module.exports = { criarApp };
