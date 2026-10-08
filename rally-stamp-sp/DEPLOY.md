# Colocar o Unofficial Stamp Rally no ar

O site roda no **Railway** (servidor + banco Postgres, com HTTPS automático) e manda o código de login pelo **Resend**.
O caminho é em três fases: primeiro o site no ar com o endereço provisório do Railway, depois o e-mail, e por último o domínio definitivo.

> Os nomes dos botões do Railway e do Resend podem mudar um pouco com o tempo. Se algo não bater, procure a opção equivalente.

---

## Fase 1: site no ar com endereço provisório

### 1.1 Criar o projeto no Railway

1. Crie a conta em [railway.com](https://railway.com) entrando com o GitHub e assine o plano **Hobby**.
2. **New Project → Deploy from GitHub repo** e escolha `marinasilvacruz/pfc`.
3. No serviço criado, abra **Settings**:
   - **Source → Root Directory:** `rally-stamp-sp`
   - **Source → Branch:** `master`
4. No projeto, clique em **+ New → Database → PostgreSQL**. O banco aparece ao lado do site.

O arquivo `railway.json` (nesta pasta) já diz ao Railway como iniciar o site (`npm start`) e onde testar se ele está de pé (`/healthz`).

### 1.2 Variáveis de ambiente

No serviço do site, aba **Variables**, adicione:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (o Railway liga ao banco do projeto) |
| `NODE_ENV` | `production` |
| `ADMIN_TOKEN` | uma senha longa e aleatória (é a senha do `/admin`) |
| `CODE_SECRET` | outra senha longa e aleatória, diferente da anterior |
| `PUBLIC_URL` | o endereço provisório (passo 1.3), por exemplo `https://unofficial-stamp-rally.up.railway.app` |
| `SINCRONIZAR_LOCAIS` | `true` enquanto os locais forem mantidos no arquivo `data/locais.json` |

Senhas aleatórias: o Railway tem um botão para gerar valores na tela de variáveis; ou rode `openssl rand -base64 32` num terminal.

### 1.3 Endereço provisório

Em **Settings → Networking → Generate Domain**. O Railway cria um endereço `https://….up.railway.app`.
Copie esse endereço para a variável `PUBLIC_URL` (sem barra no final). O Railway refaz o deploy sozinho.

### 1.4 Conferir

- Abra o endereço: a cartela aparece com os 8 locais.
- Abra `/admin`, entre com o `ADMIN_TOKEN` e veja a lista de locais.
- Sem o Resend configurado, o código de login aparece nos **logs** do serviço (aba **Deployments → View logs**). Dá para testar o login copiando o código de lá.

---

## Fase 2: e-mail do código de login (Resend)

1. Crie a conta em [resend.com](https://resend.com) e gere uma **API Key** (permissão de envio).
2. No Railway, adicione as variáveis:
   - `RESEND_API_KEY` = a chave gerada
   - `EMAIL_FROM` = `Unofficial Stamp Rally <onboarding@resend.dev>` (provisório)

**Limitação até a Fase 3:** sem um domínio verificado, o Resend só entrega e-mails para o endereço da própria conta do Resend. Dá para testar com o seu e-mail, mas outras pessoas ainda não recebem o código.

**Limite diário:** o plano grátis do Resend tem limite de e-mails por dia (100 quando conferimos). Cada login gasta um e-mail, então para os dias de show vale assinar o plano pago no mês do evento. Reconfira os valores no site do Resend.

---

## Fase 3: domínio definitivo (por último)

Faça esta fase **antes de imprimir os QR codes**, porque o endereço do site vai dentro deles.

1. **Domínio do site:** no Railway, **Settings → Networking → Custom Domain**, digite o domínio (por exemplo `rally.seudominio.com.br`). O Railway mostra um registro **CNAME**: crie esse registro no painel de DNS de onde o domínio está registrado. O HTTPS é emitido sozinho.
2. **Domínio do e-mail:** no Resend, **Domains → Add Domain**, use o mesmo domínio e crie no DNS os registros que ele mostrar (SPF, DKIM e, se pedir, MX). Espere aparecer "Verified".
3. Atualize as variáveis no Railway:
   - `PUBLIC_URL` = `https://rally.seudominio.com.br`
   - `EMAIL_FROM` = `Unofficial Stamp Rally <nao-responda@seudominio.com.br>`
4. Teste o login com um e-mail que não seja o seu.
5. Só então, no `/admin` → **Locais**, baixe e imprima os QR codes.

---

## Checklist antes de divulgar

- [ ] Coordenadas exatas de todos os locais (hoje marcadas com `"_obs": "coordenadas aproximadas: confirmar"` em `data/locais.json`)
- [ ] Foto de onde cada QR fica (`foto_qr_url`)
- [ ] Instagram de contato (hoje `[PLACEHOLDER]` em `public/index.html`)
- [ ] Texto de privacidade revisado
- [ ] Teste em campo num iPhone (Safari) e num Android (Chrome): localização, câmera e carimbo
- [ ] QR codes impressos com o domínio definitivo

## Depois de no ar

- **Mudar locais:** com `SINCRONIZAR_LOCAIS=true`, cada deploy aplica o `data/locais.json` (o token dos QRs já impressos é mantido; locais que saíram do arquivo ficam desativados). Se preferir editar pelo `/admin`, mude a variável para `false`, senão o próximo deploy desfaz as edições.
- **Leads:** `/admin` → **Participantes** → **Exportar CSV**.
- **Backup:** o Postgres do Railway tem backups na aba do banco; vale ativar antes dos shows.
