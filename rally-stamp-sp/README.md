# Unofficial Stamp Rally (v2)

Rally de carimbos **não-oficial, feito por fãs**, pelas ruas de São Paulo. A especificação completa está em [`../SPEC.md`](../SPEC.md).

**No ar em https://rally.drpgrowth.com** (Railway + Postgres; e-mails pelo Resend a partir de `rally.drpgrowth.com`).

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

`data/locais.json` tem os locais do rally. Para adicionar ou mudar locais, há dois caminhos:

1. Editar `data/locais.json`: locais novos entram sozinhos no próximo deploy; mudanças nos existentes entram com `SINCRONIZAR_LOCAIS=true` (casando pelo `slug`). Com a variável desligada, um local existente marcado com `"forcar": true` também é atualizado a cada deploy (para tirar um local da cartela, use `"ativo": false` junto).
2. Usar o painel `/admin` → **Locais** (criar, editar, desativar).

Campos: `slug`, `nome`, `bairro`, `endereco`, `descricao`, `horario`, `tipo` (`loja` ou `fan_project`), `foto_qr_url` (foto opcional do local), `ordem`, `ativo`.
`lat`, `lng`, `raio_m` e `token` continuam no banco, mas hoje não são usados: o carimbo não depende de QR nem de localização.

O link `PUBLIC_URL/l/<slug>` abre o site direto no detalhe daquele local.

## Admin

`/admin`, com o `ADMIN_TOKEN` do `.env`. Mostra os participantes com o progresso de cada um, exporta CSV (separado por `;`, abre direto no Excel em português) e gerencia os locais.

## Regras do check-in (servidor)

Desde 26/10/2026 o check-in é pela palavra da pessoa: no local, ela toca no botão verde **Estou aqui** e o carimbo é aceito. Não há leitura de QR nem checagem de localização.

1. Precisa estar logada.
2. O local precisa existir e estar ativo.
3. Um carimbo por pessoa por local (`Você já carimbou aqui`), garantido por chave primária.

Login, código e check-in têm rate limit por IP. A sessão é um cookie httpOnly de 60 dias; o código de login tem 6 dígitos, vale 10 minutos e aceita 5 tentativas.

## Testes

```bash
npm test                                   # testes de unidade
TEST_DATABASE_URL=postgres://.../rally_test npm test   # + testes de API (APAGA esse banco)
```

## Deploy

Passo a passo completo em [`DEPLOY.md`](DEPLOY.md) (Railway + Resend, com o domínio por último).

Os dados dos participantes são pessoais (LGPD): o `.env` e exports CSV estão no `.gitignore`; nunca versione o banco.
