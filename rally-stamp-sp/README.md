# Unofficial Stamp Rally (v2)

Rally de carimbos **não-oficial, feito por fãs**, pelas ruas de São Paulo. A especificação completa está em [`../SPEC.md`](../SPEC.md).

- **Backend:** Node.js 20+ · Express 5 · Postgres
- **Frontend:** HTML/CSS/JS puro (módulos ES), mobile first
- **Visual:** design system "Unofficial Stamp Rally" ([artifact](https://claude.ai/artifact/3gYmkqzHJuhHaXsj8nboHm)). A cópia dos tokens fica em `design-system/tokens.json`, e `public/css/tokens.css` é gerado a partir dela (`npm run tokens`). Os componentes em `public/css/app.css` usam só esses tokens.

## Rodar localmente

```bash
# 1. Postgres (qualquer um serve; com Docker:)
docker run -d --name rally-pg -e POSTGRES_USER=rally -e POSTGRES_PASSWORD=rally -e POSTGRES_DB=rally -p 5432:5432 postgres:16

# 2. Configuração
cp .env.example .env   # e ajuste os valores

# 3. App
npm install
npm run dev            # http://localhost:3000
```

Na primeira subida, as tabelas são criadas e, se o banco não tiver locais, os de `data/locais.json` são importados.
Sem `RESEND_API_KEY`, o código de login aparece no console do servidor.

> A câmera e a geolocalização só funcionam em **HTTPS** (ou em `localhost`). Para testar no celular, use um túnel HTTPS (por exemplo `cloudflared tunnel --url http://localhost:3000`) e ajuste `PUBLIC_URL`.

## Locais

`data/locais.json` tem os locais reais confirmados até agora. As coordenadas marcadas com `"_obs": "coordenadas aproximadas: confirmar"` ainda precisam ser conferidas (no Google Maps, segure o dedo sobre o local e copie os números). Para adicionar ou mudar locais, há dois caminhos:

1. Editar `data/locais.json` e rodar `npm run seed`. Os locais casam pelo `slug`; o token do QR de um local que já existe é mantido (QRs impressos continuam valendo).
2. Usar o painel `/admin` → **Locais** (criar, editar, desativar, trocar token, baixar o QR em PNG).

Campos: `slug`, `nome`, `bairro`, `endereco`, `descricao`, `foto_qr_url`, `lat`, `lng`, `raio_m` (padrão 150), `ordem`, `ativo`.
`lat`, `lng`, `raio_m` e o token **nunca** saem na API pública.

O QR de cada local aponta para `PUBLIC_URL/l/<slug>?t=<token>`: lido pelo leitor do site, valida na hora; lido pela câmera normal, abre o site já no check-in daquele ponto.

## Admin

`/admin`, com o `ADMIN_TOKEN` do `.env`. Mostra os participantes com o progresso de cada um, exporta CSV (separado por `;`, abre direto no Excel em português) e gerencia os locais e os QR codes.

## Regras do check-in (servidor)

1. O token lido tem que ser o do local escolhido (`Este QR não é deste ponto`).
2. Um carimbo por pessoa por local (`Você já carimbou aqui`), garantido por chave primária.
3. Distância de Haversine até o local ≤ `raio_m` + folga da precisão do GPS, limitada por `GPS_TOLERANCIA_MAX_M` (padrão 50 m) (`Parece que você ainda não está no local`).

Login, código e check-in têm rate limit por IP. A sessão é um cookie httpOnly de 60 dias; o código de login tem 6 dígitos, vale 10 minutos e aceita 5 tentativas.

## Testes

```bash
npm test                                   # testes de unidade
TEST_DATABASE_URL=postgres://.../rally_test npm test   # + testes de API (APAGA esse banco)
```

## Deploy

Precisa de um processo Node sempre ligado + Postgres (Railway ou Render pagos evitam o "cold start" no dia do show). Variáveis: as do `.env.example`, com `NODE_ENV=production` (cookie `Secure`), `DATABASE_SSL=true` se o provedor pedir, `PUBLIC_URL` com o domínio final **antes de imprimir os QRs**, e uma `RESEND_API_KEY` com domínio verificado em `EMAIL_FROM`.

Os dados dos participantes são pessoais (LGPD): o `.env` e exports CSV estão no `.gitignore`; nunca versione o banco.
