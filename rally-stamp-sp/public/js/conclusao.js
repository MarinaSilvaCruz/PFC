import { $, esc } from './util.js';
import { abrirFolha } from './folha.js';

const cor = (nome) => getComputedStyle(document.documentElement).getPropertyValue(`--${nome}`).trim();

function seloCanvas(ctx, x, y, r, numero, giro) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(giro);
  ctx.fillStyle = cor('stamp-red-100');
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = cor('stamp-red-600');
  ctx.fillStyle = cor('stamp-red-600');
  ctx.lineWidth = r * 0.08;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = r * 0.035;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2); ctx.stroke();
  ctx.textAlign = 'center';
  ctx.font = `${r * 0.25}px "Do Hyeon"`;
  ctx.fillText('RALLY SP', 0, -r * 0.28);
  ctx.font = `${r * 0.66}px "Do Hyeon"`;
  ctx.fillText(String(numero).padStart(2, '0'), 0, r * 0.42);
  ctx.restore();
}

/** Desenha o cartão de "passaporte completo" (1080×1350, formato de post). */
async function desenharCartao(locais, participante) {
  await Promise.all(['64px "Do Hyeon"', '40px "Baloo 2"', '600 40px "Baloo 2"', '56px "Nanum Pen Script"'].map((f) => document.fonts.load(f)));
  const W = 1080;
  const H = 1350;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  ctx.fillStyle = cor('surface-50');
  ctx.fillRect(0, 0, W, H);
  // confete
  const confete = ['coral-500', 'mint-500', 'yellow-500', 'sky-500'];
  for (let i = 0; i < 46; i++) {
    ctx.fillStyle = cor(confete[i % confete.length]);
    const x = (i * 211) % W;
    const y = (i * 137) % H;
    if (y > 300) continue;
    ctx.beginPath(); ctx.arc(x, y, 6 + (i % 4) * 3, 0, Math.PI * 2); ctx.fill();
  }
  // washi tape
  ctx.save();
  ctx.translate(W / 2, 96);
  ctx.rotate(-0.05);
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = cor('coral-500');
  ctx.fillRect(-150, -26, 300, 52);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = cor('ink-900');
  ctx.font = '112px "Do Hyeon"';
  ctx.fillText('Passaporte', W / 2, 250);
  ctx.fillText('completo!', W / 2, 360);
  ctx.font = '500 38px "Baloo 2"';
  ctx.fillStyle = cor('ink-600');
  ctx.fillText(`${locais.length} de ${locais.length} carimbos pelas ruas de São Paulo`, W / 2, 430);

  // cartela
  const cartela = { x: 80, y: 480, w: W - 160, h: 640 };
  ctx.fillStyle = cor('surface-0');
  ctx.beginPath(); ctx.roundRect(cartela.x, cartela.y, cartela.w, cartela.h, 32); ctx.fill();
  const linhas = Math.ceil(locais.length / 3);
  const alturaLinha = (cartela.h - 60) / linhas;
  const r = Math.min(82, alturaLinha * 0.36);
  locais.forEach((l, i) => {
    const linha = Math.floor(i / 3);
    const naLinha = Math.min(3, locais.length - linha * 3);
    const k = i % 3;
    const passo = cartela.w / 3;
    const x0 = cartela.x + (cartela.w - passo * naLinha) / 2 + passo / 2;
    const x = x0 + passo * (linha % 2 ? naLinha - 1 - k : k);
    const y = cartela.y + 40 + alturaLinha * linha + r + 4;
    seloCanvas(ctx, x, y, r, i + 1, ((i * 37) % 17 - 8) * Math.PI / 180);
    ctx.fillStyle = cor('ink-900');
    ctx.font = '600 26px "Baloo 2"';
    const nome = l.nome.replace(/^\[PLACEHOLDER\]\s*/, '');
    ctx.fillText(nome.length > 18 ? `${nome.slice(0, 17)}…` : nome, x, y + r + 36);
  });

  ctx.fillStyle = cor('ink-900');
  if (participante?.nome) {
    ctx.font = '64px "Nanum Pen Script"';
    ctx.fillText(`carimbado por ${participante.nome}`, W / 2, 1200);
  }
  ctx.font = '72px "Do Hyeon"';
  ctx.fillText('Rally Stamp SP', W / 2, 1282);
  ctx.font = '500 28px "Baloo 2"';
  ctx.fillStyle = cor('ink-600');
  ctx.fillText('projeto de fã · não-oficial', W / 2, 1322);

  return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
}

export async function mostrarConclusao(locais, participante) {
  const el = abrirFolha(`
    <div class="folha-topo centro">
      <h2 class="display-sm" id="folha-titulo">Rally completo!</h2>
      <p class="body-md texto-2">Seu passaporte de fã está cheio. Salve a imagem e mostre por aí.</p>
    </div>
    <div class="centro"><div class="girando" aria-hidden="true"></div></div>`);
  const blob = await desenharCartao(locais, participante);
  const url = URL.createObjectURL(blob);
  const arquivo = new File([blob], 'rally-stamp-sp.png', { type: 'image/png' });
  const podeCompartilhar = navigator.canShare?.({ files: [arquivo] });
  el.lastElementChild.outerHTML = `
    <img class="cartao-final" src="${url}" alt="Cartela completa do Rally Stamp SP${participante?.nome ? ` de ${esc(participante.nome)}` : ''}">
    <div class="acoes">
      ${podeCompartilhar ? '<button class="btn btn-primario btn-bloco" data-acao="compartilhar">Compartilhar</button>' : ''}
      <a class="btn ${podeCompartilhar ? 'btn-contorno' : 'btn-primario'} btn-bloco" href="${url}" download="rally-stamp-sp.png">Baixar imagem</a>
    </div>`;
  const btn = $('[data-acao="compartilhar"]', el);
  if (btn) {
    btn.onclick = () => navigator.share({ files: [arquivo], text: 'Completei o Rally Stamp SP!' }).catch(() => {});
  }
}
