import { $, api, esc, ehIOS } from './util.js';
import { abrirFolha, fecharFolha } from './folha.js';
import { camera as iconeCamera, pin } from './icones.js';

/** Callbacks: aoCarimbar(slug, coletadoEm), aoPrecisarLogin(), aoJaCarimbado(slug, coletadoEm). */
let cb = {};
export function configurarCheckin(callbacks) { cb = callbacks; }

function carregando(titulo, texto = '') {
  abrirFolha(`
    <div class="centro folha-topo">
      <div class="girando" aria-hidden="true"></div>
      <h2 class="heading-md" id="folha-titulo" style="margin-top: var(--space-8)">${esc(titulo)}</h2>
      ${texto ? `<p class="body-md texto-2">${esc(texto)}</p>` : ''}
    </div>`);
}

function obterPosicao() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject({ code: 2 });
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  });
}

const posParaDados = (p) => ({ lat: p.coords.latitude, lng: p.coords.longitude, precisao: p.coords.accuracy });

/**
 * Fluxo "Estou aqui": localização → leitor de QR → validação no servidor.
 * Com `token` (QR lido pela câmera normal do celular), pula o leitor.
 */
export async function iniciarCheckin(local, { token } = {}) {
  carregando('Pegando sua localização…', 'Se o celular perguntar, toque em Permitir.');
  let pos;
  try {
    pos = posParaDados(await obterPosicao());
  } catch (err) {
    return ajudaPermissao('localizacao', err?.code === 1, () => iniciarCheckin(local, { token }));
  }
  if (token) return enviar(local, token, pos);
  abrirLeitor(local, pos);
}

const AJUDA = {
  localizacao: {
    titulo: (negada) => (negada ? 'Precisamos da sua localização' : 'Não achamos sua localização'),
    texto: 'É assim que a gente confere que você está no ponto. O site não consegue ligar o GPS sozinho, mas é rapidinho:',
    ios: [
      'Abra <b>Ajustes › Privacidade e Segurança › Serviços de Localização</b> e deixe ativado.',
      'Na mesma tela, toque em <b>Sites do Safari</b> e escolha <b>Durante o Uso</b>.',
      'De volta ao Safari, toque em <b>aA</b> na barra de endereço › <b>Ajustes do Site</b> › <b>Localização: Permitir</b>.',
      'Volte aqui e toque em <b>Tentar de novo</b>.',
    ],
    android: [
      'Puxe a barra de notificações e ative <b>Localização</b> (de preferência com <b>precisão alta</b>).',
      'No Chrome, toque no ícone ao lado do endereço do site › <b>Permissões</b> › <b>Localização: Permitir</b>.',
      'Volte aqui e toque em <b>Tentar de novo</b>.',
    ],
  },
  camera: {
    titulo: () => 'Precisamos da câmera',
    texto: 'A câmera serve só para ler o QR do ponto, aqui mesmo no site. Para liberar:',
    ios: [
      'No Safari, toque em <b>aA</b> na barra de endereço › <b>Ajustes do Site</b> › <b>Câmera: Permitir</b>.',
      'Se não aparecer, abra <b>Ajustes › Safari › Câmera</b> e escolha <b>Permitir</b>.',
      'Volte aqui e toque em <b>Tentar de novo</b>.',
    ],
    android: [
      'No Chrome, toque no ícone ao lado do endereço do site › <b>Permissões</b> › <b>Câmera: Permitir</b>.',
      'Volte aqui e toque em <b>Tentar de novo</b>.',
    ],
  },
};

function ajudaPermissao(tipo, negada, tentarDeNovo) {
  const a = AJUDA[tipo];
  const lista = (itens) => `<ol class="passos-ajuda body-md">${itens.map((i) => `<li>${i}</li>`).join('')}</ol>`;
  const el = abrirFolha(`
    <div class="folha-topo">
      <h2 class="heading-lg" id="folha-titulo">${a.titulo(negada)}</h2>
      <p class="body-md texto-2">${a.texto}</p>
    </div>
    <div class="alternador" role="tablist">
      <button role="tab" data-so="ios">iPhone</button>
      <button role="tab" data-so="android">Android</button>
    </div>
    <div data-painel="ios">${lista(a.ios)}</div>
    <div data-painel="android">${lista(a.android)}</div>
    <button class="btn btn-primario btn-bloco" data-acao="tentar">Tentar de novo</button>`);
  const mostrar = (so) => {
    el.querySelectorAll('[data-so]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.so === so)));
    el.querySelectorAll('[data-painel]').forEach((p) => { p.hidden = p.dataset.painel !== so; });
  };
  el.querySelectorAll('[data-so]').forEach((b) => { b.onclick = () => mostrar(b.dataset.so); });
  mostrar(ehIOS() ? 'ios' : 'android');
  $('[data-acao="tentar"]', el).onclick = tentarDeNovo;
}

/** Extrai o token de um QR: a URL do site (/l/<slug>?t=<token>) ou o token puro. */
export function tokenDoQr(texto) {
  const t = String(texto || '').trim();
  try {
    const url = new URL(t);
    return url.searchParams.get('t') || t;
  } catch {
    return t;
  }
}

let jsQRCarregado;
function carregarJsQR() {
  jsQRCarregado ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = '/vendor/jsQR.js';
    s.onload = () => resolve(window.jsQR);
    s.onerror = reject;
    document.head.append(s);
  });
  return jsQRCarregado;
}

async function criarDetector() {
  if ('BarcodeDetector' in window) {
    try {
      const formatos = await window.BarcodeDetector.getSupportedFormats();
      if (formatos.includes('qr_code')) {
        const det = new window.BarcodeDetector({ formats: ['qr_code'] });
        return async (video) => (await det.detect(video))[0]?.rawValue;
      }
    } catch { /* cai no jsQR */ }
  }
  const jsQR = await carregarJsQR();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  return async (video) => {
    const escala = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * escala);
    canvas.height = Math.round(video.videoHeight * escala);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })?.data;
  };
}

async function abrirLeitor(local, pos) {
  if (!navigator.mediaDevices?.getUserMedia) {
    return erro(local, 'Seu navegador não liberou a câmera para este site. Abra o site no Safari (iPhone) ou no Chrome (Android).', () => abrirLeitor(local, pos));
  }
  let stream;
  let ativo = true;
  let vigia;
  const parar = () => {
    ativo = false;
    stream?.getTracks().forEach((t) => t.stop());
    if (vigia !== undefined) navigator.geolocation.clearWatch(vigia);
  };
  const el = abrirFolha(`
    <div class="folha-topo">
      <h2 class="heading-md" id="folha-titulo">${iconeCamera} Aponte para o QR</h2>
      <p class="body-md texto-2">Procure o QR de <b>${esc(local.nome)}</b> e enquadre dentro do quadrado amarelo.</p>
    </div>
    <div class="leitor">
      <video playsinline muted autoplay></video>
      <div class="leitor-mira" aria-hidden="true"></div>
    </div>
    <button class="btn btn-contorno btn-bloco" data-acao="cancelar">Cancelar</button>`, { onClose: parar });
  $('[data-acao="cancelar"]', el).onclick = fecharFolha;

  // Enquanto a pessoa procura o QR, a posição continua sendo atualizada.
  vigia = navigator.geolocation.watchPosition((p) => { pos = posParaDados(p); }, () => {}, { enableHighAccuracy: true, maximumAge: 0 });

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
  } catch (err) {
    parar();
    const negada = err?.name === 'NotAllowedError' || err?.name === 'SecurityError';
    return ajudaPermissao('camera', negada, () => abrirLeitor(local, pos));
  }
  if (!ativo) return parar();
  const video = $('video', el);
  video.srcObject = stream;
  await video.play().catch(() => {});

  const detectar = await criarDetector();
  const loop = async () => {
    if (!ativo) return;
    if (video.readyState >= 2) {
      const texto = await detectar(video).catch(() => null);
      if (texto && ativo) {
        navigator.vibrate?.(40);
        parar();
        return enviar(local, tokenDoQr(texto), pos);
      }
    }
    setTimeout(loop, 160);
  };
  loop();
}

async function enviar(local, token, pos) {
  carregando('Conferindo…');
  const r = await api('/checkin', { method: 'POST', body: { slug: local.slug, token, ...pos } });
  if (r.ok) {
    fecharFolha();
    return cb.aoCarimbar?.(local.slug, r.dados.coletado_em);
  }
  const e = r.dados.erro;
  if (r.status === 401) return cb.aoPrecisarLogin?.();
  if (e === 'ja_carimbado') {
    fecharFolha();
    return cb.aoJaCarimbado?.(local.slug, r.dados.coletado_em);
  }
  if (e === 'qr_outro_local') {
    return erro(local, `${r.dados.mensagem} Confira se você está no QR de ${local.nome}.`, () => abrirLeitor(local, pos), 'Ler outro QR');
  }
  if (e === 'longe') {
    return erro(local, `${r.dados.mensagem} Chegue mais perto do ponto, de preferência ao ar livre, e tente de novo.`, () => iniciarCheckin(local, { token }));
  }
  erro(local, r.dados.mensagem || 'Não deu certo agora. Tente de novo.', () => iniciarCheckin(local, { token }));
}

function erro(local, mensagem, tentarDeNovo, rotulo = 'Tentar de novo') {
  const el = abrirFolha(`
    <div class="folha-topo centro">
      <div class="folha-ilustra" style="color: var(--coral-600)">${pin}</div>
      <h2 class="heading-lg" id="folha-titulo">Ainda não foi dessa vez</h2>
      <p class="body-md">${esc(mensagem)}</p>
    </div>
    <div class="acoes">
      <button class="btn btn-primario btn-bloco" data-acao="tentar">${esc(rotulo)}</button>
      <button class="btn btn-contorno btn-bloco" data-acao="fechar">Fechar</button>
    </div>`);
  $('[data-acao="tentar"]', el).onclick = tentarDeNovo;
  $('[data-acao="fechar"]', el).onclick = fecharFolha;
}
