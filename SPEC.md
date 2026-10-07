# Rally Stamp SP (não-oficial) — Especificação do produto

> Documento de handoff. Resume tudo o que foi decidido até 03/10/2026 no chat do Claude, para recomeçar o projeto **do zero** no Claude Code. Uma primeira versão funcional existiu (ver seção 10), mas será **refeita** a partir desta spec.

---

## 1. Conceito

- Rally de carimbos **não-oficial, feito por fãs**, com pontos espalhados por São Paulo durante o período dos shows do BTS.
- **Sem afiliação** com a organização da turnê, a gravadora ou os artistas. A identidade visual deve ficar **longe da estética oficial**: nada de logos, nomes de patrocinadores, paleta ou fontes da turnê.
- Dona do projeto: Marina Cruz.
- Público: fãs (ARMY) em São Paulo, usando o celular na rua.
- O site também captura **leads** (contatos dos participantes).

---

## 2. Princípios de design

- **Mobile first.** Tudo é desenhado para celular; o desktop é secundário.
- **Referência de mecânica:** um rally de carimbos de outra turnê (tela "MAP" com carimbos circulares em trilha). **Usar só a mecânica e a estrutura, nunca o visual.**
- **Identidade própria (definida na v1, manter):**
  - Conceito: livro de carimbos de viagem / selo *dojang* coreano.
  - Paleta: papel hanji (`#f3ead6` / `#eadfc4`), tinta preta-acastanhada (`#2a2420`), vermelho de carimbo/dojang (`#b93a24`), verde celadon (`#7fa396`), dourado sutil (`#b08a2e`). **Nada de roxo** nem paleta associada à turnê.
  - Tipografia: Noto Serif KR (títulos) + Noto Sans KR (corpo).
  - Cada local coletado vira um **carimbo vermelho circular** estilo dojang/passaporte.
- Toda a interface em **português do Brasil**.

---

## 3. Estrutura de telas

### 3.1 Navegação
- Duas abas fixas no topo: **Mapa** (padrão) e **Informações**.
- O conteúdo da aba Informações ainda está **em aberto** (ver seção 8).

### 3.2 Aba Mapa (tela principal)
- Cabeçalho curto: título + instrução (ex.: "Toque num carimbo para ver a missão").
- **Cartela com trilha em zigue-zague** ligando os carimbos (efeito de tabuleiro/jornada), em linhas de 3 → 3 → 2 (ajustar ao número final de locais).
- Cada local = um círculo com o **nome do local embaixo**.
- **Sem botões no rodapé.** Os dois botões da referência foram descartados.

### 3.3 Estados de cada carimbo

| Estado | Quando | Visual | Ao tocar |
|---|---|---|---|
| **Bloqueado, deslogado** | Pessoa sem login | Cadeado cinza | Pop-up pedindo login |
| **Bloqueado, logado** | Logada, ainda não fez o check-in | Cadeado em **cor ativa** (diferente do cinza) | Abre o card de detalhe do local |
| **Coletado** | Check-in validado | Cadeado aberto / carimbo vermelho dojang preenchido | Abre o detalhe com o status "coletado" (e a data) |

---

## 4. Fluxos

### 4.1 Primeira visita (sem login)
1. A pessoa acessa o site e cai direto na aba **Mapa**, com todos os cadeados cinza.
2. Ao tocar em qualquer cadeado, abre um **pop-up**: "Faça login para acessar esta missão", com dois botões:
   - **Criar conta** → fluxo 4.2
   - **Já tenho conta** → fluxo 4.6

### 4.2 Cadastro (sign up)
- Campos:
  - E-mail (obrigatório, único; é o identificador da conta)
  - Telefone / WhatsApp (obrigatório)
  - Cidade (obrigatório)
  - Estado (obrigatório; usar um select com as UFs)
  - Instagram (opcional)
  - *Nome: decisão em aberto (seção 8).*
- Incluir um checkbox de consentimento de uso dos dados (LGPD), com um link para um texto curto de privacidade.
- Ao enviar: cria a conta, **inicia a sessão**, a página atualiza e os cadeados passam para o estado "bloqueado, logado" (cor ativa).
- *Se a verificação por código for adotada no login (seção 8), considerar verificar o e-mail também no cadastro.*

### 4.3 Detalhe do local (logada)
Ao tocar num cadeado, abre um card/modal com:
- Nome do local
- **Endereço** (com um link para abrir no Google Maps / Apple Maps)
- **Foto de onde o QR code está fixado** no local
- Descrição curta (opcional)
- Botão **"Estou aqui"**

### 4.4 Check-in no local
1. No local, a pessoa toca no cadeado e depois em **"Estou aqui"**.
2. O site pede a **geolocalização** do navegador:
   - **Permissão já concedida:** segue direto para a câmera.
   - **Permissão ainda não pedida:** aparece o pedido nativo do navegador e, ao aceitar, segue para a câmera.
   - **Negada ou GPS desligado:** mostrar uma tela de ajuda com o passo a passo para ativar (instruções separadas para iPhone/Safari e Android/Chrome) e um botão "Tentar de novo". *O site não consegue abrir os ajustes do celular nem ligar o GPS sozinho; só consegue pedir a permissão.*
3. Abre um **leitor de QR code dentro da própria página** (câmera via `getUserMedia`). **Não** abre o app nativo da câmera: assim a pessoa não sai do site e a validação acontece na hora.
4. Ao ler o QR, o frontend envia ao backend: o token lido no QR + a latitude/longitude + a precisão do GPS.
5. O backend valida:
   - O token corresponde a este local;
   - A distância (Haversine) entre a posição enviada e a coordenada real do local está **dentro do raio** configurado (padrão 150 m);
   - A pessoa ainda não carimbou este local (**1 carimbo por pessoa por local**).
6. **Sucesso:** a tela atualiza, o cadeado abre e vira carimbo, com uma animação do carimbo "batendo".
   **Falha:** mensagem clara de acordo com o motivo ("Parece que você ainda não está no local", "Este QR não é deste ponto", "Você já carimbou aqui").
7. Isso se repete para todos os locais.

### 4.5 QR escaneado fora do site
Se alguém ler o QR com a câmera normal do celular, o QR deve conter uma **URL do site** que abre direto o detalhe/check-in daquele local:
- Se a pessoa estiver logada, segue o fluxo 4.4 (pede a localização e valida, sem precisar escanear de novo).
- Se não estiver, pede login/cadastro antes e depois retoma o check-in.

### 4.6 Login (volta ou outro aparelho)
- **Sessão persistente:** a pessoa continua logada no mesmo aparelho em visitas seguintes (cookie de sessão longo, por exemplo 30–60 dias, httpOnly).
- Se ela sair ou acessar de outro aparelho: **"Já tenho conta"**, informa o e-mail, recebe um **código de 6 dígitos por e-mail** e entra. *(Método recomendado; decisão final em aberto, ver seção 8.)*
- O progresso fica salvo **na conta**, não no aparelho.
- Opção de **Sair** em algum lugar discreto (por exemplo, na aba Informações).

---

## 5. Painel admin
(Herdado da v1; manter.)
- Rota protegida por senha/token (`ADMIN_TOKEN` via variável de ambiente).
- Lista todos os participantes (leads) com o progresso de cada um (X/N carimbos, quais e quando).
- **Exportação CSV.**
- Desejável: um CRUD simples dos locais e a geração/download dos QR codes de cada local para imprimir.

---

## 6. Dados

### Locais (stops)
Cada local tem:
- `id`, `slug`
- `nome`
- `bairro` / `endereco`
- `descricao`
- `foto_qr_url` (foto de onde o QR está fixado)
- `lat`, `lng` (**nunca expostos ao navegador**)
- `raio_m` (padrão 150; parques grandes podem usar um raio maior)
- `token` do QR (**nunca exposto** nas respostas públicas da API)
- `ordem` (posição na trilha)

**Status:** a lista real de locais **ainda não foi fornecida**. A v1 usou 6 locais fictícios marcados `[PLACEHOLDER]`. Começar com placeholders e deixar fácil de substituir.

### Participantes
`id`, `email` (único), `telefone`, `cidade`, `estado`, `instagram` (opcional), `nome` (se aprovado), `consentimento_em`, `criado_em`.

### Carimbos
`participante_id`, `local_id`, `criado_em`, `lat`/`lng`/`precisao` enviados (para auditoria). Restrição de unicidade em (participante, local).

---

## 7. Requisitos técnicos

- **HTTPS obrigatório** (a câmera e a geolocalização do navegador só funcionam em contexto seguro).
- Testar em **Safari iOS** e **Chrome Android** (permissões de câmera e localização se comportam de forma diferente).
- O leitor de QR é feito no navegador (por exemplo, a biblioteca `html5-qrcode`, ou `jsQR`, ou `BarcodeDetector` com fallback).
- **Validação sempre no servidor**: as coordenadas e os tokens nunca vão para o cliente.
- Rate limit nos endpoints de login/código e de check-in.
- O backend precisa ser um **processo persistente** (API + banco), ou seja, não dá para hospedar só como página estática.
- **Banco:** a v1 usava `lowdb` (arquivo JSON). Para produção, **recomenda-se Postgres** (ou SQLite com disco persistente), porque arquivo local se perde em hospedagens com disco efêmero e não aguanta bem a concorrência em dia de show.
- **E-mail transacional** para o código de login (por exemplo, Resend ou similar).
- Os dados de lead são **dados pessoais (LGPD)**: não versionar o banco nem o `.env` no GitHub.
- A stack fica a critério da nova implementação. A v1 usava Node.js + Express + HTML/CSS/JS puro, o que é suficiente.

### Hospedagem (pesquisa de 16/09/2026; reconferir preços)

| Serviço | Free tier | Sempre ativo? | Plano mínimo sempre no ar |
|---|---|---|---|
| Render | Web Service grátis "dorme" após 15 min sem tráfego (~1 min para acordar) | Não no free tier | ~US$ 7/mês |
| Railway | Trial de 30 dias com US$ 5 de crédito, depois por uso | Sim | ~US$ 5/mês (Hobby) |

Como o tráfego se concentra nos dias de show, **evitar o cold start** no momento em que alguém for carimbar, ou seja, considerar um plano pago desde o início. Decisão de hospedagem: **com a Marina**.

---

## 8. Decisões em aberto (perguntar à Marina)

1. **Nome no cadastro:** incluir o campo nome? (A v1 tinha, a lista nova não tem.)
2. **Método de login:**
   - (a) código por e-mail: recomendado, gratuito ou barato, sem senha;
   - (b) código por WhatsApp/SMS: mais natural para o público, mas com custo por mensagem;
   - (c) só e-mail + telefone, sem código: mais simples, mas fácil de burlar.
3. **Ordem dos locais:** livre ou sequencial na trilha?
4. **Aba Informações:** qual conteúdo vai nela (regras, FAQ, aviso de não-oficialidade, contato, privacidade)?
5. **Ao completar todos os carimbos:** tela de conclusão compartilhável, sorteio/prêmio, ou nada por enquanto?
6. **Lista real de locais:** nome, endereço, descrição, coordenadas exatas, raio e foto do QR de cada um.
7. **Hospedagem e domínio.**

---

## 9. Próximos passos sugeridos (Claude Code)

1. Criar o repositório no GitHub com o `.gitignore` cobrindo `.env` e os dados.
2. Montar o esqueleto: backend + banco + frontend mobile first com a identidade visual acima.
3. Implementar na ordem: cartela (estados) → cadastro/login/sessão → detalhe do local → check-in (geolocalização + leitor de QR + validação) → admin + CSV + QR codes.
4. Usar locais placeholder até a lista real chegar.
5. Resolver as decisões da seção 8 com a Marina conforme forem bloqueando.
6. Deploy (com HTTPS) e teste em campo num celular real antes dos shows.

---

## 10. Histórico: v1 (16/09/2026), a ser substituída
- Cadastro com nome, WhatsApp e Instagram; passaporte com o progresso X/6; check-in **só por QR code fixado** abrindo a URL + geolocalização com validação Haversine no servidor (raio de 150 m); admin com senha e CSV.
- Stack: Node.js + Express + lowdb + o pacote `qrcode` + HTML/CSS/JS puro.
- Entregue como zip, nunca publicada.
- **O que muda na v2:** a pessoa cai direto na cartela; login acionado ao tocar no cadeado; cadastro com e-mail/telefone/cidade/estado/Insta; card de detalhe com endereço + foto do QR + "Estou aqui"; leitor de QR dentro do site; fluxo de **login** (não só cadastro) com sessão persistente; trilha em zigue-zague no lugar do passaporte simples.
