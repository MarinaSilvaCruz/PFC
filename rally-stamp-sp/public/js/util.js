export const $ = (sel, raiz = document) => raiz.querySelector(sel);

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/** Chama a API. Nunca lança: devolve { ok, status, dados }. */
export async function api(caminho, { method = 'GET', body } = {}) {
  try {
    const resp = await fetch(`/api${caminho}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    });
    const dados = await resp.json().catch(() => ({}));
    return { ok: resp.ok, status: resp.status, dados };
  } catch {
    return { ok: false, status: 0, dados: { erro: 'rede', mensagem: 'Sem conexão. Confira a internet e tente de novo.' } };
  }
}

export function dataHora(iso) {
  const d = new Date(iso);
  const dia = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return { dia, hora, completo: `${dia} às ${hora}` };
}

let timerToast;
export function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(timerToast);
  timerToast = setTimeout(() => { el.hidden = true; }, 3500);
}

export const ehIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
