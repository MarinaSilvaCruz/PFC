# Unofficial Stamp Rally — identidade visual

Unofficial Stamp Rally é um rally de carimbos feito por fã, para fã: durante as datas de shows do BTS em São Paulo, quem está na cidade visita pontos ligados a projetos de fãs e coleciona carimbos pelo caminho, mergulhando mais na cultura asiática em volta do K-pop. É um projeto não-oficial — não tem qualquer vínculo com a HYBE, com o BTS ou com a organização da turnê, e essa distância precisa ficar visível na marca, não só no texto do rodapé.

## Para quem estamos desenhando

Público: mulheres millennials, fãs de BTS (ARMY) que já conhecem bem a estética do universo K-pop e vão notar — e estranhar — qualquer coisa que pareça "oficial" demais ou genérica demais. A identidade precisa ser divertida, calorosa e um pouco bagunçada no bom sentido: mais sticker de caderno do que painel corporativo. Nada de visual "feito para agradar todo mundo"; é para agradar quem já vive esse universo.

## Território visual

A referência não é o show, é a viagem: papelaria coreana, carimbo de passaporte, washi tape, polaroid colada torta, placa de rua de Seul à noite. É um caderno de viagem de fã, não um outdoor de turnê.

Três decisões deliberadas para não colidir com a identidade oficial:

1. **Sem roxo, com uma exceção.** O roxo é a cor mais associada ao fandom oficial (o "ARMY Bomb", a identidade da turnê). A interface evita a família roxo/violeta de propósito — vamos de coral, menta e azul-céu. A única exceção são os **fan projects** (ações feitas por fãs): neles o roxo marca justamente o que vem da ARMY, sempre junto do selo de coração (veja *Fan projects* abaixo). Fora disso, nada de roxo.
2. **Sem tipografia ou logotipo oficial.** Nenhuma fonte, lettering ou símbolo que imite a marca do grupo, da turnê ou da HYBE. As fontes escolhidas abaixo têm personalidade coreana (duas delas são, literalmente, fontes de origem coreana), mas nenhuma reproduz uma marca existente.
3. **Sem rosto, sem nome de membro, sem logo do grupo.** A identidade celebra a cultura em volta do fandom — comida, papelaria, trilhas pela cidade — não a imagem dos artistas.

> Recomendamos validar com jurídico o uso da sigla "BTS" e do termo "ARMY" no site e nas peças, e incluir um aviso claro de "projeto de fã, não-oficial" em local visível (rodapé e tela de abertura). Isso é uma recomendação de produto, não uma opinião jurídica.

## Cores

Paleta clara (tema `claro`). Roxo só nos fan projects (`purple-*`). Cada cor tem uma versão "decorativa" (uso em ilustrações e preenchimentos grandes) e uma versão "funcional" (texto, ícone, botão — testada para contraste de leitura).

| Papel | Token | Uso |
|---|---|---|
| Fundo de página | `surface-50` | A folha de passaporte onde tudo é colado. |
| Fundo de card | `surface-0` | Cartão de parada, modal, folha de carimbo. |
| Fundo de seção | `surface-100` | Faixas alternadas em listas longas. |
| Texto principal | `ink-900` | Títulos, texto de leitura, ícones padrão. |
| Texto secundário | `ink-600` | Legendas, placeholders. |
| Marca primária | `coral-600` (funcional) / `coral-500` (decorativo) | Botão principal, links, destaque de marca. |
| Marca secundária | `mint-600` (funcional) / `mint-500` (decorativo) | Botão secundário, barra de progresso do rally. |
| Acento informativo | `sky-600` (funcional) / `sky-500` (decorativo) | Links, avisos, botão terciário. |
| Acento de conquista | `yellow-500` | Selo de conquista, confete — sempre com `ink-900` por cima. |
| Carimbo validado | `stamp-red-600` (funcional) / `stamp-red-500` (decorativo) | Estado "carimbado", ícone de check, cor de tinta do selo. |
| Fan project | `purple-600` (funcional) / `purple-500` (decorativo) | Só em paradas do tipo fan project: anel e cadeado do selo, tinta do carimbo, selo de coração, chip de tipo. |

Regra simples para não errar: se a cor carrega texto ou precisa ser lida rápido (botão, link, ícone pequeno), use a versão `-600`. Se é só decoração (ilustração, fundo de sticker, confete), use a `-500`. As versões `-100` (`coral-100`, `mint-100`, `sky-100`, `yellow-100`, `stamp-red-100`, `purple-100`) são só fundo de badge, sempre com texto `ink-900` por cima. `border-sand` é a linha pontilhada decorativa (trilha no mapa, divisória) — não serve como borda de campo; para isso existe `border-control`, e o foco de teclado usa sempre `focus-ring`.

## Tipografia

Três famílias, cada uma com um papel bem demarcado:

- **`display`** — *Do Hyeon*: fonte de origem coreana, com cara de letreiro/placa de rua de Seul. Usada só em títulos grandes (`display-lg`, `display-sm`) — é a assinatura visual da marca, não serve para texto corrido.
- **`sans`** — *Baloo 2*: fonte arredondada e amigável, acessível para o público millennial, com ótima leitura em português. Base de toda a interface: títulos de card (`heading-lg/md/sm`) e texto (`body-lg/md`, `caption`).
- **`script`** — *Nanum Pen Script*: fonte de caligrafia coreana, usada só em toques manuscritos pontuais (`script-note`) — data do carimbo, uma frase fofa ao lado de um selo. Nunca em blocos longos de texto: cansa a leitura e perde a graça.

Regra de uso: um título de tela usa `display-lg`/`display-sm` OU `heading-lg`, nunca os dois competindo na mesma área. O `script-note` é tempero, não corpo de texto.

## Espaçamento e raio

Escala de espaçamento em passos de 4px (`space-2` a `space-24`) para manter ritmo entre elementos — do respiro mínimo entre ícone e rótulo (`space-2`) ao respiro entre blocos grandes de tela (`space-24`).

Três raios, cada um com um papel: `radius-sm` (8px) para inputs e tags pequenas, `radius-md` (16px) para cards e botões — o raio "padrão" da marca — e `radius-full` para tudo que deve parecer um selo ou pílula: botão arredondado, avatar, e o próprio carimbo circular.

## Iconografia e padrões gráficos

A metáfora central do produto é o carimbo de viagem, então o sistema gráfico usa:

- **Selos circulares** (`radius-full`) como forma de badge de conquista — o "carimbo" que o app dá quando uma parada é validada.
- **Trilha pontilhada** (`border-sand`) como elemento de mapa/caminho entre paradas, nunca como borda de componente.
- **Washi tape e canto de polaroid**: cantos levemente inclinados ou uma faixa colorida fina no topo de um card, como se fosse fita decorativa colando aquele "carimbo" na página — efeito sutil, não literal (sem textura de fita colada escaneada).
- **Confete e stickers**: pontinhos e formas soltas em `coral-500`/`mint-500`/`yellow-500` para celebrar uma conquista, sempre com moderação — o excesso quebra a leitura.

### Fan projects: roxo + selo de coração

O rally mistura dois tipos de parada na mesma cartela: **lojas, cafés e espaços culturais** de K-pop e cultura asiática (nem todos coreanos) e **fan projects** (exposições, murais, cafés temáticos organizados por fãs). A diferença aparece em duas camadas, para nunca depender só da cor:

- **Cor:** lojas usam menta (`mint-600` no anel e no cadeado, `mint-100` de fundo); fan projects usam roxo (`purple-600` no anel e no cadeado, `purple-100` de fundo). O carimbo coletado de loja sai em `stamp-red-600` com "RALLY SP"; o de fan project sai em `purple-600` com "FAN PROJ".
- **Selo de coração:** um círculo de 26px em `purple-600`, com coração branco e borda `surface-0` de 2px, preso no canto superior direito do selo de todo fan project, em todos os estados (inclusive o cinza de quem ainda não entrou). Lojas não levam selo.
- **Legenda e chip:** a cartela mostra a legenda "Lojas, cafés e cultura · Fan projects", e o card do local leva um chip de tipo (`mint-100` ou `purple-100`, com o coração em `purple-600` no de fan project).

Evitar: gradiente roxo-azul (clichê genérico de "app de IA"), emoji dentro de card como ícone, cards com borda lateral colorida grossa, qualquer forma de escudo/brasão que pareça logotipo oficial de grupo.

## Tom de voz

Caloroso, direto, com a intimidade de quem já é da fandom — mas sem forçar gíria. Frases curtas, convite em vez de instrução. Exemplos:

> "Bora carimbar?"
> "Mais uma parada, mais um pedaço da cultura."
> "Seu passaporte de fã está quase completo."

Evitar linguagem corporativa ("acesse o módulo", "realize o cadastro") e evitar imitar o tom oficial de comunicado de turnê.

## Próximos passos

Esta versão cobre cor (incluindo o roxo dos fan projects), tipografia, espaçamento e raio — a base para qualquer tela do site. Ainda não há um logotipo definido (o nome em `display-lg` funciona como marca provisória) nem componentes de interface prontos (botão, badge de carimbo, card de parada). Podemos construir esses componentes em seguida, já em cima destes tokens.
