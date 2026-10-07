import { $, api, esc, dataHora, toast } from './util.js';
import { abrirFolha, fecharFolha, iniciarFolha } from './folha.js';
import { cadeado, seloTinta, pin } from './icones.js';
import { pedirLogin, configurarContas } from './contas.js';
import { iniciarCheckin, configurarCheckin } from './checkin.js';
import { mostrarConclusao } from './conclusao.js';

const estado = { participante: null, locais: [], aposLogin: null };
const CHAVE_PENDENTE = 'rally:checkin-pendente';

const giro = (i) => `${((i * 37) % 17) - 8}deg`;
const completo = () => estado.locais.length > 0 && estado.locais.every((l) => l.coletado_em);

/* ---------- Abas ---------- */
function trocarAba(nome) {
  document.querySelectorAll('[role="tab"]').forEach((t) => {
    const ativa = t.dataset.aba === nome;
    t.setAttribute('aria-selected', String(ativa));
    t.tabIndex = ativa ? 0 : -1;
    $(`#${t.getAttribute('aria-controls')}`).hidden = !ativa;
  });
  if (nome === 'mapa') desenharTrilha();
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
  if (est === 'coletado') {
    return `
      <span class="selo-circulo" style="--giro:${giro(i)}">${seloTinta(i + 1)}</span>
      <span class="selo-nome caption">${nome}</span>
      <span class="selo-data script-note">${dataHora(l.coletado_em).dia}</span>`;
  }
  return `<span class="selo-circulo">${cadeado()}</span><span class="selo-nome caption">${nome}</span>`;
}

function rotulo(l) {
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
        <button class="selo" data-slug="${esc(l.slug)}" data-estado="${estadoDoLocal(l)}" aria-label="${esc(rotulo(l))}">${conteudoSelo(l, i)}</button>
      </li>`;
  }).join('');
  $('#cartela-status').hidden = total > 0;

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
    : '<div class="foto-qr foto-vazia body-md">A foto de onde o QR está fixado aparece aqui em breve.</div>';
  const el = abrirFolha(`
    <div class="folha-topo">
      <span class="chip ${l.coletado_em ? 'chip-carimbo' : 'chip-menta'} caption">${l.coletado_em ? 'Carimbado' : `Parada ${i + 1} de ${estado.locais.length}`}</span>
      <h2 class="heading-lg" id="folha-titulo">${esc(l.nome)}</h2>
      ${l.bairro ? `<p class="body-md texto-2">${esc(l.bairro)}</p>` : ''}
    </div>
    ${l.coletado_em ? `
      <div class="coletado-em">${seloTinta(i + 1)}
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
    ${l.descricao ? `<p class="body-lg">${esc(l.descricao)}</p>` : ''}
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
  trocarAba('mapa');
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

  document.querySelectorAll('[role="tab"]').forEach((t) => {
    t.addEventListener('click', () => trocarAba(t.dataset.aba));
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const outra = t.dataset.aba === 'mapa' ? 'info' : 'mapa';
        trocarAba(outra);
        $(`[data-aba="${outra}"]`).focus();
      }
    });
  });
  $('#grade').addEventListener('click', (e) => {
    const selo = e.target.closest('.selo');
    if (selo) abrirLocal(selo.dataset.slug);
  });
  $('#faixa-completo').addEventListener('click', () => mostrarConclusao(estado.locais, estado.participante));
  $('#btn-sair').addEventListener('click', async () => {
    await api('/auth/sair', { method: 'POST' });
    await carregar();
    trocarAba('mapa');
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
