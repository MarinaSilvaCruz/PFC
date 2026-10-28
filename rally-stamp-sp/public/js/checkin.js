import { $, api, esc } from './util.js';
import { abrirFolha, fecharFolha } from './folha.js';
import { pin } from './icones.js';

/** Callbacks: aoCarimbar(slug, coletadoEm), aoPrecisarLogin(), aoJaCarimbado(slug, coletadoEm). */
let cb = {};
export function configurarCheckin(callbacks) { cb = callbacks; }

/**
 * "Estou aqui": a pessoa confirma que chegou ao local e o carimbo sai na hora.
 * Sem QR e sem localização: vale a palavra de ARMY, um carimbo por local.
 */
export async function iniciarCheckin(local, botao) {
  if (botao) {
    botao.disabled = true;
    botao.textContent = 'Carimbando…';
  }
  const r = await api('/checkin', { method: 'POST', body: { slug: local.slug } });
  if (r.ok) {
    fecharFolha();
    return cb.aoCarimbar?.(local.slug, r.dados.coletado_em);
  }
  if (r.status === 401) return cb.aoPrecisarLogin?.();
  if (r.dados.erro === 'ja_carimbado') {
    fecharFolha();
    return cb.aoJaCarimbado?.(local.slug, r.dados.coletado_em);
  }
  erro(local, r.dados.mensagem || 'Não deu certo agora. Tente de novo.');
}

function erro(local, mensagem) {
  const el = abrirFolha(`
    <div class="folha-topo centro">
      <div class="folha-ilustra" style="color: var(--coral-600)">${pin}</div>
      <h2 class="heading-lg" id="folha-titulo">Ainda não foi dessa vez</h2>
      <p class="body-md">${esc(mensagem)}</p>
    </div>
    <div class="acoes">
      <button class="btn btn-secundario btn-bloco" data-acao="tentar">Tentar de novo</button>
      <button class="btn btn-contorno btn-bloco" data-acao="fechar">Fechar</button>
    </div>`);
  $('[data-acao="tentar"]', el).onclick = (e) => iniciarCheckin(local, e.currentTarget);
  $('[data-acao="fechar"]', el).onclick = fecharFolha;
}
