import { $, api, esc, dataHora, toast } from './util.js';
import { abrirFolha, fecharFolha, iniciarFolha } from './folha.js';
import { cadeado, seloTinta, pin, coracao, relogio } from './icones.js';
import { pedirLogin, configurarContas } from './contas.js';
import { iniciarCheckin, configurarCheckin } from './checkin.js';
import { mostrarConclusao } from './conclusao.js';

const estado = { participante: null, locais: [], aposLogin: null };
const CHAVE_PENDENTE = 'rally:checkin-pendente';

/** Usada enquanto o local não tem a foto real de onde o QR fica. */
const FOTO_PROVISORIA = '/img/foto-placeholder.svg';

const giro = (i) => `${((i * 37) % 17) - 8}deg`;
const ehFan = (l) => l.tipo === 'fan_project';
const NOME_TIPO = { loja: 'Lojas e cafés', fan_project: 'Fan project' };
const completo = () => estado.locais.length > 0 && estado.locais.every((l) => l.coletado_em);

/* ---------- Menu: página única, o menu rola até a seção ---------- */
function marcarMenu(secao) {
  document.querySelectorAll('.aba[data-secao]').forEach((a) => {
    if (a.dataset.secao === secao) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
}

function irPara(secao) {
  if (secao === 'mapa') window.scrollTo({ top: 0 });
  else $(`#${secao}`).scrollIntoView({ block: 'start' });
  marcarMenu(secao);
}

function iniciarMenu() {
  // A altura do topo fixo define onde a seção para ao rolar.
  const topo = $('.topo');
  const medir = () => document.documentElement.style.setProperty('--altura-topo', `${topo.offsetHeight + 8}px`);
  medir();
  new ResizeObserver(medir).observe(topo);

  document.querySelectorAll('a[data-secao]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      irPara(a.dataset.secao);
    });
  });
  // O item do menu acompanha a rolagem: "Informações" fica ativo quando a seção passa do meio da tela.
  const info = $('#informacoes');
  const atualizar = () => marcarMenu(info.getBoundingClientRect().top < window.innerHeight / 2 ? 'informacoes' : 'mapa');
  window.addEventListener('scroll', atualizar, { passive: true });
  atualizar();
}

/* ---------- Cartela ---------- */
function estadoDoLocal(l) {
  if (l.coletado_em) return 'coletado';
  return estado.participante ? 'ativo' : 'deslogado';
}

/** Posição na grade de 6 colunas: linhas de 3 em zigue-zague, linhas incompletas centralizadas. */
function posicaoNaGrade(i, total) {
  const linha = Math.floor(i / 3);
  const naLinha = Math.min(3, total - linha * 3);
  const k = i % 3;
  const coluna = linha % 2 ? naLinha - 1 - k : k;
  return { linha: linha + 1, inicio: 1 + (3 - naLinha) + coluna * 2 };
}

function conteudoSelo(l, i) {
  const est = estadoDoLocal(l);
  const nome = esc(l.nome);
  const marca = ehFan(l) ? `<span class="selo-marca">${coracao}</span>` : '';
  if (est === 'coletado') {
    return `
      <span class="selo-circulo" style="--giro:${giro(i)}">${seloTinta(i + 1, l.tipo)}${marca}</span>
      <span class="selo-nome caption">${nome}</span>
      <span class="selo-data script-note">${dataHora(l.coletado_em).dia}</span>`;
  }
  return `<span class="selo-circulo">${cadeado()}${marca}</span><span class="selo-nome caption">${nome}</span>`;
}

function rotulo(l) {
  return `${NOME_TIPO[l.tipo] || 'Loja'}. ${rotuloEstado(l)}`;
}

function rotuloEstado(l) {
  const est = estadoDoLocal(l);
  if (est === 'coletado') return `${l.nome}: carimbado em ${dataHora(l.coletado_em).completo}`;
  if (est === 'ativo') return `${l.nome}: ainda não carimbado. Ver missão`;
  return `${l.nome}: bloqueado. Faça login para ver a missão`;
}

function renderCartela() {
  const grade = $('#grade');
  const total = estado.locais.length;
  grade.innerHTML = estado.locais.map((l, i) => {
    const p = posicaoNaGrade(i, total);
    return `
      <li style="grid-row:${p.linha}; grid-column:${p.inicio} / span 2">
        <button class="selo" data-slug="${esc(l.slug)}" data-tipo="${esc(l.tipo || 'loja')}" data-estado="${estadoDoLocal(l)}" aria-label="${esc(rotulo(l))}">${conteudoSelo(l, i)}</button>
      </li>`;
  }).join('');
  $('#cartela-status').hidden = total > 0;
  $('#legenda').hidden = !estado.locais.some(ehFan);

  const coletados = estado.locais.filter((l) => l.coletado_em).length;
  $('#progresso').hidden = !estado.participante;
  $('#progresso-texto').textContent = `${coletados} de ${total}`;
  const barra = $('#progresso-barra');
  barra.setAttribute('aria-valuemax', total);
  barra.setAttribute('aria-valuenow', coletados);
  barra.setAttribute('aria-label', `${coletados} de ${total} carimbos`);
  $('span', barra).style.width = `${total ? (coletados / total) * 100 : 0}%`;
  $('#faixa-completo').hidden = !completo();
  $('#mapa-instrucao').textContent = completo()
    ? 'Todos os carimbos coletados. Que jornada!'
    : 'Toque num carimbo para ver a missão.';

  const conta = $('#conta');
  conta.hidden = !estado.participante;
  if (estado.participante) $('#conta-email').textContent = estado.participante.email;

  requestAnimationFrame(desenharTrilha);
}

function desenharTrilha() {
  const cartela = $('#cartela');
  const circulos = [...cartela.querySelectorAll('.selo-circulo')];
  if (!circulos.length || !cartela.offsetParent) return;
  const base = cartela.getBoundingClientRect();
  const pts = circulos.map((c) => {
    const r = c.getBoundingClientRect();
    return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 };
  });
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (Math.abs(a.y - b.y) < 2) {
      d += ` L${b.x},${b.y}`;
    } else {
      // virada de linha: a curva sai pela lateral da cartela, como num tabuleiro
      const lado = Math.floor((i - 1) / 3) % 2 ? -1 : 1;
      const folga = 56 * lado;
      d += ` C${a.x + folga},${a.y} ${b.x + folga},${b.y} ${b.x},${b.y}`;
    }
  }
  $('#trilha').innerHTML = `<svg width="${base.width}" height="${base.height}" viewBox="0 0 ${base.width} ${base.height}"><path d="${d}"/></svg>`;
}

/* ---------- Detalhe do local ---------- */
function abrirLocal(slug) {
  const l = estado.locais.find((x) => x.slug === slug);
  if (!l) return;
  if (!estado.participante) {
    estado.aposLogin = () => abrirLocal(slug);
    return pedirLogin();
  }
  const i = estado.locais.indexOf(l);
  const q = encodeURIComponent(l.endereco || l.nome);
  const foto = l.foto_qr_url
    ? `<img class="foto-qr" src="${esc(l.foto_qr_url)}" alt="Onde o QR fica em ${esc(l.nome)}" loading="lazy">`
    : `<div class="foto-provisoria">
        <img class="foto-qr" src="${FOTO_PROVISORIA}" alt="Ilustração provisória. A foto de onde o QR fica em ${esc(l.nome)} chega em breve.">
        <span class="chip chip-amarelo caption">foto ilustrativa</span>
      </div>`;
  const el = abrirFolha(`
    <div class="folha-topo">
      <div class="chips">
        <span class="chip ${ehFan(l) ? 'chip-roxo' : 'chip-menta'} caption">${ehFan(l) ? coracao : ''}${NOME_TIPO[l.tipo] || 'Loja'}</span>
        <span class="chip ${l.coletado_em ? 'chip-carimbo' : 'chip-neutro'} caption">${l.coletado_em ? 'Carimbado' : `Parada ${i + 1} de ${estado.locais.length}`}</span>
      </div>
      <h2 class="heading-lg" id="folha-titulo">${esc(l.nome)}</h2>
      ${l.bairro ? `<p class="body-md texto-2">${esc(l.bairro)}</p>` : ''}
    </div>
    ${l.descricao ? `<p class="body-lg">${esc(l.descricao)}</p>` : ''}
    ${l.horario ? `<p class="endereco body-md horario">${relogio}<span>${esc(l.horario)}</span></p>` : ''}
    ${l.coletado_em ? `
      <div class="coletado-em" data-tipo="${esc(l.tipo || 'loja')}">${seloTinta(i + 1, l.tipo)}
        <div><p class="heading-sm">Carimbo coletado!</p><p class="script-note">${dataHora(l.coletado_em).completo}</p></div>
      </div>` : ''}
    <div>
      <p class="endereco body-lg">${pin}<span>${esc(l.endereco)}</span></p>
      <div class="links-mapa">
        <a href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener">Google Maps</a>
        <a href="https://maps.apple.com/?q=${q}" target="_blank" rel="noopener">Apple Maps</a>
      </div>
    </div>
    <figure class="polaroid" style="margin:var(--space-8) var(--space-2) 0">
      ${foto}
      <figcaption class="script-note">o QR fica aqui</figcaption>
    </figure>
    ${l.coletado_em ? '' : `
      <div class="acoes">
        <button class="btn btn-primario btn-bloco" data-acao="estou-aqui">Estou aqui</button>
        <p class="caption texto-2 centro">Você precisa estar no local, com a localização ligada.</p>
      </div>`}`);
  const btn = $('[data-acao="estou-aqui"]', el);
  if (btn) btn.onclick = () => iniciarCheckin(l);
}

/* ---------- Dados ---------- */
async function carregar() {
  const [me, locais] = await Promise.all([api('/me'), api('/locais')]);
  estado.participante = me.dados.participante || null;
  if (locais.ok) estado.locais = locais.dados.locais;
  else $('#cartela-status').textContent = locais.dados.mensagem || 'Não deu para carregar os locais.';
  renderCartela();
}

function carimbar(slug, coletadoEm) {
  const l = estado.locais.find((x) => x.slug === slug);
  if (l) l.coletado_em = coletadoEm;
  renderCartela();
  const circulo = $(`.selo[data-slug="${CSS.escape(slug)}"] .selo-circulo`);
  circulo?.querySelector('.selo-tinta')?.classList.add('batendo');
  circulo?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  navigator.vibrate?.([30, 40, 60]);
  if (completo()) setTimeout(() => mostrarConclusao(estado.locais, estado.participante), 1200);
  else toast('Carimbado! Bora pra próxima parada?');
}

/* ---------- Link do QR (/l/<slug>?t=<token>) ---------- */
function lerLinkDoQr() {
  const m = location.pathname.match(/^\/l\/([^/]+)\/?$/);
  if (!m) return;
  const token = new URLSearchParams(location.search).get('t');
  sessionStorage.setItem(CHAVE_PENDENTE, JSON.stringify({ slug: decodeURIComponent(m[1]), token }));
  history.replaceState(null, '', '/');
}

function retomarCheckinPendente() {
  let pendente;
  try { pendente = JSON.parse(sessionStorage.getItem(CHAVE_PENDENTE)); } catch { /* vazio */ }
  if (!pendente) return;
  const l = estado.locais.find((x) => x.slug === pendente.slug);
  if (!l) return sessionStorage.removeItem(CHAVE_PENDENTE);
  if (!estado.participante) {
    estado.aposLogin = retomarCheckinPendente;
    return pedirLogin(`Entre para carimbar ${l.nome}. Depois do login a gente continua daqui.`);
  }
  sessionStorage.removeItem(CHAVE_PENDENTE);
  if (l.coletado_em) return abrirLocal(l.slug);
  iniciarCheckin(l, { token: pendente.token || undefined });
}

/* ---------- Início ---------- */
async function iniciar() {
  iniciarFolha();
  $('[data-texto-privacidade]').append($('#tpl-privacidade').content.cloneNode(true));

  iniciarMenu();
  $('#grade').addEventListener('click', (e) => {
    const selo = e.target.closest('.selo');
    if (selo) abrirLocal(selo.dataset.slug);
  });
  $('#faixa-completo').addEventListener('click', () => mostrarConclusao(estado.locais, estado.participante));
  $('#btn-sair').addEventListener('click', async () => {
    await api('/auth/sair', { method: 'POST' });
    await carregar();
    irPara('mapa');
    toast('Você saiu. Até a próxima!');
  });
  new ResizeObserver(() => desenharTrilha()).observe($('#cartela'));
  document.fonts?.ready.then(desenharTrilha);

  configurarContas(async (participante) => {
    estado.participante = participante;
    fecharFolha();
    await carregar();
    toast(participante.nome ? `Oi, ${participante.nome}! Bora carimbar?` : 'Tudo certo. Bora carimbar?');
    const depois = estado.aposLogin;
    estado.aposLogin = null;
    depois?.();
  });
  configurarCheckin({
    aoCarimbar: carimbar,
    aoPrecisarLogin: () => { estado.participante = null; renderCartela(); pedirLogin(); },
    aoJaCarimbado: (slug, coletadoEm) => {
      const l = estado.locais.find((x) => x.slug === slug);
      if (l && coletadoEm) l.coletado_em = coletadoEm;
      renderCartela();
      toast('Você já carimbou aqui.');
    },
  });

  lerLinkDoQr();
  await carregar();
  retomarCheckinPendente();
}

iniciar();
